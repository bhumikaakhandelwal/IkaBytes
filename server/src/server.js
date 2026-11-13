import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import marketRoutes from './routes/market.js';
import { notFound, errorHandler } from './middleware/error.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, ai: Boolean(process.env.AI_SERVICE_URL) }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/market', marketRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`SkillMatch API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
