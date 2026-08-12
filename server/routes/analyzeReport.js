import express from 'express';
import { analyzeReportImage } from '../lib/openRouterClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid imageBase64 parameter' });
    }

    const result = await analyzeReportImage(imageBase64, mimeType || 'image/jpeg');
    return res.json(result);
  } catch (error) {
    console.error('Error analyzing report photo:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while analyzing the photo',
    });
  }
});

export default router;
