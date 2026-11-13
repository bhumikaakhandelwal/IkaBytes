import React, { useMemo, useState } from 'react';
import {
  Sparkles, GraduationCap, BriefcaseBusiness, ArrowRight, LogOut, Plus,
  Upload, FileText, ChartNoAxesColumn, Users, Search, Bell, ChevronDown,
  ExternalLink, CheckCircle2, TrendingUp, LayoutDashboard, UserRound,
  Building2, X, Menu, SlidersHorizontal, Download, Github, Linkedin
} from 'lucide-react';

const initialJobs = [
  { id: 1, title: 'Frontend Engineer', company: 'Infosys', skills: ['React', 'CSS', 'JavaScript'], count: 18, status: 'Open' },
  { id: 2, title: 'Data Analyst', company: 'SignalWorks', skills: ['Python', 'SQL', 'Excel'], count: 12, status: 'Open' },
  { id: 3, title: 'Backend Developer', company: 'TechNova', skills: ['Node.js', 'SQL', 'APIs'], count: 9, status: 'Open' },
  { id: 4, title: 'Product Engineer', company: 'Orbit Systems', skills: ['React', 'TypeScript', 'AWS'], count: 7, status: 'Open' },
  { id: 5, title: 'Cloud Associate', company: 'Northstar Labs', skills: ['AWS', 'Linux', 'Networking'], count: 6, status: 'Open' },
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

  const handleFullNameChange = (e) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setFullName(val);
      setNameError('');
    } else {
      setNameError('Full name should contain alphabets only');
    }
  };

  const submit = (e) => {
    e.preventDefault();

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

    onLogin(
      role,
      email,
      register ? fullName.trim() : ''
    );
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
        <button className="primary-btn full" type="submit">{register ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></button>
      </form>
      <button className="text-button" onClick={() => setRegister(!register)}>{register ? 'Already have an account? Sign in' : 'New to SkillMatch? Create an account'}</button>
    </div></section>
  </main>;
}

function Header({ email, fullName, role, onLogout }) {
  const displayName = fullName || email.split('@')[0];
  return <header className="topbar"><Brand /><div className="user-area"><span className="avatar">{(displayName[0] || 'S').toUpperCase()}</span><span className="user-meta"><b>{displayName}</b><small>{role}</small></span><button className="icon-button" title="Sign out" onClick={onLogout}><LogOut size={17} /></button></div></header>;
}

function StudentView({ jobs, onSelectJob, initialName }) {
  const [name, setName] = useState(initialName || 'Aarav Sharma');
  const [nameError, setNameError] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [projects, setProjects] = useState(['']);
  const [resume, setResume] = useState('');
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [cgpaError, setCgpaError] = useState('');
  const [department, setDepartment] = useState('');

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

  const handleSave = () => {
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
    setSaved(true);
  };

  const filtered = jobs.filter(j => `${j.title} ${j.company} ${j.skills.join(' ')}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="workspace student-workspace">
    <div className="page-heading"><div><p className="eyebrow">STUDENT WORKSPACE</p><h1>Build your <em>placement profile</em></h1><p className="muted">Complete your profile to see how your skills line up with current job postings.</p></div><Tag tone="success"><CheckCircle2 size={13} /> {resume ? 'Resume uploaded' : 'Add a resume to get match-ready'}</Tag></div>
    <div className="student-grid">
      <section className="panel profile-panel">
        <div className="panel-heading"><div><b>Your profile</b></div><button className="small-primary" onClick={handleSave}>Save changes</button></div>
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
            <input
              type="text"
              placeholder="e.g. Computer Engineering"
              value={department}
              onChange={e => { setDepartment(e.target.value); setSaved(false); }}
            />
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
        <label className="upload-zone"><Upload size={18} /><span><b>{resume || 'Upload your resume'}</b><small>PDF, DOCX, or TXT · up to 5 MB</small></span><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setResume(e.target.files?.[0]?.name || '')} /></label>
        {saved && <p className="inline-success"><CheckCircle2 size={14} /> Profile changes saved.</p>}
      </section>
      <section className="market-card">
        <div className="market-title"><span>MARKET PULSE</span><ChartNoAxesColumn size={17} /></div><h3>Skills employers ask for</h3><p>Stay one step ahead of the next posting.</p>
        {demand.map(([skill, n]) => <div className="demand-row" key={skill}><div><b>{skill}</b><small>{n} postings</small></div><div className="bar"><i style={{ width: `${n / 5 * 100}%` }} /></div></div>)}
      </section>
    </div>
    <section className="opportunities">
      <div className="section-heading"><div><h2>OPEN OPPORTUNITIES</h2></div><div className="search-box"><Search size={15} /><input placeholder="Search roles or skills" value={filter} onChange={e => setFilter(e.target.value)} /></div></div>
      <div className="job-grid">{filtered.map(job => <article className="job-card" key={job.id}><div className="job-card-top"><div><h3>{job.title}</h3><p>{job.company}</p></div><FileText size={15} /></div><div className="tags">{job.skills.map(s => <Tag key={s}>{s}</Tag>)}</div><div className="student-job-note">
        <CheckCircle2 size={14} />
        Required skills shown above
      </div></article>)}</div>
      {filtered.length === 0 && <div className="empty-state">No roles match that search.</div>}
    </section>
  </div>;
}

function OfficerView({ jobs, setJobs, onSelectJob }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const post = (e) => {
    e.preventDefault();
    const cleanSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (!title.trim() || !company.trim() || cleanSkills.length === 0) { setNotice('Add a role title, company and at least one required skill.'); return; }
    const job = { id: Date.now(), title, company, skills: cleanSkills, count: 0, status: 'Open' };
    setJobs([job, ...jobs]); setTitle(''); setCompany(''); setDescription(''); setSkills(''); setNotice('Role added to the live shortlist.');
  };
  const visible = jobs.filter(j => `${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="workspace officer-workspace">
    <div className="page-heading"><div><p className="eyebrow">PLACEMENT COMMAND CENTER</p><h1>Shortlist with <em>signal.</em></h1><p className="muted">Post the brief. Let skill evidence lead the conversation.</p></div><Tag><Users size={14} />{jobs.length} active roles</Tag></div>
    <div className="officer-grid">
      <section className="panel post-panel"><div className="panel-heading"><div className="post-icon"><Plus size={20} /></div><div><b>Post a new role</b><small>Requirements become searchable instantly.</small></div></div>
        <form className="post-form" onSubmit={post}>
          <input placeholder="Role title · e.g. Frontend Engineer" value={title} onChange={e => setTitle(e.target.value)} />
          <input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
          <textarea placeholder="Describe the opportunity and team..." value={description} onChange={e => setDescription(e.target.value)} rows="4" />
          <input placeholder="Required skills, comma separated" value={skills} onChange={e => setSkills(e.target.value)} />
          <button className="primary-btn full" type="submit">Post role <ArrowRight size={16} /></button>
          {notice && <p className={notice.startsWith('Role') ? 'inline-success' : 'form-error'}>{notice}</p>}
        </form>
      </section>
      <section className="shortlists"><div className="section-heading compact"><div><h2>Live shortlists</h2><p className="muted">AI reads profiles against each job brief.</p></div><span className="ai-label"><Sparkles size={13} /> AI-assisted demo</span></div>
        <div className="search-box shortlist-search"><Search size={15} /><input placeholder="Search posted roles" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {visible.map(job => <article className="shortlist-card" key={job.id}><button className="shortlist-open" onClick={() => onSelectJob(job)}><span><b>{job.title}</b> <Tag tone="success">OPEN</Tag><small>{job.company} · {job.skills.join(' · ')}</small></span><ChevronDown size={17} /></button>
          <div className="shortlist-preview"><div className="preview-label"><Sparkles size={13} /> AI resume parsing <span>DEMO DATA</span></div>{students.slice(0, 3).map((s, i) => <div className="candidate-mini" key={s.name}><span className="rank">{i + 1}</span><div className="candidate-info"><b>{s.name}</b><small>{s.status} · {s.evidence}</small></div><strong>{Math.max(0, s.score - Math.max(0, job.skills.length - 3) * 4)}%</strong></div>)}<button className="view-all" onClick={() => onSelectJob(job)}>View full shortlist <ArrowRight size={14} /></button></div>
        </article>)}
      </section>
    </div>
  </div>;
}

function Leaderboard({ job, onBack }) {
  const ranked = useMemo(() => students.map(s => ({ ...s, score: Math.max(0, Math.round(s.score - Math.max(0, job.skills.length - 3) * 3)) })).sort((a, b) => b.score - a.score), [job]);
  return <div className="workspace leaderboard-workspace">
    <button className="back-link" onClick={onBack}>← Back to dashboard</button>
    <div className="page-heading"><div><p className="eyebrow">JOB-SPECIFIC LEADERBOARD</p><h1>{job.title} at <em>{job.company}</em></h1><p className="muted">Candidate ranking based on required-skill overlap and profile evidence.</p></div><Tag tone="success">OPEN ROLE</Tag></div>
    <section className="panel leaderboard-panel"><div className="leaderboard-head"><div><h2>Recommended candidates</h2><p className="muted">{ranked.length} demo profiles · required: {job.skills.join(', ')}</p></div><button className="outline-btn" onClick={() => window.print()}><Download size={15} /> Export / Print</button></div>
      {ranked.map((s, i) => <article className="candidate-row" key={s.name}><span className="rank large">{i + 1}</span><div className="candidate-info"><b>{s.name}</b><small>{s.dept} · {s.evidence}</small><div className="tags">{s.skills.map(skill => <Tag key={skill} tone={job.skills.some(r => r.toLowerCase() === skill.toLowerCase()) ? 'matched' : 'missing'}>{skill}</Tag>)}</div></div><div className="score-block"><strong>{s.score}%</strong><small>MATCH SCORE</small></div><div className="candidate-reason"><b>Why this match</b><p>{s.skills.filter(skill => job.skills.some(r => r.toLowerCase() === skill.toLowerCase())).length} matching listed skills. Review project evidence and eligibility before shortlisting.</p></div></article>)}
      <p className="disclaimer">Demo ranking only. Replace sample profiles and illustrative scores with verified student records and a reviewed matching model before production use.</p>
    </section>
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [jobs, setJobs] = useState(initialJobs);
  const [selected, setSelected] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  if (!session) return <Login onLogin={(role, email, fullName) => setSession({ role, email, fullName })} />;
  return <div className="app-shell"><Header email={session.email} fullName={session.fullName} role={session.role} onLogout={() => { setSession(null); setSelected(null) }} />
    {session.role === 'Placement officer' && selected ? (
      <Leaderboard
        job={selected}
        onBack={() => setSelected(null)}
      />
    ) : session.role === 'Student' ? (
      <StudentView jobs={jobs} initialName={session.fullName} />
    ) : (
      <OfficerView
        jobs={jobs}
        setJobs={setJobs}
        onSelectJob={setSelected}
      />
    )}
    <footer className="app-footer">SkillMatch <span>·</span> Placement intelligence</footer>
  </div>;
}
export default App;