import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, X, Plus, Upload, ChartNoAxesColumn, Search, FileText, Lock
} from 'lucide-react';
import { api } from './api.js';

const initialDemand = [
  ['React', 5],
  ['Python', 4],
  ['SQL', 3],
  ['TypeScript', 2],
  ['AWS', 2],
  ['JavaScript', 1]
];

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export function StudentDashboard({ jobs = [], user, onSelectJob }) {
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
  const [demandList, setDemandList] = useState(initialDemand);

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
      const parsedCgpa = (cgpa === '' || cgpa === null || cgpa === undefined) ? null : Number(cgpa);
      const { profile } = await api.updateProfile({
        name: name.trim(),
        department: department.trim(),
        linkedin: linkedin.trim(),
        cgpa: parsedCgpa,
        projects: cleanProjects,
      });

      if (profile) {
        setName(profile.name || '');
        setLinkedin(profile.linkedin || '');
        setCgpa(profile.cgpa != null ? String(profile.cgpa) : '');
        setDepartment(profile.department || '');
        if (profile.projects && profile.projects.length > 0) {
          setProjects(profile.projects);
        }
        setResume(profile.resume);
        setExtracted(profile.extractedSkills || []);
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
    setSaveError('');
    try {
      const { profile } = await api.uploadResume(file);
      if (profile) {
        setResume(profile.resume);
        setExtracted(profile.extractedSkills || []);
        setUploadNotice(`Resume "${profile.resume?.originalName || file.name}" uploaded & saved to database.`);
        setTimeout(() => setUploadNotice(''), 5000);
      }
    } catch (err) {
      setSaveError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = jobs
    .filter(j => {
      if (statusFilter === 'open') return j.status !== 'Closed';
      if (statusFilter === 'closed') return j.status === 'Closed';
      return true;
    })
    .filter(j => `${j.title} ${j.company} ${j.department || ''} ${j.skills.join(' ')}`.toLowerCase().includes(filter.toLowerCase()));

  const resumeDisplayName = (typeof resume === 'string' ? resume : resume?.originalName) || '';

  return (
    <div className="workspace student-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT WORKSPACE</p>
          <h1>Build your <em>placement profile</em></h1>
          <p className="muted">Complete your profile to see how your skills line up with current job postings.</p>
        </div>
        <Tag tone={resumeDisplayName ? 'success' : ''}>
          <CheckCircle2 size={13} /> {resumeDisplayName ? 'Resume uploaded' : 'Add a resume to get match-ready'}
        </Tag>
      </div>

      <div className="student-grid">
        <section className="panel profile-panel">
          <div className="panel-heading">
            <div>
              <b>Your profile</b>
              <small>Saved in MongoDB</small>
            </div>
            <button className="small-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

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
                <option value="Information Technology">
                  Information Technology
                </option>
                <option value="Electronics and Computer Science Engineering">
                  Electronics and Computer Science Engineering
                </option>
                <option value="Electronics">
                  Electronics
                </option>
                <option value="Mechanical Engineering">
                  Mechanical Engineering
                </option>
                <option value="Civil Engineering">
                  Civil Engineering
                </option>
                {department && !['Computer Engineering', 'Information Technology', 'Electronics and Computer Science Engineering', 'Electronics', 'Mechanical Engineering', 'Civil Engineering'].includes(department) && (
                  <option value={department}>{department}</option>
                )}
              </select>
            </label>
          </div>

          <div className="project-links-full">
            <label>Project Links</label>
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
              <b>{resumeDisplayName || (uploading ? 'Uploading resume…' : 'Upload your resume')}</b>
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
          <div className="market-title">
            <span>MARKET PULSE</span>
            <ChartNoAxesColumn size={17} />
          </div>
          <h3>Skills employers ask for</h3>
          <p>Stay one step ahead of the next posting.</p>
          {demandList.map(([skill, n]) => (
            <div className="demand-row" key={skill}>
              <div>
                <b>{skill}</b>
                <small>{n} postings</small>
              </div>
              <div className="bar">
                <i style={{ width: `${Math.min(100, (n / 5) * 100)}%` }} />
              </div>
            </div>
          ))}
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
    </div>
  );
}

export { StudentDashboard as StudentView };
export default StudentDashboard;
