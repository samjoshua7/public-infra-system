const EXPRESS_API_URL = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:5000';

/**
 * Call the Express AI endpoint to analyze a photo uploaded to Supabase Storage.
 * @param {string} photoUrl - Public URL of the uploaded image
 * @returns {Promise<{title: string, description: string, category: string}>}
 */
export const analyzeReportPhoto = async (photoUrl) => {
  const response = await fetch(`${EXPRESS_API_URL}/api/analyze-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze photo with AI service');
  }

  const data = await response.json();
  return data;
};
