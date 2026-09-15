import express from 'express';
import { analyzeReportImage } from '../lib/openRouterClient.js';

const router = express.Router();

// Simple in-memory rate limiter per IP (10 requests / minute)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const userRecord = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > userRecord.resetTime) {
    userRecord.count = 0;
    userRecord.resetTime = now + RATE_LIMIT_WINDOW_MS;
  }

  if (userRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute before analyzing another photo.',
    });
  }

  userRecord.count += 1;
  requestCounts.set(ip, userRecord);
  next();
}

router.post('/', rateLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid imageBase64 parameter' });
    }

    // Limit maximum base64 payload size (~15MB string limit)
    if (imageBase64.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image size exceeds maximum allowed limit (10MB).' });
    }

    const result = await analyzeReportImage(imageBase64, mimeType || 'image/jpeg');
    return res.json(result);
  } catch (error) {
    console.error('Error analyzing report photo:', error);
    // Graceful complete fallback to guarantee form auto-fill never breaks
    return res.json({
      title: 'Reported Public Infrastructure Issue',
      description: 'Public infrastructure issue photographed by citizen. Please verify and refine details below.',
      category: 'other',
      isFallback: true,
      error: error.message,
    });
  }
});

export default router;
