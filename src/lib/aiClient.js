const EXPRESS_API_URL = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:5000';

/**
 * Converts a File to a base64 string (no data: prefix).
 * @param {File} file
 * @returns {Promise<string>}
 */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Call the Express AI endpoint to analyze a photo — sent directly as base64,
 * with multi-model fallbacks and client-side emergency resilience.
 * @param {File} photoFile - The image file
 * @returns {Promise<{title: string, description: string, category: string, modelUsed?: string, isFallback?: boolean}>}
 */
export const analyzeReportPhoto = async (photoFile) => {
  try {
    const imageBase64 = await fileToBase64(photoFile);

    const response = await fetch(`${EXPRESS_API_URL}/api/analyze-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64, mimeType: photoFile.type || 'image/jpeg' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('[aiClient] AI request warning:', err.message);
    // Return complete fallback fields so the citizen is never left with an empty form
    return {
      title: 'Reported Public Infrastructure Issue',
      description: 'Public infrastructure issue photographed and submitted by citizen. Please verify and refine details below.',
      category: 'other',
      isFallback: true,
      error: err.message,
    };
  }
};
