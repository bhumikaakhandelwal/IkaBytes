import React, { useEffect, useState } from 'react';
import { Search, Loader2, FileText, AlertTriangle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { api } from './api.js';
import Select from './Select.jsx';

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export const DEFAULT_DIRECTORY_STATE = {
  q: '', department: '', minCgpa: '', skill: '', hasResume: false, sort: 'name', page: 1,
};

/**
 * Placement officer's directory of all students. Filters live in the parent
 * (`state` / `setState`) so they are kept when the officer opens a profile and comes back.
 */
export default function StudentsSection({ state, setState, onOpenStudent }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Text boxes are applied after the officer stops typing
  const [qDraft, setQDraft] = useState(state.q);
  const [skillDraft, setSkillDraft] = useState(state.skill);

  const update = (patch) => setState((s) => ({ ...s, page: 1, ...patch }));

  useEffect(() => {
    const t = setTimeout(() => {
      if (qDraft !== state.q || skillDraft !== state.skill) update({ q: qDraft, skill: skillDraft });
    }, 350);
    return () => clearTimeout(t);
  }, [qDraft, skillDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listStudents({ ...state, limit: 20 })
      .then((d) => { if (active) { setData(d); setError(''); } })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [state]);

  const filtersOn = state.q || state.department || state.minCgpa || state.skill || state.hasResume;

  return (
    <div className="workspace students-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT DIRECTORY</p>
          <h1>Review every student, <em>first-hand.</em></h1>
          <p className="muted">Open a profile to check skills, certifications, projects and the resume yourself before shortlisting.</p>
        </div>
        <Tag><Users size={14} /> {data ? `${data.total} student${data.total === 1 ? '' : 's'}` : '…'}</Tag>
      </div>

      <section className="panel students-panel">
        <div className="students-filters">
          <div className="search-box">
            <Search size={15} />
            <input placeholder="Search name or email" value={qDraft} onChange={(e) => setQDraft(e.target.value)} />
          </div>
          <Select
            className="filter-select"
            value={state.department}
            onChange={(v) => update({ department: v })}
            ariaLabel="Department"
            options={[{ value: '', label: 'All departments' }, ...(data?.departments || [])]}
          />
          <input
            type="number" min="0" max="10" step="0.1" placeholder="Min CGPA"
            value={state.minCgpa} onChange={(e) => update({ minCgpa: e.target.value })}
          />
          <input className="skill-filter" placeholder="Has skill, e.g. SQL" value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} />
          <label className="check">
            <input type="checkbox" checked={state.hasResume} onChange={(e) => update({ hasResume: e.target.checked })} />
            Has resume
          </label>
          <Select
            className="filter-select"
            value={state.sort}
            onChange={(v) => update({ sort: v })}
            ariaLabel="Sort by"
            options={[
              { value: 'name', label: 'Sort: Name' },
              { value: 'cgpa', label: 'Sort: CGPA (high → low)' },
              { value: 'updated', label: 'Sort: Recently updated' },
            ]}
          />
          {filtersOn && (
            <button type="button" className="text-link" onClick={() => { setQDraft(''); setSkillDraft(''); setState(DEFAULT_DIRECTORY_STATE); }}>
              Clear filters
            </button>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        {!data && !error && <div className="empty-state"><Loader2 size={16} className="spin" /> Loading students…</div>}
        {data && data.students.length === 0 && (
          <div className="empty-state">{filtersOn ? 'No students match these filters.' : 'No students have registered yet.'}</div>
        )}

        <div className={`student-list ${loading && data ? 'is-loading' : ''}`}>
          {data?.students.map((s) => (
            <button type="button" className="student-row" key={s.id} onClick={() => onOpenStudent(s.id)}>
              <span className="avatar">{(s.name[0] || 'S').toUpperCase()}</span>
              <span className="student-main">
                <b>{s.name}</b>
                <small>{[s.department || 'Department not set', s.cgpa != null ? `CGPA ${s.cgpa}` : 'CGPA not set'].join(' · ')}</small>
                <span className="tags">
                  {s.topSkills.map((k) => <Tag key={k}>{k}</Tag>)}
                  {s.skillCount > s.topSkills.length && <Tag>+{s.skillCount - s.topSkills.length} more</Tag>}
                </span>
              </span>
              <span className="student-evidence">
                <small>{s.certCount} cert{s.certCount === 1 ? '' : 's'} · {s.projectCount} project{s.projectCount === 1 ? '' : 's'}</small>
                {s.hasResume
                  ? <Tag tone="success"><FileText size={11} /> Resume</Tag>
                  : <Tag tone="danger">No resume</Tag>}
                {s.missing.length > 0 && (
                  <small className="missing-note"><AlertTriangle size={11} /> Missing: {s.missing.join(', ')}</small>
                )}
              </span>
            </button>
          ))}
        </div>

        {data && data.pages > 1 && (
          <div className="pager">
            <button type="button" disabled={state.page <= 1} onClick={() => setState((s) => ({ ...s, page: s.page - 1 }))}>
              <ChevronLeft size={15} /> Previous
            </button>
            <span>Page {data.page} of {data.pages}</span>
            <button type="button" disabled={state.page >= data.pages} onClick={() => setState((s) => ({ ...s, page: s.page + 1 }))}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
