import express from 'express';
import { analyzeReportImage } from '../lib/geminiClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl || typeof photoUrl !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid photoUrl parameter' });
    }

    const result = await analyzeReportImage(photoUrl);
    return res.json(result);
  } catch (error) {
    console.error('Error analyzing report photo:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while analyzing the photo',
    });
  }
});

export default router;
