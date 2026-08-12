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
 * with no dependency on the photo already being uploaded anywhere.
 * @param {File} photoFile - The (ideally already-compressed) image file
 * @returns {Promise<{title: string, description: string, category: string}>}
 */
export const analyzeReportPhoto = async (photoFile) => {
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
    throw new Error(errorData.error || 'Failed to analyze photo with AI service');
  }

  const data = await response.json();
  return data;
};
