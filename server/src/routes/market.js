import { Router } from 'express';
import JobPosting from '../models/JobPosting.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { canonicalSkill, skillKey } from '../services/skills.js';

const router = Router();

// GET /api/market/demand?limit=6 — most-requested skills across open postings.
// Grouped by skillKey so "Node", "nodejs" and "Node.js" are counted together.
router.get('/demand', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 6, 20);
  const jobs = await JobPosting.find({ status: 'Open' }).select('skills').lean();
  const counts = new Map();
  for (const job of jobs) {
    for (const key of new Set((job.skills || []).map(skillKey))) {
      if (!key) continue;
      const name = canonicalSkill(job.skills.find((s) => skillKey(s) === key));
      const row = counts.get(key) || { skill: name, count: 0 };
      row.count += 1;
      counts.set(key, row);
    }
  }
  const demand = [...counts.values()]
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, limit);
  res.json({ demand });
}));

export default router;
