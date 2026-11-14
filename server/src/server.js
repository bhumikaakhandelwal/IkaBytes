import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import marketRoutes from './routes/market.js';
import studentRoutes from './routes/students.js';
import analyticsRoutes from './routes/analytics.js';
import { notFound, errorHandler } from './middleware/error.js';
import { resetStuckAnalyses } from './services/insights.js';
import { isLLMConfigured, llmConfig } from './services/llm.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, aiSuggestions: isLLMConfigured(), aiRanking: Boolean(process.env.AI_SERVICE_URL) }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => resetStuckAnalyses())
  .then(() => app.listen(PORT, () => {
    console.log(`SkillMatch API running on http://localhost:${PORT}`);
    console.log(isLLMConfigured()
      ? `AI suggestions enabled (model: ${llmConfig().model})`
      : 'AI suggestions disabled: set GROQ_API_KEY in server/.env');
  }))
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
