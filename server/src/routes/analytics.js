// Skill-gap analytics for placement officers: which skills the posted jobs ask for,
// and how many students don't show them yet — to plan cohort sessions.
import { Router } from 'express';
import StudentProfile from '../models/StudentProfile.js';
import JobPosting from '../models/JobPosting.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { canonicalSkill, skillKey } from '../services/skills.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('tpo'));

const DAY = 24 * 60 * 60 * 1000;
const TREND_WINDOW_DAYS = 30;
const MIN_POSTINGS_FOR_TREND = 6; // fewer recent postings than this → trends are just noise

/** Can this student apply to this job (department + CGPA cut-off)? Unknown values count as eligible. */
function isEligible(job, p) {
  const deptOk = !job.department || job.department === 'All Departments' || !p.department
    || p.department.toLowerCase() === job.department.toLowerCase();
  const cgpaOk = job.minCgpa == null || p.cgpa == null || p.cgpa >= job.minCgpa;
  return deptOk && cgpaOk;
}

/**
 * Core calculation shared by both endpoints.
 * @param {object} opts
 * @param {string} [opts.department]  only students of this department
 * @param {'eligible'|'all'} [opts.scope] eligible = only students who could apply to a job needing the skill
 * @param {boolean} [opts.includeClosed] also count closed roles
 */
export async function computeGaps({ department, scope = 'eligible', includeClosed = false }) {
  const [allJobs, profiles, departments] = await Promise.all([
    JobPosting.find({}).select('title company skills department minCgpa status createdAt').lean(),
    StudentProfile.find(department ? { department } : {})
      .select('name email department cgpa skills extractedSkills')
      .lean(),
    StudentProfile.distinct('department'),
  ]);

  const jobs = includeClosed ? allJobs : allJobs.filter((j) => j.status === 'Open');

  const students = profiles.map((p) => ({
    ...p,
    keys: new Set([...(p.skills || []), ...(p.extractedSkills || [])].map(skillKey).filter(Boolean)),
  }));
  // Students with no skills at all are counted separately, not as "lacking everything"
  const active = students.filter((s) => s.keys.size > 0);
  const emptyProfiles = students.length - active.length;

  // Group job requirements by skill
  const bySkill = new Map();
  for (const job of jobs) {
    for (const raw of job.skills || []) {
      const key = skillKey(raw);
      if (!key) continue;
      const entry = bySkill.get(key) || { key, skill: canonicalSkill(raw), jobs: [] };
      if (!entry.jobs.some((j) => j._id.equals(job._id))) entry.jobs.push(job);
      bySkill.set(key, entry);
    }
  }

  // Trend: postings needing the skill in the last 30 days vs the 30 days before
  const now = Date.now();
  const recentAll = allJobs.filter((j) => now - new Date(j.createdAt).getTime() <= 2 * TREND_WINDOW_DAYS * DAY);
  const trendAvailable = recentAll.length >= MIN_POSTINGS_FOR_TREND;

  const skills = [...bySkill.values()].map((entry) => {
    const population = scope === 'all'
      ? active
      : active.filter((s) => entry.jobs.some((job) => isEligible(job, s)));
    const lackingStudents = population.filter((s) => !s.keys.has(entry.key));
    const have = population.length - lackingStudents.length;

    let trend = null;
    if (trendAvailable) {
      const needs = (j) => (j.skills || []).some((s) => skillKey(s) === entry.key);
      const age = (j) => (now - new Date(j.createdAt).getTime()) / DAY;
      const recent = recentAll.filter((j) => needs(j) && age(j) <= TREND_WINDOW_DAYS).length;
      const previous = recentAll.filter((j) => needs(j) && age(j) > TREND_WINDOW_DAYS).length;
      trend = { recent, previous, direction: recent > previous ? 'up' : recent < previous ? 'down' : 'flat' };
    }

    return {
      key: entry.key,
      skill: entry.skill,
      jobCount: entry.jobs.length,
      jobs: entry.jobs.map((j) => ({ id: j._id.toString(), title: j.title, company: j.company, status: j.status })),
      population: population.length,
      have,
      lacking: lackingStudents.length,
      lackingPct: population.length ? Math.round((lackingStudents.length / population.length) * 100) : 0,
      // Higher = better topic for a session: many roles need it and many students don't show it
      priority: entry.jobs.length * lackingStudents.length,
      trend,
      lackingStudents,
    };
  }).sort((a, b) => b.priority - a.priority || b.jobCount - a.jobCount || a.skill.localeCompare(b.skill));

  return {
    skills,
    totals: { students: students.length, activeStudents: active.length, emptyProfiles, jobs: jobs.length },
    trendAvailable,
    departments: departments.filter(Boolean).sort(),
  };
}

function readOptions(query) {
  return {
    department: query.department || undefined,
    scope: query.scope === 'all' ? 'all' : 'eligible',
    includeClosed: query.includeClosed === '1' || query.includeClosed === 'true',
  };
}

// GET /api/analytics/skill-gaps?department=&scope=eligible|all&includeClosed=0|1
router.get('/skill-gaps', asyncHandler(async (req, res) => {
  const options = readOptions(req.query);
  const result = await computeGaps(options);
  res.json({
    ...result,
    options,
    skills: result.skills.map(({ lackingStudents, ...rest }) => rest),
  });
}));

// GET /api/analytics/skill-gaps/:key/students — students who don't show this skill (for invites / CSV)
router.get('/skill-gaps/:key/students', asyncHandler(async (req, res) => {
  const options = readOptions(req.query);
  const { skills } = await computeGaps(options);
  const entry = skills.find((s) => s.key === skillKey(req.params.key));
  if (!entry) throw new HttpError(404, 'No posted role needs this skill.');
  res.json({
    skill: entry.skill,
    options,
    students: entry.lackingStudents
      .map((s) => ({
        id: s._id.toString(),
        name: s.name || 'Unnamed student',
        email: s.email || '',
        department: s.department || '',
        cgpa: s.cgpa ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });
}));

export default router;
