import React, { useState, useMemo } from 'react';
import {
  Sparkles, Users, ChevronDown, ArrowRight, Plus, Search, Check,
  Unlock, Lock, UserCheck, Download
} from 'lucide-react';

export const students = [
  { name: 'Aarav Sharma', dept: 'Computer Engineering', score: 94, skills: ['React', 'JavaScript', 'CSS', 'Git'], evidence: '2 projects · 1 certification', status: 'Strong match' },
  { name: 'Mira Naik', dept: 'Information Technology', score: 88, skills: ['React', 'TypeScript', 'CSS'], evidence: '3 projects · 2 certifications', status: 'Strong match' },
  { name: 'Rohan Patil', dept: 'Computer Engineering', score: 76, skills: ['JavaScript', 'HTML', 'Python'], evidence: '2 projects', status: 'Potential match' },
  { name: 'Sana Khan', dept: 'Electronics', score: 63, skills: ['HTML', 'CSS', 'Python'], evidence: '1 project · 1 certification', status: 'Needs development' },
];

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export function OfficerView({ jobs, setJobs, onSelectJob }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [cgpaCutoff, setCgpaCutoff] = useState('');
  const [cgpaError, setCgpaError] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [collapsedJobs, setCollapsedJobs] = useState({});

  const handleCgpaCutoffChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCgpaCutoff('');
      setCgpaError('');
      return;
    }

    const num = Number(val);
    if (isNaN(num)) {
      setCgpaError('Please enter a valid number');
      return;
    }

    if (num > 10) {
      setCgpaError('CGPA cannot exceed 10');
      return;
    }

    if (num < 0) {
      setCgpaError('CGPA cannot be negative');
      return;
    }

    setCgpaError('');
    setCgpaCutoff(val);
  };

  const post = (e) => {
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

    const job = {
      id: Date.now(),
      title: title.trim(),
      company: company.trim(),
      department: department.trim() || 'All Departments',
      cgpaCutoff: cgpaCutoff ? parseFloat(cgpaCutoff).toFixed(1) : '',
      description: description.trim(),
      skills: cleanSkills,
      count: 0,
      status: 'Open',
      shortlisted: []
    };
    setJobs([job, ...jobs]);
    setTitle('');
    setCompany('');
    setDepartment('');
    setCgpaCutoff('');
    setCgpaError('');
    setDescription('');
    setSkills('');
    setNotice('Role added to the live shortlist.');
  };

  const visible = jobs.filter(j => `${j.title} ${j.company} ${j.department || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="workspace officer-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLACEMENT OFFICER DASHBOARD</p>
          <h1>Find the right students for every <em>role.</em></h1>
          <p className="muted">Upload job requirements and shortlist candidates ranked by skill match.</p>
        </div>
        <Tag>
          <Users size={14} />{jobs.length} active roles
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
              onChange={e => {
                setDepartment(e.target.value);
                setNotice('');
              }}
              className={!department ? 'is-placeholder' : ''}
              required
            >
              <option value="">Select eligible department</option>
              <option value="All Departments">All Departments (Open to All)</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics and Computer Science Engineering">Electronics and Computer Science Engineering</option>
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
            <button className="primary-btn full" type="submit">Post role <ArrowRight size={16} /></button>
            {notice && <p className={notice.startsWith('Role') ? 'inline-success' : 'form-error'}>{notice}</p>}
          </form>
        </section>

        <section className="shortlists">
          <div className="section-heading compact">
            <div>
              <h2>Live shortlists</h2>
              <p className="muted">AI reads profiles against each job brief.</p>
            </div>
            <span className="ai-label"><Sparkles size={13} /> AI-assisted demo</span>
          </div>

          <div className="search-box shortlist-search">
            <Search size={15} />
            <input placeholder="Search posted roles" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {visible.map(job => {
            const isClosed = job.status === 'Closed';
            return (
              <article className={`shortlist-card ${isClosed ? 'is-closed' : ''}`} key={job.id}>
                <button
                  className="shortlist-open"
                  onClick={() => {
                    setCollapsedJobs(current => ({
                      ...current,
                      [job.id]: !current[job.id]
                    }));
                  }}
                >
                  <span>
                    <b>{job.title}</b>
                    <Tag tone="success">OPEN</Tag>
                    <small>{job.company} · {job.skills.join(' · ')}</small>
                  </span>

                  <ChevronDown
                    size={20}
                    className={collapsedJobs[job.id] ? 'chevron-collapsed' : 'chevron-expanded'}
                  />
                </button>
                {!collapsedJobs[job.id] && (
                  <div className="shortlist-preview">
                    <div className="preview-label">
                      <Sparkles size={13} /> AI resume parsing
                    </div>
                    {students.slice(0, 3).map((s, i) => {
                      const isShortlisted = (job.shortlisted || []).includes(s.name);
                      return (
                        <div className="candidate-mini" key={s.name}>
                          <span className="rank">{i + 1}</span>
                          <div className="candidate-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <b>{s.name}</b>
                              {isShortlisted && (
                                <span className="mini-shortlist-badge">
                                  <Check size={10} /> Shortlisted
                                </span>
                              )}
                            </div>
                            <small>{s.status} · {s.evidence}</small>
                          </div>
                          <strong>{Math.max(0, s.score - Math.max(0, job.skills.length - 3) * 4)}%</strong>
                        </div>
                      );
                    })}
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

export function Leaderboard({ job, onBack, onUpdateJob }) {
  const [viewTab, setViewTab] = useState('all');
  const ranked = useMemo(() => students.map(s => ({
    ...s,
    score: Math.max(0, Math.round(s.score - Math.max(0, job.skills.length - 3) * 3))
  })).sort((a, b) => b.score - a.score), [job]);

  const isClosed = job.status === 'Closed';
  const shortlistedNames = job.shortlisted || [];

  const toggleShortlist = (studentName) => {
    const isAlreadyShortlisted = shortlistedNames.includes(studentName);
    const nextShortlisted = isAlreadyShortlisted
      ? shortlistedNames.filter(name => name !== studentName)
      : [...shortlistedNames, studentName];

    onUpdateJob({
      ...job,
      shortlisted: nextShortlisted,
      count: nextShortlisted.length
    });
  };

  const toggleRoleStatus = () => {
    const nextStatus = isClosed ? 'Open' : 'Closed';
    onUpdateJob({
      ...job,
      status: nextStatus
    });
  };

  const displayedCandidates = viewTab === 'shortlisted'
    ? ranked.filter(s => shortlistedNames.includes(s.name))
    : ranked;

  return (
    <div className="workspace leaderboard-workspace">
      <button className="back-link" onClick={onBack}>← Back to dashboard</button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">JOB-SPECIFIC LEADERBOARD</p>
          <h1>{job.title} at <em>{job.company}</em></h1>
          <p className="muted">Candidate ranking based on required-skill overlap and profile evidence.</p>
        </div>
        <div className="role-actions-head">
          <Tag tone={isClosed ? 'danger' : 'success'}>
            {isClosed ? 'CLOSED · FILLED' : 'OPEN ROLE'}
          </Tag>
          <button
            type="button"
            className={`toggle-role-btn ${isClosed ? 'reopen' : 'close'}`}
            onClick={toggleRoleStatus}
            title={isClosed ? 'Reopen this role for applications' : 'Mark this role as filled / closed'}
          >
            {isClosed ? (
              <>
                <Unlock size={14} /> Reopen Role
              </>
            ) : (
              <>
                <Lock size={14} /> Close Role (Filled)
              </>
            )}
          </button>
        </div>
      </div>

      <section className="panel leaderboard-panel">
        <div className="leaderboard-head">
          <div>
            <h2>Candidate leaderboard</h2>
            <p className="muted">
              {ranked.length} candidates evaluated · Required: {job.skills.join(', ')}
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
              All Candidates ({ranked.length})
            </button>
            <button
              type="button"
              className={`leaderboard-tab ${viewTab === 'shortlisted' ? 'active' : ''}`}
              onClick={() => setViewTab('shortlisted')}
            >
              <UserCheck size={14} />
              Shortlisted ({shortlistedNames.length})
            </button>
          </div>
        </div>

        {displayedCandidates.length === 0 ? (
          <div className="empty-state">
            {viewTab === 'shortlisted'
              ? 'No candidates shortlisted yet for this role. Switch to "All Candidates" to shortlist students using the button.'
              : 'No candidates found.'}
          </div>
        ) : (
          displayedCandidates.map((s, i) => {
            const isShortlisted = shortlistedNames.includes(s.name);
            return (
              <article className="candidate-row" key={s.name}>
                <span className="rank large">{i + 1}</span>
                <div className="candidate-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <b>{s.name}</b>
                    {isShortlisted && (
                      <span className="mini-shortlist-badge">
                        <UserCheck size={11} /> Shortlisted
                      </span>
                    )}
                  </div>
                  <small>{s.dept} · {s.evidence}</small>
                  <div className="tags">
                    {s.skills.map(skill => (
                      <Tag
                        key={skill}
                        tone={job.skills.some(r => r.toLowerCase() === skill.toLowerCase()) ? 'matched' : 'missing'}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
                <div className="score-block">
                  <strong>{s.score}%</strong>
                  <small>MATCH SCORE</small>
                </div>
                <div className="candidate-reason">
                  <b>Why this match</b>
                  <p>
                    {s.skills.filter(skill => job.skills.some(r => r.toLowerCase() === skill.toLowerCase())).length} matching listed skills. Review project evidence and eligibility before shortlisting.
                  </p>
                </div>
                <div className="candidate-action">
                  <button
                    type="button"
                    className={`shortlist-action-btn ${isShortlisted ? 'is-shortlisted' : ''}`}
                    onClick={() => toggleShortlist(s.name)}
                    title={isShortlisted ? 'Click to remove from shortlist' : 'Click to shortlist student'}
                  >
                    {isShortlisted ? (
                      <>
                        <Check size={14} /> Shortlisted
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Shortlist
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export function TpoDashboard({
  jobs = [],
  setJobs,
  selectedJob,
  setSelectedJob,
  onSelectJob,
  onUpdateJob
}) {
  const [internalSelectedId, setInternalSelectedId] = useState(null);

  // If parent controls selectedJob, use it; otherwise manage internally
  const currentSelected = selectedJob !== undefined
    ? selectedJob
    : (internalSelectedId ? jobs.find(j => j.id === internalSelectedId) || null : null);

  const handleSelect = (job) => {
    if (onSelectJob) onSelectJob(job);
    if (setSelectedJob) setSelectedJob(job);
    setInternalSelectedId(job ? job.id : null);
  };

  const handleUpdate = (updatedJob) => {
    if (onUpdateJob) {
      onUpdateJob(updatedJob);
    } else if (setJobs) {
      setJobs(prevJobs => prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j));
    }
  };

  if (currentSelected) {
    return (
      <Leaderboard
        job={currentSelected}
        onBack={() => handleSelect(null)}
        onUpdateJob={handleUpdate}
      />
    );
  }

  return (
    <OfficerView
      jobs={jobs}
      setJobs={setJobs}
      onSelectJob={handleSelect}
    />
  );
}

export default TpoDashboard;
