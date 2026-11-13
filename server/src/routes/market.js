import { Router } from 'express';
import JobPosting from '../models/JobPosting.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/market/demand?limit=6 — most-requested skills across open postings
router.get('/demand', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 6, 20);
  const rows = await JobPosting.aggregate([
    { $match: { status: 'Open' } },
    { $unwind: '$skills' },
    { $group: { _id: { $toLower: '$skills' }, skill: { $first: '$skills' }, count: { $sum: 1 } } },
    { $sort: { count: -1, skill: 1 } },
    { $limit: limit },
    { $project: { _id: 0, skill: 1, count: 1 } },
  ]);
  res.json({ demand: rows });
}));

export default router;
