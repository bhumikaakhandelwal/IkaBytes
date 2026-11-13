import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, GraduationCap, BriefcaseBusiness, ArrowRight, LogOut, Loader2
} from 'lucide-react';
import { api, tokenStore, ROLE_TO_API, ROLE_FROM_API } from './api.js';
import StudentDashboard from './StudentDashboard.jsx';
import TpoDashboard from './TpoDashboard.jsx';

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon"><Sparkles size={19} /></span>
      <span><b>SkillMatch</b><small>PLACEMENT INTELLIGENCE</small></span>
    </div>
  );
}

export function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export function Login({ onLogin }) {
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
        setNameError('Please enter your full name');
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
        setNameError('Full name should contain alphabets only');
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

  return (
    <main className="login-shell">
      <section className="login-hero">
        <Brand />
        <div className="hero-copy">
          <p className="eyebrow light">SKILL-BASED CAREER MATCHING</p>
          <h1>Right skills. Right roles. Right away.</h1>
          <p>SkillMatch analyses your profile against real job requirements and shows you where you fit best.</p>
        </div>
        <div className="hero-foot">© 2026 SkillMatch · Placement Intelligence</div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
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
          </p>

          <div className="role-switch">
            <button className={role === 'Student' ? 'selected' : ''} onClick={() => setRole('Student')}>
              <GraduationCap size={17} />Student
            </button>
            <button className={role === 'Placement officer' ? 'selected' : ''} onClick={() => setRole('Placement officer')}>
              <BriefcaseBusiness size={17} />Placement officer
            </button>
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
            <button className="primary-btn full" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={18} />
            </button>
            {error && <p className="field-error" style={{ fontSize: '13px', marginTop: '6px' }}>{error}</p>}
          </form>
          <button className="text-button" onClick={() => { setRegister(!register); setError(''); setNameError(''); }}>
            {register ? 'Already have an account? Sign in' : 'New to SkillMatch? Create an account'}
          </button>
        </div>
      </section>
    </main>
  );
}

export function Header({ user, onLogout }) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayRole = ROLE_FROM_API[user?.role] || user?.role || 'Member';
  return (
    <header className="topbar">
      <Brand />
      <div className="user-area">
        <span className="avatar">{(displayName[0] || 'S').toUpperCase()}</span>
        <span className="user-meta">
          <b>{displayName}</b>
          <small>{displayRole}</small>
        </span>
        <button className="icon-button" title="Sign out" onClick={onLogout}>
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

export function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState('');

  // Jobs come from MongoDB; both dashboards call reloadJobs after a change
  const reloadJobs = useCallback(async () => {
    try {
      const { jobs: rows } = await api.listJobs('all');
      setJobs(rows);
      setJobsError('');
    } catch (err) {
      setJobsError(err.message || 'Could not load jobs');
    }
  }, []);

  useEffect(() => {
    if (user) reloadJobs();
  }, [user, reloadJobs]);

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

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null);
    setJobs([]);
  };

  if (checking) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Loader2 size={20} className="spin" /> Opening your workspace…
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  const isOfficer = user.role === 'tpo' || user.role === 'Placement officer';

  return (
    <div className="app-shell">
      <Header user={user} onLogout={handleLogout} />
      {jobsError && <p className="form-error" style={{ textAlign: 'center', marginTop: '12px' }}>{jobsError}</p>}
      {isOfficer ? (
        <TpoDashboard
          jobs={jobs}
          reloadJobs={reloadJobs}
        />
      ) : (
        <StudentDashboard
          jobs={jobs}
          user={user}
        />
      )}
      <footer className="app-footer">SkillMatch <span>·</span> Placement intelligence</footer>
    </div>
  );
}

export default App;
