import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeReportRouter from './routes/analyzeReport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/analyze-report', analyzeReportRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Public Infrastructure AI Auto-Fill Service' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
