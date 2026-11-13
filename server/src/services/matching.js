// Candidate scoring. Uses the external AI service when AI_SERVICE_URL is set,
// otherwise (or if that call fails) a transparent built-in scorer.

const SKILL_WEIGHT = 70; // share of score from required-skill overlap
const PROJECT_POINTS = 5; // per project, max 3 counted
const CERT_POINTS = 5; // per certification, max 2 counted
const CGPA_WEIGHT = 5; // cgpa/10 * 5

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function evidenceLabel(profile) {
  const p = profile.projects?.length || 0;
  const c = profile.certifications?.length || 0;
  const parts = [];
  if (p) parts.push(plural(p, 'project'));
  if (c) parts.push(plural(c, 'certification'));
  return parts.join(' · ') || 'No evidence added yet';
}

function statusFor(score) {
  if (score >= 85) return 'Strong match';
  if (score >= 70) return 'Potential match';
  return 'Needs development';
}

/** Deterministic, explainable score for one profile against one job. */
export function scoreCandidate(job, profile) {
  const have = new Set(
    [...(profile.skills || []), ...(profile.extractedSkills || [])].map((s) => s.toLowerCase())
  );
  const required = job.skills || [];
  const matched = required.filter((r) => have.has(r.toLowerCase()));
  const missing = required.filter((r) => !have.has(r.toLowerCase()));

  const skillPart = required.length ? (matched.length / required.length) * SKILL_WEIGHT : 0;
  const evidencePart =
    Math.min(profile.projects?.length || 0, 3) * PROJECT_POINTS +
    Math.min(profile.certifications?.length || 0, 2) * CERT_POINTS;
  const cgpaPart = profile.cgpa ? (profile.cgpa / 10) * CGPA_WEIGHT : 0;

  let score = Math.min(100, Math.round(skillPart + evidencePart + cgpaPart));
  const belowCgpa = job.minCgpa != null && profile.cgpa != null && profile.cgpa < job.minCgpa;
  if (belowCgpa) score = Math.min(score, 50);

  let reason = `${matched.length} of ${required.length} required skills matched`;
  if (missing.length) reason += `; missing ${missing.join(', ')}`;
  reason += '.';
  if (belowCgpa) reason += ` CGPA ${profile.cgpa} is below the ${job.minCgpa} cut-off.`;

  return { score, matched, missing, status: statusFor(score), reason };
}

/**
 * Optional AI ranking. Expected contract for the Python/FastAPI service:
 *   POST {AI_SERVICE_URL}/rank
 *   body:     { job: {title, description, skills}, candidates: [{id, skills, projects, certifications, cgpa}] }
 *   response: { results: [{ id, score (0-100), reason }] }
 */
async function aiScores(job, profiles) {
  const url = process.env.AI_SERVICE_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        job: { title: job.title, description: job.description, skills: job.skills },
        candidates: profiles.map((p) => ({
          id: p._id.toString(),
          skills: [...(p.skills || []), ...(p.extractedSkills || [])],
          projects: p.projects,
          certifications: p.certifications,
          cgpa: p.cgpa,
        })),
      }),
    });
    if (!res.ok) throw new Error(`AI service responded ${res.status}`);
    const data = await res.json();
    return new Map((data.results || []).map((r) => [String(r.id), r]));
  } catch (err) {
    console.warn(`AI ranking unavailable, using built-in scorer: ${err.message}`);
    return null;
  }
}

/** Returns profiles ranked best-first with score details attached. */
export async function rankCandidates(job, profiles, { useAI = true } = {}) {
  const ai = useAI ? await aiScores(job, profiles) : null;
  const ranked = profiles.map((profile) => {
    const local = scoreCandidate(job, profile);
    const remote = ai?.get(profile._id.toString());
    const score = remote ? Math.max(0, Math.min(100, Math.round(remote.score))) : local.score;
    return {
      profile,
      ...local,
      score,
      status: remote ? statusFor(score) : local.status,
      reason: remote?.reason || local.reason,
      source: remote ? 'ai' : 'rules',
    };
  });
  ranked.sort((a, b) => b.score - a.score || (b.profile.cgpa || 0) - (a.profile.cgpa || 0));
  return ranked;
}
