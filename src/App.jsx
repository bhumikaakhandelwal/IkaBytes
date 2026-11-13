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
  return <div className="brand"><span className="brand-icon"><Sparkles size={19}/></span><span><b>SkillMatch</b><small>PLACEMENT INTELLIGENCE</small></span></div>;
}
function Tag({ children, tone = '' }) { return <span className={`tag ${tone}`}>{children}</span>; }

function Login({ onLogin }) {
  const [role, setRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const submit = (e) => { e.preventDefault(); onLogin(role, email || (role === 'Student' ? 'student@college.edu' : 'officer@college.edu')); };
  return <main className="login-shell">
    <section className="login-hero">
      <Brand/>
      <div className="hero-copy"><p className="eyebrow light">THE SIGNAL BEHIND EVERY SHORTLIST</p><h1>Turn potential into placement.</h1><p>One clearer profile. Smarter matching. Better conversations with the companies that matter.</p></div>
      <div className="hero-foot">Built for ambitious campuses · 2026</div>
    </section>
    <section className="login-panel"><div className="login-form-wrap">
      <p className="eyebrow">WELCOME BACK</p><h2>{register ? 'Create your workspace.' : 'Your next role starts here.'}</h2><p className="muted">Sign in to your placement workspace.</p>
      <div className="role-switch">
        <button className={role === 'Student' ? 'selected' : ''} onClick={() => setRole('Student')}><GraduationCap size={17}/>Student</button>
        <button className={role === 'Placement officer' ? 'selected' : ''} onClick={() => setRole('Placement officer')}><BriefcaseBusiness size={17}/>Placement officer</button>
      </div>
      <form onSubmit={submit} className="login-fields">
        <input type="email" placeholder="College email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" minLength="6" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="primary-btn full" type="submit">{register ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button>
      </form>
      <button className="text-button" onClick={() => setRegister(!register)}>{register ? 'Already have an account? Sign in' : 'New to SkillMatch? Create an account'}</button>
      <p className="demo-note">Demo mode · Any email and password (6+ characters) will open the workspace.</p>
    </div></section>
  </main>;
}

function Header({ email, role, onLogout }) {
  return <header className="topbar"><Brand/><div className="user-area"><span className="avatar">{(email[0] || 'S').toUpperCase()}</span><span className="user-meta"><b>{email.split('@')[0]}</b><small>{role}</small></span><button className="icon-button" title="Sign out" onClick={onLogout}><LogOut size={17}/></button></div></header>;
}

function StudentView({ jobs, onSelectJob }) {
  const [name, setName] = useState('Aarav Sharma');
  const [linkedin, setLinkedin] = useState('');
  const [certs, setCerts] = useState('AWS Cloud Practitioner');
  const [projects, setProjects] = useState('github.com/you/project');
  const [resume, setResume] = useState('');
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('');
  const filtered = jobs.filter(j => `${j.title} ${j.company} ${j.skills.join(' ')}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="workspace student-workspace">
    <div className="page-heading"><div><p className="eyebrow">STUDENT WORKSPACE</p><h1>Your signal, <em>sharpened.</em></h1><p className="muted">Keep your profile current and see what employers are asking for.</p></div><Tag tone="success"><CheckCircle2 size={13}/> {resume ? 'Resume uploaded' : 'Add a resume to get match-ready'}</Tag></div>
    <div className="student-grid">
      <section className="panel profile-panel">
        <div className="panel-heading"><div><b>Your profile</b><small>The details companies see in a shortlist.</small></div><button className="small-primary" onClick={()=>setSaved(true)}>Save changes</button></div>
        <div className="form-grid">
          <label>Full name<input value={name} onChange={e=>setName(e.target.value)}/></label>
          <label>LinkedIn URL<input placeholder="linkedin.com/in/you" value={linkedin} onChange={e=>setLinkedin(e.target.value)}/></label>
          <label>Certifications<div className="input-add"><input value={certs} onChange={e=>setCerts(e.target.value)}/><button aria-label="Add certification"><Plus size={15}/></button></div></label>
          <label>Project links<div className="input-add"><input value={projects} onChange={e=>setProjects(e.target.value)}/><button aria-label="Add project"><Plus size={15}/></button></div></label>
        </div>
        <label className="upload-zone"><Upload size={18}/><span><b>{resume || 'Upload your resume'}</b><small>PDF, DOCX, or TXT · up to 5 MB</small></span><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>setResume(e.target.files?.[0]?.name || '')}/></label>
        {saved && <p className="inline-success"><CheckCircle2 size={14}/> Profile changes saved in this demo session.</p>}
      </section>
      <section className="market-card">
        <div className="market-title"><span>MARKET PULSE</span><ChartNoAxesColumn size={17}/></div><h3>Skills employers ask for</h3><p>Stay one step ahead of the next posting.</p>
        {demand.map(([skill, n])=><div className="demand-row" key={skill}><div><b>{skill}</b><small>{n} postings</small></div><div className="bar"><i style={{width:`${n/5*100}%`}}/></div></div>)}
      </section>
    </div>
    <section className="opportunities">
      <div className="section-heading"><div><p className="eyebrow">OPEN OPPORTUNITIES</p><h2>See where you stand</h2></div><div className="search-box"><Search size={15}/><input placeholder="Search roles or skills" value={filter} onChange={e=>setFilter(e.target.value)}/></div></div>
      <div className="job-grid">{filtered.map(job=><article className="job-card" key={job.id}><div className="job-card-top"><div><h3>{job.title}</h3><p>{job.company}</p></div><FileText size={15}/></div><div className="tags">{job.skills.map(s=><Tag key={s}>{s}</Tag>)}</div><button className="outline-btn" onClick={()=>onSelectJob(job)}>View leaderboard <ArrowRight size={14}/></button></article>)}</div>
      {filtered.length===0 && <div className="empty-state">No roles match that search.</div>}
    </section>
  </div>;
}

function OfficerView({ jobs, setJobs, onSelectJob }) {
  const [title,setTitle] = useState('');
  const [company,setCompany] = useState('');
  const [description,setDescription] = useState('');
  const [skills,setSkills] = useState('');
  const [search,setSearch] = useState('');
  const [notice,setNotice] = useState('');
  const post = (e) => {
    e.preventDefault();
    const cleanSkills = skills.split(',').map(s=>s.trim()).filter(Boolean);
    if (!title.trim() || !company.trim() || cleanSkills.length===0) { setNotice('Add a role title, company and at least one required skill.'); return; }
    const job = {id:Date.now(), title, company, skills:cleanSkills, count:0, status:'Open'};
    setJobs([job,...jobs]); setTitle('');setCompany('');setDescription('');setSkills('');setNotice('Role added to the live shortlist.'); 
  };
  const visible = jobs.filter(j=>`${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="workspace officer-workspace">
    <div className="page-heading"><div><p className="eyebrow">PLACEMENT COMMAND CENTER</p><h1>Shortlist with <em>signal.</em></h1><p className="muted">Post the brief. Let skill evidence lead the conversation.</p></div><Tag><Users size={14}/>{jobs.length} active roles</Tag></div>
    <div className="officer-grid">
      <section className="panel post-panel"><div className="panel-heading"><div className="post-icon"><Plus size={20}/></div><div><b>Post a new role</b><small>Requirements become searchable instantly.</small></div></div>
        <form className="post-form" onSubmit={post}>
          <input placeholder="Role title · e.g. Frontend Engineer" value={title} onChange={e=>setTitle(e.target.value)}/>
          <input placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)}/>
          <textarea placeholder="Describe the opportunity and team..." value={description} onChange={e=>setDescription(e.target.value)} rows="4"/>
          <input placeholder="Required skills, comma separated" value={skills} onChange={e=>setSkills(e.target.value)}/>
          <button className="primary-btn full" type="submit">Post role <ArrowRight size={16}/></button>
          {notice && <p className={notice.startsWith('Role')?'inline-success':'form-error'}>{notice}</p>}
        </form>
      </section>
      <section className="shortlists"><div className="section-heading compact"><div><h2>Live shortlists</h2><p className="muted">AI reads profiles against each job brief.</p></div><span className="ai-label"><Sparkles size={13}/> AI-assisted demo</span></div>
        <div className="search-box shortlist-search"><Search size={15}/><input placeholder="Search posted roles" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        {visible.map(job=><article className="shortlist-card" key={job.id}><button className="shortlist-open" onClick={()=>onSelectJob(job)}><span><b>{job.title}</b> <Tag tone="success">OPEN</Tag><small>{job.company} · {job.skills.join(' · ')}</small></span><ChevronDown size={17}/></button>
          <div className="shortlist-preview"><div className="preview-label"><Sparkles size={13}/> AI resume parsing <span>DEMO DATA</span></div>{students.slice(0,3).map((s,i)=><div className="candidate-mini" key={s.name}><span className="rank">{i+1}</span><div className="candidate-info"><b>{s.name}</b><small>{s.status} · {s.evidence}</small></div><strong>{Math.max(0,s.score - Math.max(0,job.skills.length-3)*4)}%</strong></div>)}<button className="view-all" onClick={()=>onSelectJob(job)}>View full shortlist <ArrowRight size={14}/></button></div>
        </article>)}
      </section>
    </div>
  </div>;
}

function Leaderboard({ job, onBack }) {
  const ranked = useMemo(()=>students.map(s=>({...s, score: Math.max(0, Math.round(s.score - Math.max(0,job.skills.length-3)*3))})).sort((a,b)=>b.score-a.score),[job]);
  return <div className="workspace leaderboard-workspace">
    <button className="back-link" onClick={onBack}>← Back to dashboard</button>
    <div className="page-heading"><div><p className="eyebrow">JOB-SPECIFIC LEADERBOARD</p><h1>{job.title} at <em>{job.company}</em></h1><p className="muted">Candidate ranking based on required-skill overlap and profile evidence.</p></div><Tag tone="success">OPEN ROLE</Tag></div>
    <section className="panel leaderboard-panel"><div className="leaderboard-head"><div><h2>Recommended candidates</h2><p className="muted">{ranked.length} demo profiles · required: {job.skills.join(', ')}</p></div><button className="outline-btn" onClick={()=>window.print()}><Download size={15}/> Export / Print</button></div>
      {ranked.map((s,i)=><article className="candidate-row" key={s.name}><span className="rank large">{i+1}</span><div className="candidate-info"><b>{s.name}</b><small>{s.dept} · {s.evidence}</small><div className="tags">{s.skills.map(skill=><Tag key={skill} tone={job.skills.some(r=>r.toLowerCase()===skill.toLowerCase())?'matched':'missing'}>{skill}</Tag>)}</div></div><div className="score-block"><strong>{s.score}%</strong><small>MATCH SCORE</small></div><div className="candidate-reason"><b>Why this match</b><p>{s.skills.filter(skill=>job.skills.some(r=>r.toLowerCase()===skill.toLowerCase())).length} matching listed skills. Review project evidence and eligibility before shortlisting.</p></div></article>)}
      <p className="disclaimer">Demo ranking only. Replace sample profiles and illustrative scores with verified student records and a reviewed matching model before production use.</p>
    </section>
  </div>;
}

function App() {
  const [session,setSession] = useState(null);
  const [jobs,setJobs] = useState(initialJobs);
  const [selected,setSelected] = useState(null);
  const [mobileMenu,setMobileMenu] = useState(false);
  if (!session) return <Login onLogin={(role,email)=>setSession({role,email})}/>;
  return <div className="app-shell"><Header email={session.email} role={session.role} onLogout={()=>{setSession(null);setSelected(null)}}/>
    {selected ? <Leaderboard job={selected} onBack={()=>setSelected(null)}/> :
      session.role === 'Student' ? <StudentView jobs={jobs} onSelectJob={setSelected}/> : <OfficerView jobs={jobs} setJobs={setJobs} onSelectJob={setSelected}/>}
    <footer className="app-footer">SkillMatch <span>·</span> Placement intelligence for ambitious campuses</footer>
  </div>;
}
export default App;