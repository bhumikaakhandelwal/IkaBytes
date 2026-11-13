import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles, GraduationCap, BriefcaseBusiness, ArrowRight, LogOut, Plus,
  Upload, FileText, ChartNoAxesColumn, Users, Search, ChevronDown,
  CheckCircle2, Download, Loader2,
} from 'lucide-react';
import { api, tokenStore, ROLE_TO_API, ROLE_FROM_API } from './api.js';

function Brand() {
  return <div className="brand"><span className="brand-icon"><Sparkles size={19}/></span><span><b>SkillMatch</b><small>PLACEMENT INTELLIGENCE</small></span></div>;
}
function Tag({ children, tone = '' }) { return <span className={`tag ${tone}`}>{children}</span>; }
function Loading({ label = 'Loading…' }) { return <div className="empty-state"><Loader2 size={16} className="spin"/> {label}</div>; }

const toList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

function Login({ onLogin }) {
  const [role, setRole] = useState('Student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const payload = { email, password, role: ROLE_TO_API[role] };
      const { token, user } = register ? await api.register({ ...payload, name }) : await api.login(payload);
      tokenStore.set(token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return <main className="login-shell">
    <section className="login-hero">
      <Brand/>
      <div className="hero-copy"><p className="eyebrow light">THE SIGNAL BEHIND EVERY SHORTLIST</p><h1>Turn potential into placement.</h1><p>One clearer profile. Smarter matching. Better conversations with the companies that matter.</p></div>
      <div className="hero-foot">Built for ambitious campuses · 2026</div>
    </section>
    <section className="login-panel"><div className="login-form-wrap">
      <p className="eyebrow">{register ? 'GET STARTED' : 'WELCOME BACK'}</p><h2>{register ? 'Create your workspace.' : 'Your next role starts here.'}</h2><p className="muted">{register ? 'Set up your placement account.' : 'Sign in to your placement workspace.'}</p>
      <div className="role-switch">
        <button type="button" className={role === 'Student' ? 'selected' : ''} onClick={() => setRole('Student')}><GraduationCap size={17}/>Student</button>
        <button type="button" className={role === 'Placement officer' ? 'selected' : ''} onClick={() => setRole('Placement officer')}><BriefcaseBusiness size={17}/>Placement officer</button>
      </div>
      <form onSubmit={submit} className="login-fields">
        {register && <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />}
        <input type="email" placeholder="College email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" minLength="6" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="primary-btn full" type="submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button>
        {error && <p className="form-error">{error}</p>}
      </form>
      <button type="button" className="text-button" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Already have an account? Sign in' : 'New to SkillMatch? Create an account'}</button>
    </div></section>
  </main>;
}

function Header({ user, onLogout }) {
  const label = user.name || user.email.split('@')[0];
  return <header className="topbar"><Brand/><div className="user-area"><span className="avatar">{(label[0] || 'S').toUpperCase()}</span><span className="user-meta"><b>{label}</b><small>{ROLE_FROM_API[user.role]}</small></span><button className="icon-button" title="Sign out" onClick={onLogout}><LogOut size={17}/></button></div></header>;
}

function StudentView({ onSelectJob }) {
  const [form, setForm] = useState(null);
  const [resume, setResume] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [notice, setNotice] = useState({ text: '', ok: true });
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState(null);
  const [demand, setDemand] = useState([]);
  const [filter, setFilter] = useState('');

  const loadProfile = (profile) => {
    setForm({
      name: profile.name || '', department: profile.department || '', linkedin: profile.linkedin || '',
      cgpa: profile.cgpa ?? '', skills: profile.skills.join(', '),
      certifications: profile.certifications.join(', '), projects: profile.projects.join(', '),
    });
    setResume(profile.resume);
    setExtracted(profile.extractedSkills || []);
  };

  useEffect(() => {
    api.getProfile().then(({ profile }) => loadProfile(profile)).catch((e) => setNotice({ text: e.message, ok: false }));
    api.demand().then(({ demand }) => setDemand(demand)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.listJobs(filter).then(({ jobs }) => setJobs(jobs)).catch(() => setJobs([]));
    }, 250);
    return () => clearTimeout(t);
  }, [filter]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      const { profile } = await api.updateProfile({
        ...form, skills: toList(form.skills), certifications: toList(form.certifications), projects: toList(form.projects),
      });
      loadProfile(profile);
      setNotice({ text: 'Profile saved.', ok: true });
    } catch (e) {
      setNotice({ text: e.message, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { profile } = await api.uploadResume(file);
      setResume(profile.resume);
      setExtracted(profile.extractedSkills || []);
      setNotice({ text: 'Resume uploaded.', ok: true });
    } catch (err) {
      setNotice({ text: err.message, ok: false });
    }
  };

  const maxDemand = Math.max(1, ...demand.map((d) => d.count));

  return <div className="workspace student-workspace">
    <div className="page-heading"><div><p className="eyebrow">STUDENT WORKSPACE</p><h1>Your signal, <em>sharpened.</em></h1><p className="muted">Keep your profile current and see what employers are asking for.</p></div><Tag tone={resume ? 'success' : ''}><CheckCircle2 size={13}/> {resume ? 'Resume uploaded' : 'Add a resume to get match-ready'}</Tag></div>
    <div className="student-grid">
      <section className="panel profile-panel">
        <div className="panel-heading"><div><b>Your profile</b><small>The details companies see in a shortlist.</small></div><button className="small-primary" onClick={save} disabled={!form || saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
        {!form ? <Loading label="Loading profile…"/> : <>
          <div className="form-grid">
            <label>Full name<input value={form.name} onChange={set('name')}/></label>
            <label>Department<input placeholder="Computer Engineering" value={form.department} onChange={set('department')}/></label>
            <label>CGPA (self-reported)<input type="number" step="0.01" min="0" max="10" placeholder="8.5" value={form.cgpa} onChange={set('cgpa')}/></label>
            <label>LinkedIn URL<input placeholder="linkedin.com/in/you" value={form.linkedin} onChange={set('linkedin')}/></label>
            <label className="span-2">Skills<input placeholder="React, JavaScript, SQL (comma separated)" value={form.skills} onChange={set('skills')}/></label>
            <label>Certifications<input placeholder="AWS Cloud Practitioner, …" value={form.certifications} onChange={set('certifications')}/></label>
            <label>Project links<input placeholder="github.com/you/project, …" value={form.projects} onChange={set('projects')}/></label>
          </div>
          <label className="upload-zone"><Upload size={18}/><span><b>{resume?.originalName || 'Upload your resume'}</b><small>PDF, DOCX, or TXT · up to 5 MB{extracted.length ? ` · detected: ${extracted.join(', ')}` : ''}</small></span><input type="file" accept=".pdf,.doc,.docx,.txt" onChange={upload}/></label>
        </>}
        {notice.text && <p className={notice.ok ? 'inline-success' : 'form-error'}>{notice.ok && <CheckCircle2 size={14}/>} {notice.text}</p>}
      </section>
      <section className="market-card">
        <div className="market-title"><span>MARKET PULSE</span><ChartNoAxesColumn size={17}/></div><h3>Skills employers ask for</h3><p>Stay one step ahead of the next posting.</p>
        {demand.length === 0 && <p>No open postings yet.</p>}
        {demand.map(({ skill, count })=><div className="demand-row" key={skill}><div><b>{skill}</b><small>{count} posting{count === 1 ? '' : 's'}</small></div><div className="bar"><i style={{width:`${count/maxDemand*100}%`}}/></div></div>)}
      </section>
    </div>
    <section className="opportunities">
      <div className="section-heading"><div><p className="eyebrow">OPEN OPPORTUNITIES</p><h2>See where you stand</h2></div><div className="search-box"><Search size={15}/><input placeholder="Search roles or skills" value={filter} onChange={e=>setFilter(e.target.value)}/></div></div>
      {jobs === null ? <Loading label="Loading roles…"/> : <>
        <div className="job-grid">{jobs.map(job=><article className="job-card" key={job.id}><div className="job-card-top"><div><h3>{job.title}</h3><p>{job.company}{job.minCgpa ? ` · CGPA ${job.minCgpa}+` : ''}</p></div><FileText size={15}/></div><div className="tags">{job.skills.map(s=><Tag key={s}>{s}</Tag>)}</div><button className="outline-btn" onClick={()=>onSelectJob(job)}>View leaderboard <ArrowRight size={14}/></button></article>)}</div>
        {jobs.length===0 && <div className="empty-state">No roles match that search.</div>}
      </>}
    </section>
  </div>;
}

function OfficerView({ onSelectJob }) {
  const [title,setTitle] = useState('');
  const [company,setCompany] = useState('');
  const [description,setDescription] = useState('');
  const [skills,setSkills] = useState('');
  const [minCgpa,setMinCgpa] = useState('');
  const [search,setSearch] = useState('');
  const [notice,setNotice] = useState({ text: '', ok: true });
  const [jobs,setJobs] = useState(null);
  const [shortlists,setShortlists] = useState({});
  const [posting,setPosting] = useState(false);

  const refresh = useCallback(async () => {
    const [{ jobs }, { shortlists }] = await Promise.all([api.listJobs(), api.shortlists(3)]);
    setJobs(jobs); setShortlists(shortlists);
  }, []);
  useEffect(() => { refresh().catch((e) => { setJobs([]); setNotice({ text: e.message, ok: false }); }); }, [refresh]);

  const post = async (e) => {
    e.preventDefault();
    const cleanSkills = toList(skills);
    if (!title.trim() || !company.trim() || cleanSkills.length===0) { setNotice({ text: 'Add a role title, company and at least one required skill.', ok: false }); return; }
    setPosting(true);
    try {
      await api.createJob({ title, company, description, skills: cleanSkills, minCgpa });
      setTitle(''); setCompany(''); setDescription(''); setSkills(''); setMinCgpa('');
      setNotice({ text: 'Role added to the live shortlist.', ok: true });
      await refresh();
    } catch (err) {
      setNotice({ text: err.message, ok: false });
    } finally {
      setPosting(false);
    }
  };

  const visible = (jobs || []).filter(j=>`${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase()));
  const openCount = (jobs || []).filter(j => j.status === 'Open').length;

  return <div className="workspace officer-workspace">
    <div className="page-heading"><div><p className="eyebrow">PLACEMENT COMMAND CENTER</p><h1>Shortlist with <em>signal.</em></h1><p className="muted">Post the brief. Let skill evidence lead the conversation.</p></div><Tag><Users size={14}/>{openCount} active roles</Tag></div>
    <div className="officer-grid">
      <section className="panel post-panel"><div className="panel-heading"><div className="post-icon"><Plus size={20}/></div><div><b>Post a new role</b><small>Requirements become searchable instantly.</small></div></div>
        <form className="post-form" onSubmit={post}>
          <input placeholder="Role title · e.g. Frontend Engineer" value={title} onChange={e=>setTitle(e.target.value)}/>
          <input placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)}/>
          <textarea placeholder="Describe the opportunity and team..." value={description} onChange={e=>setDescription(e.target.value)} rows="4"/>
          <input placeholder="Required skills, comma separated" value={skills} onChange={e=>setSkills(e.target.value)}/>
          <input type="number" step="0.1" min="0" max="10" placeholder="Minimum CGPA (optional)" value={minCgpa} onChange={e=>setMinCgpa(e.target.value)}/>
          <button className="primary-btn full" type="submit" disabled={posting}>{posting ? 'Posting…' : 'Post role'} <ArrowRight size={16}/></button>
          {notice.text && <p className={notice.ok?'inline-success':'form-error'}>{notice.text}</p>}
        </form>
      </section>
      <section className="shortlists"><div className="section-heading compact"><div><h2>Live shortlists</h2><p className="muted">Profiles ranked against each job brief.</p></div><span className="ai-label"><Sparkles size={13}/> Skill-match ranking</span></div>
        <div className="search-box shortlist-search"><Search size={15}/><input placeholder="Search posted roles" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        {jobs === null && <Loading label="Loading roles…"/>}
        {jobs !== null && visible.length === 0 && <div className="empty-state">No roles yet. Post one to see a shortlist.</div>}
        {visible.map(job=>{
          const top = shortlists[job.id] || [];
          return <article className="shortlist-card" key={job.id}><button className="shortlist-open" onClick={()=>onSelectJob(job)}><span><b>{job.title}</b> <Tag tone={job.status === 'Open' ? 'success' : ''}>{job.status.toUpperCase()}</Tag><small>{job.company} · {job.skills.join(' · ')} · {job.count} applicant{job.count === 1 ? '' : 's'}</small></span><ChevronDown size={17}/></button>
            <div className="shortlist-preview"><div className="preview-label"><Sparkles size={13}/> Top matches <span>LIVE</span></div>
              {top.length === 0 && <p className="muted" style={{fontSize:11}}>No matching student profiles yet.</p>}
              {top.map(s=><div className="candidate-mini" key={s.id}><span className="rank">{s.rank}</span><div className="candidate-info"><b>{s.name}</b><small>{s.status} · {s.evidence}</small></div><strong>{s.score}%</strong></div>)}
              <button className="view-all" onClick={()=>onSelectJob(job)}>View full shortlist <ArrowRight size={14}/></button></div>
          </article>;
        })}
      </section>
    </div>
  </div>;
}

function Leaderboard({ job, role, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);

  const load = useCallback(() => api.leaderboard(job.id).then(setData).catch((e) => setError(e.message)), [job.id]);
  useEffect(() => { load(); }, [load]);

  const apply = async () => {
    setApplying(true); setError('');
    try { await api.apply(job.id); await load(); }
    catch (e) { setError(e.message); }
    finally { setApplying(false); }
  };

  const isStudent = role === 'student';
  const current = data?.job || job;

  return <div className="workspace leaderboard-workspace">
    <button className="back-link" onClick={onBack}>← Back to dashboard</button>
    <div className="page-heading"><div><p className="eyebrow">JOB-SPECIFIC LEADERBOARD</p><h1>{current.title} at <em>{current.company}</em></h1><p className="muted">Candidate ranking based on required-skill overlap, profile evidence and CGPA.</p></div><Tag tone={current.status === 'Open' ? 'success' : ''}>{current.status === 'Open' ? 'OPEN ROLE' : 'CLOSED'}</Tag></div>
    <section className="panel leaderboard-panel"><div className="leaderboard-head"><div><h2>{isStudent ? 'Where you stand' : 'Recommended candidates'}</h2><p className="muted">{data ? `${data.total} matching profiles` : '…'} · required: {current.skills.join(', ')}{current.minCgpa ? ` · CGPA ${current.minCgpa}+` : ''}</p></div>
        <div className="head-actions">
          {isStudent && data && (data.application
            ? <Tag tone="success"><CheckCircle2 size={13}/> Applied · {data.application.status}</Tag>
            : <button className="small-primary" onClick={apply} disabled={applying || current.status !== 'Open'}>{applying ? 'Applying…' : 'Apply to this role'}</button>)}
          {!isStudent && <button className="outline-btn" onClick={()=>window.print()}><Download size={15}/> Export / Print</button>}
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!data && !error && <Loading label="Ranking candidates…"/>}
      {data && data.candidates.length === 0 && <div className="empty-state">No student profiles list these skills yet.</div>}
      {data?.candidates.map((s)=><article className={`candidate-row${s.isYou ? ' you-row' : ''}`} key={s.id}><span className="rank large">{s.rank}</span><div className="candidate-info"><b>{s.name}{s.isYou ? ' (you)' : ''}</b><small>{[s.department, s.evidence, s.cgpa != null ? `CGPA ${s.cgpa}` : null].filter(Boolean).join(' · ')}</small><div className="tags">{current.skills.map(skill=><Tag key={skill} tone={s.matched.includes(skill)?'matched':'missing'}>{skill}</Tag>)}</div></div><div className="score-block"><strong>{s.score}%</strong><small>MATCH SCORE</small></div><div className="candidate-reason"><b>{s.status}</b><p>{s.reason}</p></div></article>)}
      <p className="disclaimer">Scores are a starting point. CGPA is self-reported. Review project evidence and eligibility before shortlisting.</p>
    </section>
  </div>;
}

function App() {
  const [user,setUser] = useState(null);
  const [checking,setChecking] = useState(Boolean(tokenStore.get()));
  const [selected,setSelected] = useState(null);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then(({ user }) => setUser(user)).catch(() => tokenStore.clear()).finally(() => setChecking(false));
  }, []);

  const logout = () => { tokenStore.clear(); setUser(null); setSelected(null); };

  if (checking) return <Loading label="Opening your workspace…"/>;
  if (!user) return <Login onLogin={setUser}/>;
  return <div className="app-shell"><Header user={user} onLogout={logout}/>
    {selected ? <Leaderboard job={selected} role={user.role} onBack={()=>setSelected(null)}/> :
      user.role === 'student' ? <StudentView onSelectJob={setSelected}/> : <OfficerView onSelectJob={setSelected}/>}
    <footer className="app-footer">SkillMatch <span>·</span> Placement intelligence for ambitious campuses</footer>
  </div>;
}
export default App;
