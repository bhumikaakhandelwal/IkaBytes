import { Router } from 'express';
import Application, { APPLICATION_STATUSES } from '../models/Application.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// GET /api/applications/me  (student)
router.get('/me', requireRole('student'), asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user.id })
    .sort({ createdAt: -1 })
    .select('job status matchScore jobSnapshot createdAt')
    .lean();
  res.json({ applications });
}));

// PATCH /api/applications/:id  (TPO)  { status }
router.patch('/:id', requireRole('tpo'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new HttpError(400, `Status must be one of: ${APPLICATION_STATUSES.join(', ')}.`);
  }
  const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
  if (!application) throw new HttpError(404, 'Application not found.');
  res.json({ application });
}));

export default router;
