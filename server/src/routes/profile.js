import fs from 'node:fs/promises';
import { Router } from 'express';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { resumeUpload } from '../middleware/upload.js';
import { normalizeList, normalizeSkills, safeUrl, extractSkillsFromText, parseResumeText } from '../services/skills.js';
import { queueAnalysis, isStale } from '../services/insights.js';
import { isLLMConfigured } from '../services/llm.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();

// Asks for AI suggestions in the background (runs only if the inputs changed)
// and returns the profile with the up-to-date status.
async function respondWithAnalysis(res, profileId, extra = {}) {
  const outcome = await queueAnalysis(profileId);
  const fresh = await StudentProfile.findById(profileId);
  res.json({ profile: { ...fresh.toPublic(), ...extra }, ai: outcome });
}

async function getOrCreateProfile(userId) {
  let profile = await StudentProfile.findOne({ user: userId });
  if (!profile) {
    const user = await User.findById(userId);
    profile = await StudentProfile.create({ user: userId, name: user?.name || '', email: user?.email });
  }
  return profile;
}

// GET /api/profile/me
router.get('/me', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  res.json({ profile: profile.toPublic() });
}));

// PUT /api/profile/me  { name, department, cgpa, linkedin, skills, certifications, projects }
router.put('/me', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  const { name, department, cgpa, linkedin, skills, certifications, certificationLinks, projects } = req.body;

  if (name !== undefined) profile.name = String(name).trim().slice(0, 120);
  if (department !== undefined) profile.department = String(department).trim().slice(0, 120);
  if (linkedin !== undefined) profile.linkedin = String(linkedin).trim().slice(0, 300);
  if (cgpa !== undefined) {
    if (cgpa === '' || cgpa === null) profile.cgpa = null;
    else {
      const value = Number(cgpa);
      if (Number.isNaN(value) || value < 0 || value > 10) throw new HttpError(400, 'CGPA must be between 0 and 10.');
      profile.cgpa = Math.round(value * 100) / 100;
    }
  }
  if (skills !== undefined) profile.skills = normalizeSkills(skills);
  if (certifications !== undefined) profile.certifications = normalizeList(certifications, { max: 20 });
  if (certificationLinks !== undefined || certifications !== undefined) {
    // Keep only links for certifications that still exist, and only real http(s) URLs
    const incoming = Array.isArray(certificationLinks) ? certificationLinks : profile.certificationLinks || [];
    const names = new Set(profile.certifications.map((c) => c.toLowerCase()));
    const bad = incoming.filter((l) => l?.url && !safeUrl(l.url)).map((l) => l.name);
    if (bad.length) throw new HttpError(400, `Credential link for "${bad[0]}" is not a valid web address.`);
    profile.certificationLinks = incoming
      .filter((l) => l?.name && names.has(String(l.name).toLowerCase()) && safeUrl(l.url))
      .map((l) => ({ name: String(l.name).slice(0, 200), url: safeUrl(l.url) }));
  }
  if (projects !== undefined) profile.projects = normalizeList(projects, { max: 20 });

  await profile.save();
  if (name !== undefined) await User.updateOne({ _id: req.user.id }, { name: profile.name });
  await respondWithAnalysis(res, profile._id);
}));

// POST /api/profile/me/resume  (multipart/form-data, field "resume")
router.post(
  '/me/resume',
  requireAuth,
  requireRole('student'),
  resumeUpload.single('resume'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose a resume file to upload.');
    const profile = await StudentProfile.findOne({ user: req.user.id }).select('+resume.path')
      || (await getOrCreateProfile(req.user.id));

    const oldPath = profile.resume?.path;
    profile.resume = {
      path: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
    };

    // Parse text from uploaded resume (PDF, DOCX, TXT) and extract detected skills
    const text = (await parseResumeText(req.file.path, req.file.originalname)) || '';
    profile.extractedSkills = extractSkillsFromText(text);
    // Saved so the AI can use it later without re-reading the file
    profile.resumeText = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 20000);

    await profile.save();
    if (oldPath && oldPath !== req.file.path) fs.unlink(oldPath).catch(() => {});
    // resumeReadable is false for scanned PDFs (images) — the AI then works from the profile only
    await respondWithAnalysis(res, profile._id, { resumeReadable: text.trim().length > 50 });
  })
);

// GET /api/profile/me/insights — cached AI suggestions (no Groq call). Poll while status is "pending".
router.get('/me/insights', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  const insights = profile.toPublic().aiInsights;
  res.json({
    aiEnabled: isLLMConfigured(),
    insights,
    // true when new jobs were posted or the profile changed since these suggestions were made
    stale: insights.status === 'ready' ? await isStale(profile._id) : false,
    extractedSkills: profile.extractedSkills,
  });
}));

// POST /api/profile/me/insights/refresh — calls Groq only if something changed since last time
router.post('/me/insights/refresh', requireAuth, requireRole('student'), asyncHandler(async (req, res) => {
  if (!isLLMConfigured()) throw new HttpError(503, 'AI suggestions are not set up on the server yet.');
  const profile = await getOrCreateProfile(req.user.id);
  const outcome = await queueAnalysis(profile._id);
  if (outcome === 'limit') {
    throw new HttpError(429, "You've reached today's limit for AI suggestions. Try again tomorrow.");
  }
  const fresh = await StudentProfile.findById(profile._id);
  res.json({
    ai: outcome,
    insights: fresh.toPublic().aiInsights,
    message: outcome === 'cached' ? 'Your suggestions are already up to date.' : 'Analysing your profile…',
  });
}));

// GET /api/profile/:userId/resume — the student themself or any placement officer
router.get('/:userId/resume', requireAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'tpo' && req.user.id !== userId) throw new HttpError(403, 'You cannot view this resume.');
  const profile = await StudentProfile.findOne({ user: userId }).select('+resume.path');
  if (!profile?.resume?.path) throw new HttpError(404, 'No resume uploaded.');
  res.download(profile.resume.path, profile.resume.originalName);
}));

export default router;
