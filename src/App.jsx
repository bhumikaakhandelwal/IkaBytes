import React, { useMemo, useState, useEffect } from 'react';
import {
  Sparkles, GraduationCap, BriefcaseBusiness, ArrowRight, LogOut, Plus,
  Upload, FileText, ChartNoAxesColumn, Users, Search, Bell, ChevronDown,
  ExternalLink, CheckCircle2, TrendingUp, LayoutDashboard, UserRound,
  Building2, X, Menu, SlidersHorizontal, Download, Github, Linkedin,
  Lock, Unlock, UserCheck, Check, Loader2
} from 'lucide-react';
import { api, tokenStore, ROLE_TO_API, ROLE_FROM_API } from './api.js';

const initialJobs = [
  { id: 1, title: 'Frontend Engineer', company: 'Infosys', department: 'Computer Engineering', cgpaCutoff: '7.5', skills: ['React', 'CSS', 'JavaScript'], count: 2, status: 'Open', shortlisted: ['Aarav Sharma', 'Mira Naik'] },
  { id: 2, title: 'Data Analyst', company: 'SignalWorks', department: 'Information Technology', cgpaCutoff: '7.0', skills: ['Python', 'SQL', 'Excel'], count: 1, status: 'Open', shortlisted: ['Aarav Sharma'] },
  { id: 3, title: 'Backend Developer', company: 'TechNova', department: 'Computer Engineering', cgpaCutoff: '8.0', skills: ['Node.js', 'SQL', 'APIs'], count: 0, status: 'Open', shortlisted: [] },
  { id: 4, title: 'Product Engineer', company: 'Orbit Systems', department: 'All Departments', cgpaCutoff: '7.5', skills: ['React', 'TypeScript', 'AWS'], count: 1, status: 'Closed', shortlisted: ['Mira Naik'] },
  { id: 5, title: 'Cloud Associate', company: 'Northstar Labs', department: 'Computer Engineering', cgpaCutoff: '7.0', skills: ['AWS', 'Linux', 'Networking'], count: 0, status: 'Open', shortlisted: [] },
];
const students = [
  { name: 'Aarav Sharma', dept: 'Computer Engineering', score: 94, skills: ['React', 'JavaScript', 'CSS', 'Git'], evidence: '2 projects · 1 certification', status: 'Strong match' },
  { name: 'Mira Naik', dept: 'Information Technology', score: 88, skills: ['React', 'TypeScript', 'CSS'], evidence: '3 projects · 2 certifications', status: 'Strong match' },
  { name: 'Rohan Patil', dept: 'Computer Engineering', score: 76, skills: ['JavaScript', 'HTML', 'Python'], evidence: '2 projects', status: 'Potential match' },
  { name: 'Sana Khan', dept: 'Electronics', score: 63, skills: ['HTML', 'CSS', 'Python'], evidence: '1 project · 1 certification', status: 'Needs development' },
];
const demand = [['React', 5], ['Python', 4], ['SQL', 3], ['TypeScript', 2], ['AWS', 2], ['JavaScript', 1]];

function Brand() {
  return <div className="brand"><span className="brand-icon"><Sparkles size={19} /></span><span><b>SkillMatch</b><small>PLACEMENT INTELLIGENCE</small></span></div>;
}
function Tag({ children, tone = '' }) { return <span className={`tag ${tone}`}>{children}</span>; }

function Login({ onLogin }) {
  const [role, setRole] = useState('Student');
  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFullNameChange = (e) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setFullName(val);
      setNameError('');
    } else {
      setNameError('Full name should contain alphabets only');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (register) {
      if (!fullName.trim()) {
        setNameError("Please enter your full name");
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
        setNameError("Full name should contain alphabets only");
        return;
      }
    }

    setBusy(true);
    try {
      const payload = { email, password, role: ROLE_TO_API[role] };
      const { token, user } = register
        ? await api.register({ ...payload, name: fullName.trim() })
        : await api.login(payload);
      tokenStore.set(token);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };
  return <main className="login-shell">
    <section className="login-hero">
      <Brand />
      <div className="hero-copy"><p className="eyebrow light">SKILL-BASED CAREER MATCHING</p><h1>Right skills. Right roles. Right away.</h1><p>SkillMatch analyses your profile against real job requirements and shows you where you fit best.</p></div>
      <div className="hero-foot">© 2026 SkillMatch · Placement Intelligence</div>
    </section>
    <section className="login-panel"><div className="login-form-wrap">
      <p className="eyebrow">
        {role === 'Placement officer' ? 'PLACEMENT INTELLIGENCE' : 'WELCOME BACK'}
      </p>

      <h2>
        {register
          ? 'Create your workspace.'
          : role === 'Placement officer'
            ? 'Smarter placements start here.'
            : 'Your next role starts here.'}
      </h2>

      <p className="muted">
        {role === 'Placement officer'
          ? 'Find the right talent faster. Make confident placement decisions.'
          : 'Sign in to your placement workspace and discover opportunities.'}
      </p>      <div className="role-switch">
        <button className={role === 'Student' ? 'selected' : ''} onClick={() => setRole('Student')}><GraduationCap size={17} />Student</button>
        <button className={role === 'Placement officer' ? 'selected' : ''} onClick={() => setRole('Placement officer')}><BriefcaseBusiness size={17} />Placement officer</button>
      </div>
      <form onSubmit={submit} className="login-fields">

        {register && (
          <div>
            <input
              type="text"
              className={nameError ? 'has-error' : ''}
              placeholder="Full Name"
              value={fullName}
              onChange={handleFullNameChange}
              required
            />
            {nameError && <small className="field-error">{nameError}</small>}
          </div>
        )}

        <input
          type="email"
          placeholder="College email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          minLength="6"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="primary-btn full" type="submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></button>
        {error && <p className="field-error" style={{ fontSize: '13px', marginTop: '6px' }}>{error}</p>}
      </form>
      <button className="text-button" onClick={() => { setRegister(!register); setError(''); setNameError(''); }}>{register ? 'Already have an account? Sign in' : 'New to SkillMatch? Create an account'}</button>
    </div></section>
  </main>;
}

function Header({ user, onLogout }) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayRole = ROLE_FROM_API[user?.role] || user?.role || 'Member';
  return <header className="topbar"><Brand /><div className="user-area"><span className="avatar">{(displayName[0] || 'S').toUpperCase()}</span><span className="user-meta"><b>{displayName}</b><small>{displayRole}</small></span><button className="icon-button" title="Sign out" onClick={onLogout}><LogOut size={17} /></button></div></header>;
}

function StudentView({ jobs, onSelectJob, user }) {
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [projects, setProjects] = useState(['']);
  const [resume, setResume] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cgpa, setCgpa] = useState('');
  const [cgpaError, setCgpaError] = useState('');
  const [department, setDepartment] = useState('');
  const [demandList, setDemandList] = useState(demand);

  useEffect(() => {
    let active = true;
    api.getProfile()
      .then(({ profile }) => {
        if (!active || !profile) return;
        setName(profile.name || user?.name || '');
        setLinkedin(profile.linkedin || '');
        setCgpa(profile.cgpa != null ? String(profile.cgpa) : '');
        setDepartment(profile.department || '');
        if (profile.projects && profile.projects.length > 0) {
          setProjects(profile.projects);
        }
        setResume(profile.resume);
        setExtracted(profile.extractedSkills || []);
      })
      .catch((err) => {
        console.warn('Could not load profile from DB:', err.message);
      });

    api.demand()
      .then(({ demand: rows }) => {
        if (active && rows && rows.length > 0) {
          setDemandList(rows.map(r => [r.skill, r.count]));
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [user]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setSaved(false);
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setName(val);
      setNameError('');
    } else {
      setNameError('Full name should contain alphabets only');
    }
  };

  const handleCgpaChange = (e) => {
    const val = e.target.value;
    setSaved(false);

    if (val === '') {
      setCgpa('');
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
    setCgpa(val);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Please enter your full name');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      setNameError('Full name should contain alphabets only');
      return;
    }
    if (cgpa !== '') {
      const num = Number(cgpa);
      if (isNaN(num) || num < 0 || num > 10) {
        setCgpaError('CGPA cannot exceed 10');
        return;
      }
    }
    setNameError('');
    setCgpaError('');
    setSaveError('');
    setSaving(true);

    try {
      const cleanProjects = projects.map(p => p.trim()).filter(Boolean);
      const { profile } = await api.updateProfile({
        name: name.trim(),
        department: department.trim(),
        linkedin: linkedin.trim(),
        cgpa: cgpa === '' ? null : Number(cgpa),
        projects: cleanProjects,
      });

      setName(profile.name || '');
      setLinkedin(profile.linkedin || '');
      setCgpa(profile.cgpa != null ? String(profile.cgpa) : '');
      setDepartment(profile.department || '');
      if (profile.projects && profile.projects.length > 0) {
        setProjects(profile.projects);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadNotice('');
    try {
      const { profile } = await api.uploadResume(file);
      setResume(profile.resume);
      setExtracted(profile.extractedSkills || []);
      setUploadNotice(`Resume "${profile.resume?.originalName || file.name}" uploaded & saved to database.`);
      setTimeout(() => setUploadNotice(''), 5000);
    } catch (err) {
      setUploadNotice(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const filtered = jobs
    .filter(j => {
      if (statusFilter === 'open') return j.status !== 'Closed';
      if (statusFilter === 'closed') return j.status === 'Closed';
      return true;
    })
    .filter(j => `${j.title} ${j.company} ${j.department || ''} ${j.skills.join(' ')}`.toLowerCase().includes(filter.toLowerCase()));

  return <div className="workspace student-workspace">
    <div className="page-heading"><div><p className="eyebrow">STUDENT WORKSPACE</p><h1>Build your <em>placement profile</em></h1><p className="muted">Complete your profile to see how your skills line up with current job postings.</p></div><Tag tone="success"><CheckCircle2 size={13} /> {resume ? 'Resume uploaded' : 'Add a resume to get match-ready'}</Tag></div>
    <div className="student-grid">
      <section className="panel profile-panel">
        <div className="panel-heading"><div><b>Your profile</b><small>Saved in MongoDB</small></div><button className="small-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
        <div className="form-grid">
          <label>
            Full name
            <input
              type="text"
              className={nameError ? 'has-error' : ''}
              placeholder="e.g. Aarav Sharma"
              value={name}
              onChange={handleNameChange}
            />
            {nameError && <small className="field-error">{nameError}</small>}
          </label>
          <label>
            LinkedIn Profile URL
            <input
              type="url"
              placeholder="https://linkedin.com/in/your-profile"
              value={linkedin}
              onChange={e => { setLinkedin(e.target.value); setSaved(false); }}
            />
          </label>
          {/* CGPA */}
          <label>
            CGPA
            <input
              type="number"
              className={cgpaError ? 'has-error' : ''}
              placeholder="Enter your CGPA (e.g. 8.5)"
              min="0"
              max="10"
              step="0.01"
              value={cgpa}
              onChange={handleCgpaChange}
              onKeyDown={e => {
                if (['e', 'E', '+', '-'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {cgpaError ? (
              <small className="field-error">{cgpaError}</small>
            ) : (
              <small className="field-hint">
                Enter your current academic CGPA (out of 10).
              </small>
            )}
          </label>

          <label>
            Department
            <select
              value={department}
              onChange={e => {
                setDepartment(e.target.value);
                setSaved(false);
              }}
              required
              className={!department ? 'is-placeholder' : ''}
            >
              <option value="" disabled>
                Select your department
              </option>
              <option value="Computer Engineering">
                Computer Engineering
              </option>
              <option value="Electronics and Computer Science Engineering">
                Electronics and Computer Science Engineering
              </option>
              <option value="Civil Engineering">
                Civil Engineering
              </option>
              <option value="Mechanical Engineering">
                Mechanical Engineering
              </option>
            </select>
          </label>
        </div>
        {/* PROJECT LINKS - FULL WIDTH */}
        <div className="project-links-full">
          <label>
            Project Links
          </label>

          {projects.map((project, index) => (
            <div className="input-add" key={index}>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={project}
                onChange={e =>
                  setProjects(current =>
                    current.map((item, i) =>
                      i === index ? e.target.value : item
                    )
                  )
                }
              />

              {projects.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  title="Remove link"
                  aria-label="Remove project"
                  onClick={() =>
                    setProjects(current => current.filter((_, i) => i !== index))
                  }
                >
                  <X size={15} />
                </button>
              )}

              {index === projects.length - 1 && (
                <button
                  type="button"
                  aria-label="Add another project"
                  title="Add project link"
                  onClick={() => setProjects(current => [...current, ''])}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <label className="upload-zone">
          <Upload size={18} />
          <span>
            <b>{resume?.originalName || (uploading ? 'Uploading resume…' : 'Upload your resume')}</b>
            <small>
              PDF, DOCX, or TXT · up to 5 MB
              {extracted && extracted.length > 0 ? ` · detected: ${extracted.join(', ')}` : ''}
            </small>
          </span>
          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} disabled={uploading} />
        </label>
        {uploadNotice && <p className="inline-success" style={{ marginTop: '8px' }}><CheckCircle2 size={14} /> {uploadNotice}</p>}
        {saved && <p className="inline-success" style={{ marginTop: '8px' }}><CheckCircle2 size={14} /> Profile changes saved to database.</p>}
        {saveError && <p className="field-error" style={{ marginTop: '8px' }}>{saveError}</p>}
      </section>
      <section className="market-card">
        <div className="market-title"><span>MARKET PULSE</span><ChartNoAxesColumn size={17} /></div><h3>Skills employers ask for</h3><p>Stay one step ahead of the next posting.</p>
        {demandList.map(([skill, n]) => <div className="demand-row" key={skill}><div><b>{skill}</b><small>{n} postings</small></div><div className="bar"><i style={{ width: `${Math.min(100, (n / 5) * 100)}%` }} /></div></div>)}
      </section>
    </div>
    <section className="opportunities">
      <div className="section-heading">
        <div>
          <h2>OPPORTUNITIES & ROLES</h2>
          <p className="muted">Explore open positions or view completed placement drives.</p>
        </div>
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Search roles, skills, or department" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>

      <div className="job-status-filter">
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Roles ({jobs.length})
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'open' ? 'active' : ''}`}
          onClick={() => setStatusFilter('open')}
        >
          Open ({jobs.filter(j => j.status !== 'Closed').length})
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'closed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('closed')}
        >
          Closed / Filled ({jobs.filter(j => j.status === 'Closed').length})
        </button>
      </div>

      <div className="job-grid">
        {filtered.map(job => {
          const isClosed = job.status === 'Closed';
          return (
            <article className={`job-card ${isClosed ? 'is-closed' : ''}`} key={job.id}>
              <div className="job-card-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{job.title}</h3>
                    <Tag tone={isClosed ? 'danger' : 'success'}>
                      {isClosed ? 'CLOSED · FILLED' : 'OPEN'}
                    </Tag>
                  </div>
                  <p>{job.company}{job.department ? ` · ${job.department}` : ''}{job.cgpaCutoff ? ` · Min CGPA: ${job.cgpaCutoff}` : ''}</p>
                </div>
                <FileText size={15} />
              </div>
              <div className="tags">
                {job.skills.map(s => <Tag key={s}>{s}</Tag>)}
              </div>
              {isClosed ? (
                <div className="student-job-note closed-note">
                  <Lock size={14} />
                  Role closed · Position has been filled
                </div>
              ) : (
                <div className="student-job-note">
                  <CheckCircle2 size={14} />
                  Required skills shown above · Accepting applications
                </div>
              )}
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="empty-state">No roles match that search.</div>}
    </section>
  </div>;
}

function OfficerView({ jobs, setJobs, onSelectJob }) {
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
  return <div className="workspace officer-workspace">
    <div className="page-heading"><div><p className="eyebrow">PLACEMENT OFFICER DASHBOARD</p><h1>Find the right students for every <em>role.</em></h1><p className="muted">Upload job requirements and shortlist candidates ranked by skill match.</p></div><Tag><Users size={14} />{jobs.length} active roles</Tag></div>
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
      <section className="shortlists"><div className="section-heading compact"><div><h2>Live shortlists</h2><p className="muted">AI reads profiles against each job brief.</p></div><span className="ai-label"><Sparkles size={13} /> AI-assisted demo</span></div>
        <div className="search-box shortlist-search"><Search size={15} /><input placeholder="Search posted roles" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {visible.map(job => {
          const isClosed = job.status === 'Closed';
          const shortlistedCount = job.shortlisted?.length || 0;
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
                <div className="shortlist-preview">                <div className="preview-label">
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
  </div>;
}

function Leaderboard({ job, onBack, onUpdateJob }) {
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

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));
  const [jobs, setJobs] = useState(initialJobs);
  const [selected, setSelected] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      setChecking(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  const handleUpdateJob = (updatedJob) => {
    setJobs(prevJobs => prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j));
    if (selected && selected.id === updatedJob.id) {
      setSelected(updatedJob);
    }
  };

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null);
    setSelected(null);
  };

  if (checking) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Loader2 size={20} className="spin" /> Opening your workspace…
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  const currentSelectedJob = selected ? (jobs.find(j => j.id === selected.id) || selected) : null;
  const isOfficer = user.role === 'tpo' || user.role === 'Placement officer';

  return (
    <div className="app-shell">
      <Header user={user} onLogout={handleLogout} />
      {isOfficer && currentSelectedJob ? (
        <Leaderboard
          job={currentSelectedJob}
          onBack={() => setSelected(null)}
          onUpdateJob={handleUpdateJob}
        />
      ) : !isOfficer ? (
        <StudentView jobs={jobs} user={user} onSelectJob={setSelected} />
      ) : (
        <OfficerView
          jobs={jobs}
          setJobs={setJobs}
          onSelectJob={setSelected}
        />
      )}
      <footer className="app-footer">SkillMatch <span>·</span> Placement intelligence</footer>
    </div>
  );
}
export default App;