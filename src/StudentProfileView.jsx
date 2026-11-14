import React, { useCallback, useEffect, useState } from 'react';
import {
  Loader2, FileText, ExternalLink, AlertTriangle, Mail, Linkedin, Award, FolderGit2,
  Check, Plus, UserCheck, Download,
} from 'lucide-react';
import { api } from './api.js';

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/**
 * Full student profile for placement officers: evidence first (skills, certifications,
 * projects, resume), then how the student fits each open role. No AI suggestions here,
 * so the officer forms their own judgement.
 */
export default function StudentProfileView({ studentId, backLabel, onBack, onOpenJob }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [busyJob, setBusyJob] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getStudent(studentId));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const openResume = async () => {
    const r = data.student.resume;
    setResumeError('');
    setResumeBusy(true);
    // Open the tab right away (inside the click) so pop-up blockers allow it
    const tab = r.isPdf ? window.open('', '_blank') : null;
    try {
      const blob = await api.studentResume(studentId);
      const url = URL.createObjectURL(blob);
      if (tab) {
        tab.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = r.originalName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (tab) tab.close();
      setResumeError(e.message);
    } finally {
      setResumeBusy(false);
    }
  };

  const toggleShortlist = async (jobId) => {
    setBusyJob(jobId);
    try {
      await api.toggleShortlist(jobId, studentId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyJob(null);
    }
  };

  if (error && !data) {
    return (
      <div className="workspace">
        <button className="back-link" onClick={onBack}>← Back to {backLabel}</button>
        <p className="form-error">{error}</p>
      </div>
    );
  }
  if (!data) {
    return <div className="workspace"><div className="empty-state"><Loader2 size={16} className="spin" /> Loading profile…</div></div>;
  }

  const { student: s, fits, shortlistedFor } = data;

  return (
    <div className="workspace profile-workspace">
      <button className="back-link" onClick={onBack}>← Back to {backLabel}</button>

      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT PROFILE</p>
          <h1>{s.name}</h1>
          <p className="muted profile-meta">
            <span>{s.department || 'Department not set'}</span>
            <span>{s.cgpa != null ? `CGPA ${s.cgpa} (self-reported)` : 'CGPA not set'}</span>
            {s.email && <a href={`mailto:${s.email}`}><Mail size={13} /> {s.email}</a>}
            {s.linkedin
              ? <a href={s.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={13} /> LinkedIn <ExternalLink size={11} /></a>
              : s.linkedinRaw && <span title="Not a valid web address">LinkedIn: {s.linkedinRaw}</span>}
          </p>
        </div>
        {shortlistedFor.length > 0 && <Tag tone="success"><UserCheck size={13} /> Shortlisted for {shortlistedFor.length}</Tag>}
      </div>

      {s.missing.length > 0 && (
        <p className="profile-warning"><AlertTriangle size={14} /> Profile incomplete: no {s.missing.join(', ')} added yet.</p>
      )}
      {error && <p className="form-error">{error}</p>}

      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="panel-heading"><div><b><FileText size={15} /> Resume</b><small>Read it yourself before relying on any score.</small></div></div>
          {!s.resume && <p className="muted">No resume uploaded.</p>}
          {s.resume && (
            <>
              <p className="resume-name">{s.resume.originalName}<small>Uploaded {formatDate(s.resume.uploadedAt)}</small></p>
              {s.resume.available ? (
                <button type="button" className="small-primary" onClick={openResume} disabled={resumeBusy}>
                  {resumeBusy ? <><Loader2 size={12} className="spin" /> Opening…</>
                    : s.resume.isPdf ? <><ExternalLink size={12} /> Open resume</> : <><Download size={12} /> Download resume</>}
                </button>
              ) : (
                <p className="form-error">The file isn't on this server (it may have been uploaded on another computer). Ask the student to upload it again.</p>
              )}
              {resumeError && <p className="form-error">{resumeError}</p>}
            </>
          )}
        </section>

        <section className="panel profile-card">
          <div className="panel-heading"><div><b>Skills</b><small>What the student listed vs. what was found in their resume.</small></div></div>
          <p className="eyebrow">LISTED BY STUDENT</p>
          <div className="tags">
            {s.skillsListed.length ? s.skillsListed.map((k) => <Tag key={k}>{k}</Tag>) : <span className="muted">None listed</span>}
          </div>
          <p className="eyebrow">ALSO FOUND IN RESUME</p>
          <div className="tags">
            {s.skillsFromResume.length
              ? s.skillsFromResume.map((k) => <Tag key={k} tone="success">{k}</Tag>)
              : <span className="muted">Nothing extra found</span>}
          </div>
        </section>

        <section className="panel profile-card">
          <div className="panel-heading"><div><b><Award size={15} /> Certifications</b><small>Credential links let you verify them.</small></div></div>
          {s.certifications.length === 0 && <p className="muted">No certifications added.</p>}
          <ul className="evidence-list">
            {s.certifications.map((c) => (
              <li key={c.name}>
                <span>{c.name}</span>
                {c.url
                  ? <a href={c.url} target="_blank" rel="noopener noreferrer">Verify <ExternalLink size={11} /></a>
                  : <small className="muted">No credential link</small>}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel profile-card">
          <div className="panel-heading"><div><b><FolderGit2 size={15} /> Projects</b><small>Links open in a new tab.</small></div></div>
          {s.projects.length === 0 && <p className="muted">No project links added.</p>}
          <ul className="evidence-list">
            {s.projects.map((p) => (
              <li key={p.raw}>
                {p.url
                  ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.raw} <ExternalLink size={11} /></a>
                  : <span title="Not a valid web address">{p.raw}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel fits-panel">
        <div className="panel-heading">
          <div><b>Fit for open roles</b><small>Rule-based match: required skills, evidence, CGPA and department. Click a role to see its leaderboard.</small></div>
        </div>
        {fits.length === 0 && <p className="muted">No open roles right now.</p>}
        {fits.map((f) => (
          <div className="fit-line" key={f.job.id}>
            <button type="button" className="fit-job" onClick={() => onOpenJob(f.job)}>
              <b>{f.job.title}</b>
              <small>{f.job.company}{f.job.department ? ` · ${f.job.department}` : ''}</small>
            </button>
            <div className="tags">
              {f.job.skills.map((k) => <Tag key={k} tone={f.matched.includes(k) ? 'matched' : 'missing'}>{k}</Tag>)}
              {!f.eligible && <Tag tone="danger"><AlertTriangle size={11} /> Not eligible</Tag>}
            </div>
            <strong className="fit-score">{f.score}%</strong>
            <button
              type="button"
              className={`shortlist-action-btn ${f.shortlisted ? 'is-shortlisted' : ''}`}
              onClick={() => toggleShortlist(f.job.id)}
              disabled={busyJob === f.job.id}
            >
              {f.shortlisted ? <><Check size={14} /> Shortlisted</> : <><Plus size={14} /> Shortlist</>}
            </button>
          </div>
        ))}
      </section>

    </div>
  );
}
