// Thin client for the SkillMatch API.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'skillmatch_token';

export const ROLE_TO_API = { Student: 'student', 'Placement officer': 'tpo' };
export const ROLE_FROM_API = { student: 'Student', tpo: 'Placement officer' };

export const tokenStore = {
  get: () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Downloads a protected file (e.g. a student's resume) with the login token
async function requestFile(path) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

// Builds "?a=1&b=2", skipping empty values
function qs(params = {}) {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false);
  return clean.length ? `?${new URLSearchParams(clean.map(([k, v]) => [k, v === true ? '1' : String(v)]))}` : '';
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  getProfile: () => request('/profile/me'),
  updateProfile: (payload) => request('/profile/me', { method: 'PUT', body: payload }),
  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return request('/profile/me/resume', { method: 'POST', form });
  },

  // status: 'all' (default) | 'Open' | 'Closed'
  listJobs: (status = 'all') => request(`/jobs?status=${encodeURIComponent(status)}`),
  createJob: (payload) => request('/jobs', { method: 'POST', body: payload }),
  updateJob: (id, payload) => request(`/jobs/${id}`, { method: 'PATCH', body: payload }),
  shortlists: (limit = 3) => request(`/jobs/shortlists?limit=${limit}`),
  leaderboard: (id) => request(`/jobs/${id}/leaderboard`),
  apply: (id) => request(`/jobs/${id}/apply`, { method: 'POST' }),
  toggleShortlist: (jobId, profileId) => request(`/jobs/${jobId}/shortlist`, { method: 'POST', body: { profileId } }),

  // AI suggestions (cached in the database; Groq is only called when something changed)
  // Placement officer: student directory, full profiles and resumes
  listStudents: (params) => request(`/students${qs(params)}`),
  getStudent: (id) => request(`/students/${id}`),
  studentResume: (id) => requestFile(`/students/${id}/resume`),

  // Placement officer: skill-gap analytics
  skillGaps: (params) => request(`/analytics/skill-gaps${qs(params)}`),
  skillGapStudents: (key, params) => request(`/analytics/skill-gaps/${encodeURIComponent(key)}/students${qs(params)}`),

  getInsights: () => request('/profile/me/insights'),
  refreshInsights: () => request('/profile/me/insights/refresh', { method: 'POST' }),

  myApplications: () => request('/applications/me'),
  demand: () => request('/market/demand'),
};
