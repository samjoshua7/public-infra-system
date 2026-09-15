import dotenv from 'dotenv';
dotenv.config();

/**
 * Normalizes raw category text or synonyms to the strict database enum:
 * 'pothole' | 'streetlight' | 'traffic_light' | 'garbage' | 'other'
 * @param {string} rawCategory
 * @returns {string}
 */
export function normalizeCategory(rawCategory) {
  if (!rawCategory) return 'other';
  const clean = String(rawCategory).toLowerCase().trim().replace(/[-_]/g, ' ');

  if (
    clean.includes('pothole') ||
    clean.includes('road') ||
    clean.includes('asphalt') ||
    clean.includes('pavement') ||
    clean.includes('hole') ||
    clean.includes('crack')
  ) {
    return 'pothole';
  }
  if (
    (clean.includes('street') && clean.includes('light')) ||
    clean.includes('lamp') ||
    clean.includes('lantern') ||
    clean.includes('light pole') ||
    clean.includes('lighting')
  ) {
    return 'streetlight';
  }
  if (
    clean.includes('traffic') ||
    clean.includes('signal') ||
    clean.includes('stoplight') ||
    clean.includes('red light')
  ) {
    return 'traffic_light';
  }
  if (
    clean.includes('garbage') ||
    clean.includes('trash') ||
    clean.includes('waste') ||
    clean.includes('litter') ||
    clean.includes('dump') ||
    clean.includes('rubbish') ||
    clean.includes('debris')
  ) {
    return 'garbage';
  }
  return 'other';
}

/**
 * Robust JSON extraction from model outputs, stripping backticks and finding JSON blocks.
 * @param {string} rawText
 * @returns {object|null}
 */
export function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Try stripping markdown blocks
  const stripped = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch (_) {}

  // 2. Find first {...} block using regex
  const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (_) {}
  }

  return null;
}

/**
 * Ensures title, description, and category are completely populated and high quality.
 * @param {object} data
 * @returns {{title: string, description: string, category: string}}
 */
export function ensureCompleteFields(data = {}) {
  const category = normalizeCategory(data?.category);
  let title = (data?.title || '').trim();
  let description = (data?.description || '').trim();

  const defaultTitles = {
    pothole: 'Severe Road Pothole Damage',
    streetlight: 'Malfunctioning Public Streetlight',
    traffic_light: 'Damaged Traffic Signal Infrastructure',
    garbage: 'Public Waste Accumulation',
    other: 'Reported Public Infrastructure Issue',
  };

  const defaultDescriptions = {
    pothole: 'Road pavement deterioration and hazardous pothole detected on public roadway. Poses safety risks to vehicles and pedestrians.',
    streetlight: 'Public streetlight fixture reported out of service or physically damaged. Reduced nighttime visibility in the area.',
    traffic_light: 'Traffic control signal malfunction or physical damage reported, impacting traffic flow and intersection safety.',
    garbage: 'Accumulation of uncollected public waste and litter causing environmental and health concerns in the surrounding vicinity.',
    other: 'Public infrastructure issue photographed and submitted by citizen requiring inspection and maintenance by municipal authorities.',
  };

  if (!title || title.length < 3) {
    title = defaultTitles[category] || defaultTitles.other;
  }
  if (!description || description.length < 10) {
    description = defaultDescriptions[category] || defaultDescriptions.other;
  }

  return { title, description, category };
}

/**
 * Calls OpenRouter API with prioritized multi-model sequential fallbacks.
 * @param {string} base64Image - Base64-encoded image data (no data: prefix)
 * @param {string} mimeType - Image MIME type, e.g. 'image/jpeg'
 * @returns {Promise<{title: string, description: string, category: string, modelUsed?: string, isFallback?: boolean}>}
 */
export async function analyzeReportImage(base64Image, mimeType = 'image/jpeg') {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY not configured. Using heuristic fallback.');
    return {
      ...ensureCompleteFields({ category: 'other' }),
      isFallback: true,
    };
  }

  // Build list of candidate models in prioritized order
  const primaryModel = process.env.OPENROUTER_MODEL || 'inclusionai/ling-3.0-flash-vl:free';
  const fallbackEnv =
    process.env.OPENROUTER_FALLBACK_MODELS ||
    'google/gemma-4-26b-a4b-it:free,google/gemma-4-31b-it:free,inclusionai/ling-3.0-flash-vl';

  const fallbackModels = fallbackEnv
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  const candidateModels = Array.from(new Set([primaryModel, ...fallbackModels]));

  const promptText = `You are an expert civic infrastructure inspector. Analyze this image of a public infrastructure problem.
Return ONLY a raw JSON object (without markdown backticks, without formatting blocks) containing:
{
  "title": "Short descriptive title identifying the exact problem and location context (max 10 words)",
  "description": "Clear description of the damage, location context, and potential safety hazard for pedestrians or motorists (2-3 sentences)",
  "category": "pothole"
}

Category MUST be exactly one of: "pothole", "streetlight", "traffic_light", "garbage", "other".`;

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  // Iterate sequentially through candidate models
  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    console.log(`[OpenRouter] Attempting analysis with model [${i + 1}/${candidateModels.length}]: ${currentModel}`);

    // Up to 3 models for OpenRouter internal router fallback
    const routerFallbacks = candidateModels.slice(i, i + 3);

    const payload = {
      model: currentModel,
      models: routerFallbacks,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000); // 18s per model timeout

    try {
      const aiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://civicvoice.local',
          'X-Title': 'Civic Voice',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!aiResponse.ok) {
        const errText = await aiResponse.text().catch(() => '');
        console.warn(
          `[OpenRouter] Model ${currentModel} failed with HTTP ${aiResponse.status}: ${errText.slice(0, 150)}`
        );
        // Continue to next fallback model in the list
        continue;
      }

      const result = await aiResponse.json();
      const rawText = result.choices?.[0]?.message?.content || '';

      const parsed = extractJsonFromText(rawText);
      if (!parsed) {
        console.warn(`[OpenRouter] Model ${currentModel} returned invalid JSON: "${rawText.slice(0, 100)}"`);
        continue;
      }

      const verified = ensureCompleteFields(parsed);
      console.log(`[OpenRouter] Successfully analyzed report with model ${currentModel}:`, verified.title);

      return {
        ...verified,
        modelUsed: currentModel,
      };
    } catch (err) {
      clearTimeout(timeout);
      console.warn(`[OpenRouter] Error calling ${currentModel}: ${err.message}. Trying next fallback...`);
    }
  }

  // If all external AI models are exhausted or rate-limited, provide graceful complete heuristic defaults
  console.error('[OpenRouter] All candidate models exhausted or rate-limited. Using resilient civic defaults.');
  return {
    ...ensureCompleteFields({ category: 'other' }),
    isFallback: true,
  };
}
