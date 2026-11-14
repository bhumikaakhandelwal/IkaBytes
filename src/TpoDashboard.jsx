import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Users, ChevronDown, ArrowRight, Plus, Search, Check,
  Unlock, Lock, UserCheck, Download, Loader2, AlertTriangle
} from 'lucide-react';
import { api } from './api.js';
import { usePolling } from './usePolling.js';
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
  const [collapsedJobs, setCollapsedJobs] = useState({});
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
      setNotice('Role added to the live shortlist.');
      await reloadJobs();
    } catch (err) {
      setNotice(err.message || 'Could not post the role.');
    } finally {
      setPosting(false);
    }
  };

  const visible = jobs.filter(j => `${j.title} ${j.company} ${j.department || ''}`.toLowerCase().includes(search.toLowerCase()));
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

      <div className="officer-grid">
        <section className="panel post-panel">
          <div className="panel-heading">
            <div className="post-icon"><Plus size={20} /></div>
            <div>
              <b>Post a new role</b>
              <small>Requirements become searchable instantly.</small>
            </div>
          </div>
          <form className="post-form" onSubmit={post}>
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
            <select
              value={department}
              onChange={e => { setDepartment(e.target.value); setNotice(''); }}
              className={!department ? 'is-placeholder' : ''}
              required
            >
              <option value="">Select eligible department</option>
              <option value="All Departments">All Departments (Open to All)</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics and Computer Science Engineering">Electronics and Computer Science Engineering</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
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
              placeholder="Describe the opportunity and team..."
              value={description}
              onChange={e => { setDescription(e.target.value); setNotice(''); }}
              rows="4"
            />
            <input
              placeholder="Required skills, comma separated"
              value={skills}
              onChange={e => { setSkills(e.target.value); setNotice(''); }}
              required
            />
            <button className="primary-btn full" type="submit" disabled={posting}>
              {posting ? 'Posting…' : 'Post role'} <ArrowRight size={16} />
            </button>
            {notice && <p className={notice.startsWith('Role') ? 'inline-success' : 'form-error'}>{notice}</p>}
          </form>
        </section>

        <section className="shortlists">
          <div className="section-heading compact">
            <div>
              <h2>Live shortlists</h2>
              <p className="muted">Student profiles ranked against each job brief.</p>
            </div>
            <span className="ai-label"><span className="live-dot" /> Live · updates automatically</span>
          </div>

          <div className="search-box shortlist-search">
            <Search size={15} />
            <input placeholder="Search posted roles" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {jobs.length === 0 && <div className="empty-state">No roles posted yet. Use the form to post your first role.</div>}
          {jobs.length > 0 && visible.length === 0 && <div className="empty-state">No roles match that search.</div>}

          {visible.map(job => {
            const isClosed = job.status === 'Closed';
            const top = shortlists?.[job.id] || [];
            return (
              <article className={`shortlist-card ${isClosed ? 'is-closed' : ''}`} key={job.id}>
                <button
                  className="shortlist-open"
                  onClick={() => setCollapsedJobs(current => ({ ...current, [job.id]: !current[job.id] }))}
                >
                  <span>
                    <b>{job.title}</b>
                    <Tag tone={isClosed ? 'danger' : 'success'}>{isClosed ? 'CLOSED' : 'OPEN'}</Tag>
                    <small>
                      {job.company} · {job.skills.join(' · ')}
                      {job.shortlistedCount ? ` · ${job.shortlistedCount} shortlisted` : ''}
                    </small>
                  </span>
                  <ChevronDown
                    size={20}
                    className={collapsedJobs[job.id] ? 'chevron-collapsed' : 'chevron-expanded'}
                  />
                </button>
                {!collapsedJobs[job.id] && (
                  <div className="shortlist-preview">
                    <div className="preview-label">
                      <Sparkles size={13} /> Top matches
                    </div>
                    {shortlists === null && <Loading label="Ranking students…" />}
                    {shortlists !== null && top.length === 0 && (
                      <p className="muted" style={{ fontSize: '11px', margin: '6px 0' }}>
                        No student profiles list these skills yet.
                      </p>
                    )}
                    {top.map(s => (
                      <div className="candidate-mini" key={s.id}>
                        <span className="rank">{s.rank}</span>
                        <div className="candidate-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button type="button" className="name-link" onClick={() => onOpenStudent?.(s.id)} title="Open full profile">
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
                    <button className="view-all" onClick={() => onSelectJob(job)}>
                      View full shortlist & candidate ranking <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export function Leaderboard({ job: initialJob, onBack, onJobChanged, onOpenStudent }) {
  const [viewTab, setViewTab] = useState('all');
  const [job, setJob] = useState(initialJob);
  const [candidates, setCandidates] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await api.leaderboard(initialJob.id);
      setJob(data.job);
      setCandidates(data.candidates);
      setTotal(data.total);
      setError('');
    } catch (err) {
      setError(err.status === 404 ? 'This role no longer exists.' : err.message);
    }
  }, [initialJob.id]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);
  // Keep the ranking live; pause while a shortlist/status change is being saved
  usePolling(loadLeaderboard, 10000, !busyId && !statusBusy);

  const isClosed = job.status === 'Closed';
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

  return (
    <div className="workspace leaderboard-workspace">
      <button className="back-link" onClick={onBack}>← Back to dashboard</button>
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
                <button type="button" className="name-link" onClick={() => onOpenStudent?.(s.id)} title="Open full profile">
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
  { id: 'roles', label: 'Roles & shortlists' },
  { id: 'students', label: 'Students' },
  { id: 'gaps', label: 'Skill gaps' },
];

export function TpoDashboard({ jobs = [], reloadJobs }) {
  const [tab, setTab] = useState('roles');
  const [selectedJob, setSelectedJob] = useState(null);
  // { id, back: { tab, job }, backLabel } — where "← Back" returns to
  const [student, setStudent] = useState(null);
  // Kept here so filters survive opening a profile and coming back
  const [directoryState, setDirectoryState] = useState(DEFAULT_DIRECTORY_STATE);
  const [gapOptions, setGapOptions] = useState(DEFAULT_GAP_OPTIONS);

  useEffect(() => { window.scrollTo(0, 0); }, [tab, selectedJob, student]);

  const switchTab = (id) => {
    setTab(id);
    setSelectedJob(null);
    setStudent(null);
  };

  const openStudent = (id) => {
    const backLabel = selectedJob
      ? `${selectedJob.title} at ${selectedJob.company}`
      : tab === 'students' ? 'students' : tab === 'gaps' ? 'skill gaps' : 'dashboard';
    setStudent({ id, back: { tab, job: selectedJob }, backLabel });
  };

  const closeStudent = () => {
    setTab(student.back.tab);
    setSelectedJob(student.back.job);
    setStudent(null);
  };

  const openJobFromProfile = (job) => {
    setStudent(null);
    setTab('roles');
    setSelectedJob(job);
  };

  let content;
  if (student) {
    content = (
      <StudentProfileView
        key={student.id}
        studentId={student.id}
        backLabel={student.backLabel}
        onBack={closeStudent}
        onOpenJob={openJobFromProfile}
      />
    );
  } else if (selectedJob) {
    content = (
      <Leaderboard
        key={selectedJob.id}
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
        onJobChanged={reloadJobs}
        onOpenStudent={openStudent}
      />
    );
  } else if (tab === 'students') {
    content = <StudentsSection state={directoryState} setState={setDirectoryState} onOpenStudent={openStudent} />;
  } else if (tab === 'gaps') {
    content = <SkillGaps options={gapOptions} setOptions={setGapOptions} onOpenStudent={openStudent} />;
  } else {
    content = <OfficerView jobs={jobs} reloadJobs={reloadJobs} onSelectJob={setSelectedJob} onOpenStudent={openStudent} />;
  }

  return (
    <>
      <nav className="tpo-tabs" aria-label="Placement officer sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {content}
    </>
  );
}

export default TpoDashboard;
