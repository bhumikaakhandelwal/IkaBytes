import { Router } from 'express';
import JobPosting, { serializeJob, JOB_STATUSES } from '../models/JobPosting.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { normalizeList } from '../services/skills.js';
import { rankCandidates, scoreCandidate, evidenceLabel } from '../services/matching.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function candidateView(entry, rank, viewer) {
  const p = entry.profile;
  const isYou = viewer.role === 'student' && p.user.toString() === viewer.id;
  // Students see where they stand, but not other students' identities.
  const hide = viewer.role === 'student' && !isYou;
  return {
    id: p._id.toString(),
    userId: hide ? undefined : p.user.toString(),
    rank,
    name: hide ? `Candidate ${rank}` : p.name || 'Unnamed student',
    department: p.department || '',
    cgpa: hide ? undefined : p.cgpa,
    skills: [...new Set([...(p.skills || []), ...(p.extractedSkills || [])])],
    matched: entry.matched,
    missing: entry.missing,
    score: entry.score,
    status: entry.status,
    evidence: evidenceLabel(p),
    reason: entry.reason,
    source: entry.source,
    isYou,
  };
}

// GET /api/jobs?q=react&status=Open
router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  const status = req.query.status || (req.user.role === 'student' ? 'Open' : undefined);
  if (status && status !== 'all') filter.status = status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    filter.$or = [{ title: rx }, { company: rx }, { skills: rx }];
  }
  const jobs = await JobPosting.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ jobs: jobs.map(serializeJob) });
}));

// POST /api/jobs  (TPO)  { title, company, description, skills, minCgpa? }
router.post('/', requireRole('tpo'), asyncHandler(async (req, res) => {
  const { title, company, description = '', skills, minCgpa } = req.body;
  const cleanSkills = normalizeList(skills, { max: 20 });
  if (!title?.trim() || !company?.trim() || cleanSkills.length === 0) {
    throw new HttpError(400, 'Add a role title, company and at least one required skill.');
  }
  const job = await JobPosting.create({
    title: title.trim(),
    company: company.trim(),
    description,
    skills: cleanSkills,
    minCgpa: minCgpa === '' || minCgpa == null ? null : Number(minCgpa),
    postedBy: req.user.id,
  });
  res.status(201).json({ job: serializeJob(job) });
}));

// GET /api/jobs/shortlists?limit=3  (TPO) — top candidates for every job in one call
router.get('/shortlists', requireRole('tpo'), asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 3, 10);
  const [jobs, profiles] = await Promise.all([
    JobPosting.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(100).lean(),
    StudentProfile.find({ 'skillIndex.0': { $exists: true } }).limit(1000).lean(),
  ]);
  const viewer = req.user;
  const shortlists = {};
  for (const job of jobs) {
    const ranked = profiles
      .map((profile) => ({ profile, ...scoreCandidate(job, profile), source: 'rules' }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    shortlists[job._id.toString()] = ranked.map((entry, i) => candidateView(entry, i + 1, viewer));
  }
  res.json({ shortlists });
}));

// GET /api/jobs/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id).lean();
  if (!job) throw new HttpError(404, 'Job not found.');
  res.json({ job: serializeJob(job) });
}));

// PATCH /api/jobs/:id  (TPO)
router.patch('/:id', requireRole('tpo'), asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id);
  if (!job) throw new HttpError(404, 'Job not found.');
  const { title, company, description, skills, status, minCgpa } = req.body;
  if (title !== undefined) job.title = title;
  if (company !== undefined) job.company = company;
  if (description !== undefined) job.description = description;
  if (skills !== undefined) job.skills = normalizeList(skills, { max: 20 });
  if (minCgpa !== undefined) job.minCgpa = minCgpa === '' || minCgpa === null ? null : Number(minCgpa);
  if (status !== undefined) {
    if (!JOB_STATUSES.includes(status)) throw new HttpError(400, 'Status must be Open or Closed.');
    job.status = status;
  }
  await job.save();
  res.json({ job: serializeJob(job) });
}));

// DELETE /api/jobs/:id  (TPO)
router.delete('/:id', requireRole('tpo'), asyncHandler(async (req, res) => {
  const job = await JobPosting.findByIdAndDelete(req.params.id);
  if (!job) throw new HttpError(404, 'Job not found.');
  await Application.deleteMany({ job: job._id });
  res.status(204).end();
}));

// GET /api/jobs/:id/leaderboard?limit=50
router.get('/:id/leaderboard', asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id).lean();
  if (!job) throw new HttpError(404, 'Job not found.');
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  // Only profiles sharing at least one required skill — uses the skillIndex index.
  const keys = job.skills.map((s) => s.toLowerCase());
  const profiles = await StudentProfile.find({ skillIndex: { $in: keys } }).limit(1000).lean();

  const ranked = await rankCandidates(job, profiles);
  let candidates = ranked.slice(0, limit).map((entry, i) => candidateView(entry, i + 1, req.user));

  // Make sure a student always sees their own position, even outside the top N.
  if (req.user.role === 'student' && !candidates.some((c) => c.isYou)) {
    const idx = ranked.findIndex((e) => e.profile.user.toString() === req.user.id);
    if (idx >= 0) candidates.push(candidateView(ranked[idx], idx + 1, req.user));
  }

  let application = null;
  if (req.user.role === 'student') {
    application = await Application.findOne({ job: job._id, student: req.user.id }).select('status createdAt').lean();
  }

  res.json({ job: serializeJob(job), total: ranked.length, candidates, application });
}));

// POST /api/jobs/:id/apply  (student)
router.post('/:id/apply', requireRole('student'), asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id).lean();
  if (!job) throw new HttpError(404, 'Job not found.');
  if (job.status !== 'Open') throw new HttpError(400, 'This role is no longer accepting applications.');

  const profile = await StudentProfile.findOne({ user: req.user.id }).lean();
  if (!profile) throw new HttpError(400, 'Complete your profile before applying.');

  const { score } = scoreCandidate(job, profile);
  try {
    const application = await Application.create({
      job: job._id,
      student: req.user.id,
      profile: profile._id,
      matchScore: score,
      jobSnapshot: { title: job.title, company: job.company },
      studentSnapshot: {
        name: profile.name,
        department: profile.department,
        cgpa: profile.cgpa,
        skills: profile.skills,
      },
    });
    await JobPosting.updateOne({ _id: job._id }, { $inc: { applicantCount: 1 } });
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'You have already applied to this role.');
    throw err;
  }
}));

// GET /api/jobs/:id/applications  (TPO)
router.get('/:id/applications', requireRole('tpo'), asyncHandler(async (req, res) => {
  const applications = await Application.find({ job: req.params.id }).sort({ matchScore: -1 }).lean();
  res.json({ applications });
}));

export default router;
