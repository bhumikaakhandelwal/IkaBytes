// Thin client for the SkillMatch API.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'skillmatch_token';

export const ROLE_TO_API = { Student: 'student', 'Placement officer': 'tpo' };
export const ROLE_FROM_API = { student: 'Student', tpo: 'Placement officer' };

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
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

  listJobs: (q = '') => request(`/jobs${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createJob: (payload) => request('/jobs', { method: 'POST', body: payload }),
  updateJob: (id, payload) => request(`/jobs/${id}`, { method: 'PATCH', body: payload }),
  shortlists: (limit = 3) => request(`/jobs/shortlists?limit=${limit}`),
  leaderboard: (id) => request(`/jobs/${id}/leaderboard`),
  apply: (id) => request(`/jobs/${id}/apply`, { method: 'POST' }),

  myApplications: () => request('/applications/me'),
  demand: () => request('/market/demand'),
};
