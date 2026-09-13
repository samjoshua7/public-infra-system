import dotenv from 'dotenv';
dotenv.config();

/**
 * Calls OpenRouter API to analyze an infrastructure image and extract structured JSON details.
 * @param {string} base64Image - Base64-encoded image data (no data: prefix)
 * @param {string} mimeType - Image MIME type, e.g. 'image/jpeg'
 * @returns {Promise<{title: string, description: string, category: string}>}
 */
export async function analyzeReportImage(base64Image, mimeType) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in server/.env');
  }

  const promptText = `You are a civic infrastructure inspector. Analyze this image of a public infrastructure issue.
Return ONLY a raw JSON object (without markdown backticks, without formatting blocks) containing:
{
  "title": "Short descriptive title (max 10 words)",
  "description": "Clear description of the damage, location context, and potential safety hazard (2-3 sentences)",
  "category": "pothole"
}

Category MUST be exactly one of: "pothole", "streetlight", "traffic_light", "garbage", "other".`;

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  const payload = {
    model,
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
    temperature: 0.2,
  };

  const aiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://civicvoice.local',
      'X-Title': 'Civic Voice',
    },
    body: JSON.stringify(payload),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error('OpenRouter API Error details:', errText);
    throw new Error(`OpenRouter API returned HTTP ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const rawText = result.choices?.[0]?.message?.content || '';

  // Clean JSON string
  const cleanedJson = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedJson);
  } catch (parseErr) {
    console.error('Failed to parse OpenRouter output:', rawText);
    throw new Error('OpenRouter output was not valid JSON');
  }

  // Validate fields and normalize category
  const validCategories = ['pothole', 'streetlight', 'traffic_light', 'garbage', 'other'];
  const category = validCategories.includes(parsedData.category)
    ? parsedData.category
    : 'other';

  return {
    title: parsedData.title || 'Reported Infrastructure Issue',
    description: parsedData.description || 'Public infrastructure issue reported by citizen.',
    category,
  };
}
