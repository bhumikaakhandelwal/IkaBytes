import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  Sparkles, Users, ChevronDown, ArrowRight, Plus, Search, Check,
  Unlock, Lock, UserCheck, Download, Loader2, AlertTriangle
} from 'lucide-react';
import { api } from './api.js';
import { usePolling } from './usePolling.js';
import Select from './Select.jsx';
import { DEPARTMENTS, ALL_DEPARTMENTS } from './departments.js';

const DEPT_REQUIRED = 'Select the eligible department for this role.';
import StudentsSection, { DEFAULT_DIRECTORY_STATE } from './StudentsSection.jsx';
import StudentProfileView from './StudentProfileView.jsx';
import SkillGaps, { DEFAULT_GAP_OPTIONS } from './SkillGaps.jsx';

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

function Loading({ label }) {
  return <div className="empty-state"><Loader2 size={16} className="spin" /> {label}</div>;
}

export function OfficerView({ jobs, reloadJobs, onSelectJob, onOpenStudent }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [cgpaCutoff, setCgpaCutoff] = useState('');
  const [cgpaError, setCgpaError] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [posting, setPosting] = useState(false);
  // The post form folds away so the role tiles get the full width
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState('');
  // Top-3 candidates per job, computed by the backend from real student profiles
  const [shortlists, setShortlists] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);

  const loadShortlists = useCallback(async () => {
    try {
      const data = await api.shortlists(3);
      setShortlists(data.shortlists || {});
      setTotalStudents(data.totalStudents || 0);
    } catch {
      setShortlists({});
    }
  }, []);

  useEffect(() => { loadShortlists(); }, [loadShortlists, jobs]);
  // No roles yet → show the form straight away
  useEffect(() => { if (jobs.length === 0) setShowForm(true); }, [jobs.length]);
  // Rankings change when students update profiles or upload resumes, so refresh them live too
  usePolling(loadShortlists, 10000);

  const handleCgpaCutoffChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCgpaCutoff('');
      setCgpaError('');
      return;
    }
    const num = Number(val);
    if (isNaN(num)) { setCgpaError('Please enter a valid number'); return; }
    if (num > 10) { setCgpaError('CGPA cannot exceed 10'); return; }
    if (num < 0) { setCgpaError('CGPA cannot be negative'); return; }
    setCgpaError('');
    setCgpaCutoff(val);
  };

  const post = async (e) => {
    e.preventDefault();
    const cleanSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (!department) {
      setNotice(DEPT_REQUIRED);
      return;
    }
    if (!title.trim() || !company.trim() || cleanSkills.length === 0) {
      setNotice('Add a role title, company and at least one required skill.');
      return;
    }
    if (cgpaCutoff !== '') {
      const num = Number(cgpaCutoff);
      if (isNaN(num) || num < 0 || num > 10) {
        setCgpaError('CGPA cutoff must be between 0 and 10');
        return;
      }
    }

    setPosting(true);
    try {
      await api.createJob({
        title: title.trim(),
        company: company.trim(),
        department: department.trim() || 'All Departments',
        cgpaCutoff: cgpaCutoff === '' ? null : Number(cgpaCutoff),
        description: description.trim(),
        skills: cleanSkills,
      });
      setTitle('');
      setCompany('');
      setDepartment('');
      setCgpaCutoff('');
      setCgpaError('');
      setDescription('');
      setSkills('');
      setNotice('');
      setShowForm(false);
      setSuccess(`"${title.trim()}" at ${company.trim()} was posted.`);
      setTimeout(() => setSuccess(''), 5000);
      await reloadJobs();
    } catch (err) {
      setNotice(err.message || 'Could not post the role.');
    } finally {
      setPosting(false);
    }
  };

  const visible = jobs
    .filter(j => statusFilter === 'all' || (statusFilter === 'closed' ? j.status === 'Closed' : j.status !== 'Closed'))
    .filter(j => `${j.title} ${j.company} ${j.department || ''} ${j.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const openCount = jobs.filter(j => j.status !== 'Closed').length;

  return (
    <div className="workspace officer-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLACEMENT OFFICER DASHBOARD</p>
          <h1>Find the right students for every <em>role.</em></h1>
          <p className="muted">Upload job requirements and shortlist candidates ranked by skill match.</p>
        </div>
        <Tag>
          <Users size={14} />{openCount} active roles · {totalStudents} student profiles
        </Tag>
      </div>

      <section className={`panel post-panel post-panel-wide ${showForm ? 'is-open' : ''}`}>
        <button type="button" className="post-toggle" onClick={() => setShowForm(v => !v)} aria-expanded={showForm}>
          <span className="post-icon"><Plus size={20} /></span>
          <span>
            <b>Post a new role</b>
            <small>{showForm ? 'Requirements become searchable instantly.' : 'Click to add a role with its required skills, department and CGPA cutoff.'}</small>
          </span>
          <ChevronDown size={20} className={showForm ? 'chevron-expanded' : 'chevron-collapsed'} />
        </button>
        {showForm && (
            <form className="post-form post-form-grid" onSubmit={post}>
              <input
                placeholder="Role title · e.g. Frontend Engineer"
                value={title}
                onChange={e => { setTitle(e.target.value); setNotice(''); }}
                required
              />
              <input
                placeholder="Company name"
                value={company}
                onChange={e => { setCompany(e.target.value); setNotice(''); }}
                required
              />
              <Select
                value={department}
                onChange={(v) => { setDepartment(v); setNotice(''); }}
                placeholder="Select eligible department"
                ariaLabel="Eligible department"
                invalid={notice === DEPT_REQUIRED}
                options={[
                  { value: ALL_DEPARTMENTS, label: 'All Departments (Open to All)' },
                  ...DEPARTMENTS,
                ]}
              />
              <div>
                <input
                  type="number"
                  className={cgpaError ? 'has-error' : ''}
                  placeholder="CGPA cutoff (out of 10) · e.g. 7.5"
                  min="0"
                  max="10"
                  step="0.01"
                  value={cgpaCutoff}
                  onChange={handleCgpaCutoffChange}
                  onKeyDown={e => {
                    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                  }}
                />
                {cgpaError && <small className="field-error">{cgpaError}</small>}
              </div>
              <textarea
                className="span-2"
                placeholder="Describe the opportunity and team..."
                value={description}
                onChange={e => { setDescription(e.target.value); setNotice(''); }}
                rows="4"
              />
              <input
                className="span-2"
                placeholder="Required skills, comma separated"
                value={skills}
                onChange={e => { setSkills(e.target.value); setNotice(''); }}
                required
              />
              <button className="primary-btn full span-2" type="submit" disabled={posting}>
                {posting ? 'Posting…' : 'Post role'} <ArrowRight size={16} />
              </button>
              {notice && <p className="form-error span-2">{notice}</p>}
            </form>
        )}
      </section>

      <section className="shortlists">
        <div className="section-heading compact">
          <div>
            <h2>Live shortlists</h2>
            <p className="muted">Student profiles ranked against each job brief.</p>
          </div>
          <span className="ai-label"><span className="live-dot" /> Live · updates automatically</span>
        </div>

        <div className="roles-toolbar">
          <div className="job-status-filter">
            <button type="button" className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
              All Roles ({jobs.length})
            </button>
            <button type="button" className={`status-filter-btn ${statusFilter === 'open' ? 'active' : ''}`} onClick={() => setStatusFilter('open')}>
              Open ({openCount})
            </button>
            <button type="button" className={`status-filter-btn ${statusFilter === 'closed' ? 'active' : ''}`} onClick={() => setStatusFilter('closed')}>
              Closed / Filled ({jobs.length - openCount})
            </button>
          </div>
          <div className="search-box shortlist-search">
            <Search size={15} />
            <input placeholder="Search roles, skills or department" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {success && <p className="inline-success roles-success"><Check size={14} /> {success}</p>}
        {jobs.length === 0 && <div className="empty-state">No roles posted yet. Use the form above to post your first role.</div>}
        {jobs.length > 0 && visible.length === 0 && <div className="empty-state">No roles match these filters.</div>}

        <div className="role-grid">
          {visible.map(job => {
            const isClosed = job.status === 'Closed';
            const top = shortlists?.[job.id] || [];
            return (
              <article className={`job-card role-tile ${isClosed ? 'is-closed' : ''}`} key={job.id}>
                <div className="role-tile-head">
                  <h3>{job.title}</h3>
                  <Tag tone={isClosed ? 'danger' : 'success'}>{isClosed ? 'CLOSED' : 'OPEN'}</Tag>
                </div>
                <p className="role-tile-meta">
                  {job.company}
                  {job.department ? ` · ${job.department}` : ''}
                  {job.cgpaCutoff ? ` · Min CGPA ${job.cgpaCutoff}` : ''}
                </p>
                <div className="tags">
                  {job.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                </div>

                <div className="role-tile-matches">
                  <div className="preview-label">
                    <Sparkles size={13} /> Top matches
                    {job.shortlistedCount > 0 && <span>{job.shortlistedCount} SHORTLISTED</span>}
                  </div>
                  {shortlists === null && <Loading label="Ranking students…" />}
                  {shortlists !== null && top.length === 0 && (
                    <p className="muted role-tile-empty">No student profiles list these skills yet.</p>
                  )}
                  {top.map(s => (
                    <div className="candidate-mini" key={s.id}>
                      <span className="rank">{s.rank}</span>
                      <div className="candidate-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button type="button" className="name-link" onClick={() => onOpenStudent?.(s.id, 'roles & shortlists')} title="Open full profile">
                            {s.name}
                          </button>
                          {s.shortlisted && (
                            <span className="mini-shortlist-badge">
                              <Check size={10} /> Shortlisted
                            </span>
                          )}
                        </div>
                        <small>{s.status} · {s.evidence}</small>
                      </div>
                      <strong>{s.score}%</strong>
                    </div>
                  ))}
                </div>

                <button type="button" className="outline-btn role-tile-cta" onClick={() => onSelectJob(job)}>
                  View full shortlist <ArrowRight size={14} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function Leaderboard({ jobId, initialJob, onBack, onJobChanged, onOpenStudent }) {
  const [viewTab, setViewTab] = useState('all');
  const [job, setJob] = useState(initialJob || null);
  const [candidates, setCandidates] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await api.leaderboard(jobId);
      setJob(data.job);
      setCandidates(data.candidates);
      setTotal(data.total);
      setError('');
    } catch (err) {
      setError(err.status === 404 ? 'This role no longer exists.' : err.message);
    }
  }, [jobId]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);
  // Keep the ranking live; pause while a shortlist/status change is being saved
  usePolling(loadLeaderboard, 10000, !busyId && !statusBusy);

  const isClosed = job?.status === 'Closed';
  const shortlistedCount = (candidates || []).filter(c => c.shortlisted).length;

  const toggleShortlist = async (candidate) => {
    setBusyId(candidate.id);
    setError('');
    try {
      const { job: updated, shortlisted } = await api.toggleShortlist(job.id, candidate.id);
      setJob(updated);
      setCandidates(list => list.map(c => (c.id === candidate.id ? { ...c, shortlisted } : c)));
      onJobChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleRoleStatus = async () => {
    setStatusBusy(true);
    setError('');
    try {
      const { job: updated } = await api.updateJob(job.id, { status: isClosed ? 'Open' : 'Closed' });
      setJob(updated);
      onJobChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusBusy(false);
    }
  };

  const displayedCandidates = (candidates || []).filter(c => viewTab === 'all' || c.shortlisted);

  // Opened by address (e.g. after a reload): wait for the job to load
  if (!job) {
    return (
      <div className="workspace leaderboard-workspace">
        <button className="back-link" onClick={onBack}>← Back to roles</button>
        {error ? <p className="form-error">{error}</p> : <Loading label="Loading role…" />}
      </div>
    );
  }

  return (
    <div className="workspace leaderboard-workspace">
      <button className="back-link" onClick={onBack}>← Back to roles</button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">JOB-SPECIFIC LEADERBOARD</p>
          <h1>{job.title} at <em>{job.company}</em></h1>
          <p className="muted">Candidate ranking based on required-skill overlap, profile evidence, CGPA and department.</p>
        </div>
        <div className="role-actions-head">
          <Tag tone={isClosed ? 'danger' : 'success'}>
            {isClosed ? 'CLOSED · FILLED' : 'OPEN ROLE'}
          </Tag>
          <button
            type="button"
            className={`toggle-role-btn ${isClosed ? 'reopen' : 'close'}`}
            onClick={toggleRoleStatus}
            disabled={statusBusy}
            title={isClosed ? 'Reopen this role for applications' : 'Mark this role as filled / closed'}
          >
            {isClosed ? <><Unlock size={14} /> Reopen Role</> : <><Lock size={14} /> Close Role (Filled)</>}
          </button>
        </div>
      </div>

      <section className="panel leaderboard-panel">
        <div className="leaderboard-head">
          <div>
            <h2>Candidate leaderboard</h2>
            <p className="muted">
              {candidates ? `${total} candidates evaluated` : 'Evaluating candidates…'} · Required: {job.skills.join(', ')}
              {job.department ? ` · Dept: ${job.department}` : ''}
              {job.cgpaCutoff ? ` · Min CGPA: ${job.cgpaCutoff}` : ''}
            </p>
          </div>
          <button className="outline-btn" onClick={() => window.print()}>
            <Download size={15} /> Export / Print
          </button>
        </div>

        <div className="leaderboard-head-actions">
          <div className="leaderboard-tabs">
            <button
              type="button"
              className={`leaderboard-tab ${viewTab === 'all' ? 'active' : ''}`}
              onClick={() => setViewTab('all')}
            >
              <Users size={14} />
              All Candidates ({candidates ? candidates.length : 0})
            </button>
            <button
              type="button"
              className={`leaderboard-tab ${viewTab === 'shortlisted' ? 'active' : ''}`}
              onClick={() => setViewTab('shortlisted')}
            >
              <UserCheck size={14} />
              Shortlisted ({shortlistedCount})
            </button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {!candidates && !error && <Loading label="Ranking candidates…" />}

        {candidates && displayedCandidates.length === 0 && (
          <div className="empty-state">
            {viewTab === 'shortlisted'
              ? 'No candidates shortlisted yet for this role. Switch to "All Candidates" to shortlist students using the button.'
              : 'No student profiles list these skills yet.'}
          </div>
        )}

        {displayedCandidates.map(s => (
          <article className="candidate-row" key={s.id}>
            <span className="rank large">{s.rank}</span>
            <div className="candidate-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" className="name-link" onClick={() => onOpenStudent?.(s.id, `${job.title} at ${job.company}`)} title="Open full profile">
                              {s.name}
                            </button>
                {s.shortlisted && (
                  <span className="mini-shortlist-badge">
                    <UserCheck size={11} /> Shortlisted
                  </span>
                )}
                {s.eligible === false && (
                  <Tag tone="danger"><AlertTriangle size={11} /> Not eligible</Tag>
                )}
              </div>
              <small>
                {[s.department, s.evidence, s.cgpa != null ? `CGPA ${s.cgpa}` : null].filter(Boolean).join(' · ')}
              </small>
              <div className="tags">
                {job.skills.map(skill => (
                  <Tag key={skill} tone={s.matched.includes(skill) ? 'matched' : 'missing'}>{skill}</Tag>
                ))}
              </div>
            </div>
            <div className="score-block">
              <strong>{s.score}%</strong>
              <small>MATCH SCORE</small>
            </div>
            <div className="candidate-reason">
              <b>{s.status}</b>
              <p>{s.reason}</p>
            </div>
            <div className="candidate-action">
              <button
                type="button"
                className={`shortlist-action-btn ${s.shortlisted ? 'is-shortlisted' : ''}`}
                onClick={() => toggleShortlist(s)}
                disabled={busyId === s.id}
                title={s.shortlisted ? 'Click to remove from shortlist' : 'Click to shortlist student'}
              >
                {s.shortlisted ? <><Check size={14} /> Shortlisted</> : <><Plus size={14} /> Shortlist</>}
              </button>
            </div>
          </article>
        ))}
        <p className="disclaimer">Scores are a starting point. CGPA is self-reported. Review project evidence before shortlisting.</p>
      </section>
    </div>
  );
}

const TABS = [
  { to: '/tpo/roles', label: 'Roles & shortlists' },
  { to: '/tpo/students', label: 'Students' },
  { to: '/tpo/skill-gaps', label: 'Skill gaps' },
];

/**
 * Keeps a page's filters in the address bar (e.g. /tpo/students?department=Electronics&page=2),
 * so reloading or pressing Back restores them. Values equal to the defaults are left out.
 */
function useQueryState(defaults) {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = params.get(key);
      if (raw === null) continue;
      if (typeof defaults[key] === 'boolean') out[key] = raw === '1';
      else if (typeof defaults[key] === 'number') out[key] = Number(raw) || defaults[key];
      else out[key] = raw;
    }
    return out;
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const setState = useCallback((update) => {
    const next = typeof update === 'function' ? update(state) : update;
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value === defaults[key] || value === '' || value === false || value == null) continue;
      p.set(key, value === true ? '1' : String(value));
    }
    setParams(p, { replace: true });
  }, [state, setParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setState];
}

/** Opens a student's profile and remembers where "← Back" should return to. */
function useOpenStudent() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback((id, fromLabel) => {
    navigate(`/tpo/students/${id}`, {
      state: { from: location.pathname + location.search, fromLabel: fromLabel || 'students' },
    });
  }, [navigate, location]);
}

function RolesPage({ jobs, reloadJobs }) {
  const navigate = useNavigate();
  const openStudent = useOpenStudent();
  return (
    <OfficerView
      jobs={jobs}
      reloadJobs={reloadJobs}
      onSelectJob={(job) => navigate(`/tpo/roles/${job.id}`)}
      onOpenStudent={openStudent}
    />
  );
}

function LeaderboardPage({ jobs, reloadJobs }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const openStudent = useOpenStudent();
  return (
    <Leaderboard
      key={jobId}
      jobId={jobId}
      initialJob={jobs.find((j) => j.id === jobId)}
      onBack={() => navigate('/tpo/roles')}
      onJobChanged={reloadJobs}
      onOpenStudent={openStudent}
    />
  );
}

function StudentsPage() {
  const [state, setState] = useQueryState(DEFAULT_DIRECTORY_STATE);
  const openStudent = useOpenStudent();
  return <StudentsSection state={state} setState={setState} onOpenStudent={(id) => openStudent(id, 'students')} />;
}

function StudentProfilePage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  // Came from inside the app → go back there; opened directly → the directory
  const backTo = state?.from || '/tpo/students';
  const backLabel = state?.fromLabel || 'students';
  return (
    <StudentProfileView
      key={studentId}
      studentId={studentId}
      backLabel={backLabel}
      onBack={() => navigate(backTo)}
      onOpenJob={(job) => navigate(`/tpo/roles/${job.id}`)}
    />
  );
}

function SkillGapsPage() {
  const [options, setOptions] = useQueryState(DEFAULT_GAP_OPTIONS);
  const openStudent = useOpenStudent();
  return <SkillGaps options={options} setOptions={setOptions} onOpenStudent={(id) => openStudent(id, 'skill gaps')} />;
}

export function TpoDashboard({ jobs = [], reloadJobs }) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <nav className="tpo-tabs" aria-label="Placement officer sections">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Navigate to="roles" replace />} />
        <Route path="roles" element={<RolesPage jobs={jobs} reloadJobs={reloadJobs} />} />
        <Route path="roles/:jobId" element={<LeaderboardPage jobs={jobs} reloadJobs={reloadJobs} />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId" element={<StudentProfilePage />} />
        <Route path="skill-gaps" element={<SkillGapsPage />} />
        <Route path="*" element={<Navigate to="roles" replace />} />
      </Routes>
    </>
  );
}

export default TpoDashboard;
