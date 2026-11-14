// Student directory and full profiles for placement officers (TPO only).
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import StudentProfile from '../models/StudentProfile.js';
import JobPosting, { serializeJob } from '../models/JobPosting.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { scoreCandidate } from '../services/matching.js';
import { safeUrl, skillKey } from '../services/skills.js';
import { proofsFor, certFileExists, certFilePath } from '../services/certificates.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('tpo'));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  name: { name: 1 },
  cgpa: { cgpa: -1, name: 1 },
  updated: { updatedAt: -1 },
};

function allSkills(p) {
  const seen = new Set();
  return [...(p.skills || []), ...(p.extractedSkills || [])].filter((s) => {
    const k = skillKey(s);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function missingInfo(p) {
  const missing = [];
  if (!allSkills(p).length) missing.push('skills');
  if (!p.resume?.originalName) missing.push('resume');
  if (p.cgpa == null) missing.push('CGPA');
  if (!p.department) missing.push('department');
  return missing;
}

// GET /api/students?q=&department=&minCgpa=&skill=&hasResume=1&sort=name|cgpa|updated&page=1&limit=20
router.get('/', asyncHandler(async (req, res) => {
  const { q, department, minCgpa, skill, hasResume, sort = 'name' } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const filter = {};
  const and = [];
  if (q && String(q).trim()) {
    const text = String(q).trim();
    const rx = new RegExp(escapeRegex(text), 'i');
    and.push({ $or: [{ name: rx }, { email: rx }, { skillIndex: { $in: [text.toLowerCase(), skillKey(text)] } }] });
  }
  if (department) filter.department = department;
  if (minCgpa !== undefined && minCgpa !== '') {
    const n = Number(minCgpa);
    if (Number.isNaN(n)) throw new HttpError(400, 'minCgpa must be a number.');
    filter.cgpa = { $gte: n };
  }
  if (skill) and.push({ skillIndex: { $in: [String(skill).toLowerCase(), skillKey(skill)] } });
  if (hasResume === '1' || hasResume === 'true') filter['resume.originalName'] = { $exists: true, $ne: null };
  if (and.length) filter.$and = and;

  const [total, rows, departments] = await Promise.all([
    StudentProfile.countDocuments(filter),
    StudentProfile.find(filter)
      .sort(SORTS[sort] || SORTS.name)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email department cgpa skills extractedSkills certifications projects resume.originalName updatedAt')
      .lean(),
    StudentProfile.distinct('department'),
  ]);

  res.json({
    students: rows.map((p) => {
      const skills = allSkills(p);
      return {
        id: p._id.toString(),
        name: p.name || 'Unnamed student',
        email: p.email,
        department: p.department || '',
        cgpa: p.cgpa ?? null,
        topSkills: skills.slice(0, 6),
        skillCount: skills.length,
        certCount: p.certifications?.length || 0,
        projectCount: p.projects?.length || 0,
        hasResume: Boolean(p.resume?.originalName),
        missing: missingInfo(p),
        updatedAt: p.updatedAt,
      };
    }),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    departments: departments.filter(Boolean).sort(),
  });
}));

// GET /api/students/:id — full profile, fit for every open role, and shortlists
router.get('/:id', asyncHandler(async (req, res) => {
  const p = await StudentProfile.findById(req.params.id).select('+resume.path').lean();
  if (!p) throw new HttpError(404, 'Student not found.');

  const [openJobs, shortlistedJobs] = await Promise.all([
    JobPosting.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(100).lean(),
    JobPosting.find({ shortlisted: p._id }).select('title company status').lean(),
  ]);

  const listedKeys = new Set((p.skills || []).map(skillKey));
  const resumeAvailable = Boolean(p.resume?.path && fs.existsSync(p.resume.path));

  res.json({
    student: {
      id: p._id.toString(),
      name: p.name || 'Unnamed student',
      email: p.email,
      department: p.department || '',
      cgpa: p.cgpa ?? null,
      linkedin: safeUrl(p.linkedin),
      linkedinRaw: p.linkedin || '',
      skillsListed: p.skills || [],
      // Found by the resume reader but not typed by the student
      skillsFromResume: (p.extractedSkills || []).filter((s) => !listedKeys.has(skillKey(s))),
      // Each certification with its proof: a credential link or an uploaded PDF
      certifications: proofsFor(p).map((c) => ({
        name: c.name,
        url: safeUrl(c.url),
        file: c.fileKey ? { key: c.fileKey, name: c.fileName, available: certFileExists(c.fileKey) } : null,
      })),
      projects: (p.projects || []).map((raw) => ({ raw, url: safeUrl(raw) })),
      resume: p.resume?.originalName
        ? {
          originalName: p.resume.originalName,
          uploadedAt: p.resume.uploadedAt,
          available: resumeAvailable,
          isPdf: path.extname(p.resume.originalName).toLowerCase() === '.pdf',
        }
        : null,
      missing: missingInfo(p),
      updatedAt: p.updatedAt,
    },
    fits: openJobs
      .map((job) => {
        const r = scoreCandidate(job, p);
        return {
          job: serializeJob(job),
          score: r.score,
          status: r.status,
          eligible: r.eligible,
          matched: r.matched,
          missing: r.missing,
          reason: r.reason,
          shortlisted: (job.shortlisted || []).some((id) => id.toString() === p._id.toString()),
        };
      })
      .sort((a, b) => b.score - a.score),
    shortlistedFor: shortlistedJobs.map((j) => ({ jobId: j._id.toString(), title: j.title, company: j.company, status: j.status })),
  });
}));

// GET /api/students/:id/resume — PDFs open in the browser; other files download
router.get('/:id/resume', asyncHandler(async (req, res) => {
  const p = await StudentProfile.findById(req.params.id).select('+resume.path').lean();
  if (!p?.resume?.originalName) throw new HttpError(404, 'This student has not uploaded a resume.');
  if (!p.resume.path || !fs.existsSync(p.resume.path)) {
    throw new HttpError(404, 'Resume file is not on this server (it may have been uploaded on another computer). Ask the student to upload it again.');
  }
  const isPdf = path.extname(p.resume.originalName).toLowerCase() === '.pdf';
  const safeName = p.resume.originalName.replace(/[^\w.\- ]+/g, '_');
  res.setHeader('Content-Type', isPdf ? 'application/pdf' : (p.resume.mimeType || 'application/octet-stream'));
  res.setHeader('Content-Disposition', `${isPdf ? 'inline' : 'attachment'}; filename="${safeName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.resolve(p.resume.path));
}));

// GET /api/students/:id/certificates/:fileKey — a certificate PDF uploaded by the student
router.get('/:id/certificates/:fileKey', asyncHandler(async (req, res) => {
  const p = await StudentProfile.findById(req.params.id).select('certificationProofs').lean();
  const proof = (p?.certificationProofs || []).find((c) => c.fileKey && c.fileKey === req.params.fileKey);
  if (!proof) throw new HttpError(404, 'Certificate not found.');
  if (!certFileExists(proof.fileKey)) {
    throw new HttpError(404, 'Certificate file is not on this server (it may have been uploaded on another computer). Ask the student to upload it again.');
  }
  const safeName = (proof.fileName || 'certificate.pdf').replace(/[^\w.\- ]+/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(certFilePath(proof.fileKey));
}));

export default router;
