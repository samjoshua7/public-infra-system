import dotenv from 'dotenv';
dotenv.config();

/**
 * Calls Gemini API to analyze an infrastructure image and extract structured JSON details.
 * @param {string} photoUrl - Public URL of the image stored in Supabase
 * @returns {Promise<{title: string, description: string, category: string}>}
 */
export async function analyzeReportImage(photoUrl) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }

  // 1. Fetch image content
  const imgResponse = await fetch(photoUrl);
  if (!imgResponse.ok) {
    throw new Error(`Could not download photo from storage (HTTP ${imgResponse.status})`);
  }

  const arrayBuffer = await imgResponse.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

  const promptText = `You are a civic infrastructure inspector. Analyze this image of a public infrastructure issue.
Return ONLY a raw JSON object (without markdown backticks, without formatting blocks) containing:
{
  "title": "Short descriptive title (max 10 words)",
  "description": "Clear description of the damage, location context, and potential safety hazard (2-3 sentences)",
  "category": "pothole"
}

Category MUST be exactly one of: "pothole", "streetlight", "traffic_light", "garbage", "other".`;

  // 2. Call Gemini REST API directly for maximum reliability and simplicity
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const aiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error('Gemini API Error details:', errText);
    throw new Error(`Gemini API returned HTTP ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean JSON string
  const cleanedJson = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedJson);
  } catch (parseErr) {
    console.error('Failed to parse Gemini output:', rawText);
    throw new Error('Gemini output was not valid JSON');
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
