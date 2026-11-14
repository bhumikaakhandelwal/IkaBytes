import React, { useEffect, useState } from 'react';
import {
  Loader2, TrendingUp, TrendingDown, Minus, Users, Download, ChevronDown, ChevronUp, Info, RefreshCw,
} from 'lucide-react';
import { api } from './api.js';
import Select from './Select.jsx';

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export const DEFAULT_GAP_OPTIONS = { department: '', scope: 'eligible', includeClosed: false };

const TREND_ICON = {
  up: <TrendingUp size={14} />,
  down: <TrendingDown size={14} />,
  flat: <Minus size={14} />,
};

// Excel-friendly CSV (BOM so Indian names and symbols open correctly)
function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Skill-gap analytics for planning cohort sessions. Options live in the parent so they survive navigation. */
export default function SkillGaps({ options, setOptions, onOpenStudent }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openKey, setOpenKey] = useState(null);
  const [students, setStudents] = useState({}); // key → list of students lacking it

  const load = () => {
    setLoading(true);
    api.skillGaps(options)
      .then((d) => { setData(d); setError(''); setStudents({}); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [options]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStudents = async (key) => {
    if (openKey === key) { setOpenKey(null); return; }
    setOpenKey(key);
    if (!students[key]) {
      try {
        const d = await api.skillGapStudents(key, options);
        setStudents((cur) => ({ ...cur, [key]: d.students }));
      } catch (e) {
        setStudents((cur) => ({ ...cur, [key]: { error: e.message } }));
      }
    }
  };

  const exportCsv = (skill, key) => {
    const list = students[key];
    if (!Array.isArray(list)) return;
    downloadCsv(`students-without-${key}.csv`, [
      ['Name', 'Email', 'Department', 'CGPA', 'Skill not shown'],
      ...list.map((s) => [s.name, s.email, s.department, s.cgpa ?? '', skill]),
    ]);
  };

  const exportSummary = () => {
    downloadCsv('skill-gaps.csv', [
      ['Skill', 'Roles needing it', 'Students counted', 'Show it', "Don't show it", "% don't show it", 'Priority'],
      ...data.skills.map((s) => [s.skill, s.jobCount, s.population, s.have, s.lacking, s.lackingPct, s.priority]),
    ]);
  };

  const topics = (data?.skills || []).filter((s) => s.lacking > 0).slice(0, 3);
  const set = (patch) => setOptions((o) => ({ ...o, ...patch }));

  return (
    <div className="workspace gaps-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SKILL GAPS</p>
          <h1>Plan sessions where they <em>matter.</em></h1>
          <p className="muted">Skills your posted roles ask for, and how many students don't show them yet.</p>
        </div>
        <button type="button" className="outline-btn auto-width" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <section className="panel gaps-panel">
        <div className="gaps-filters">
          <Select
            className="filter-select"
            value={options.department}
            onChange={(v) => set({ department: v })}
            ariaLabel="Department"
            options={[{ value: '', label: 'All departments' }, ...(data?.departments || [])]}
          />
          <div className="segmented" role="group" aria-label="Which students to count">
            <button type="button" className={options.scope === 'eligible' ? 'active' : ''} onClick={() => set({ scope: 'eligible' })}>
              Eligible students
            </button>
            <button type="button" className={options.scope === 'all' ? 'active' : ''} onClick={() => set({ scope: 'all' })}>
              All students
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={options.includeClosed} onChange={(e) => set({ includeClosed: e.target.checked })} />
            Include closed roles
          </label>
          {data && data.skills.length > 0 && (
            <button type="button" className="text-link" onClick={exportSummary}><Download size={13} /> Export summary</button>
          )}
        </div>

        <p className="gaps-explainer">
          <Info size={13} />
          <span>
            “Don't show it” means the skill isn't listed in the student's profile or found in their resume. They may still know it.{' '}
            {options.scope === 'eligible'
              ? 'Only students who meet the department and CGPA rules of at least one role needing the skill are counted.'
              : 'Every student with a filled-in profile is counted.'}
          </span>
        </p>

        {error && <p className="form-error">{error}</p>}
        {!data && !error && <div className="empty-state"><Loader2 size={16} className="spin" /> Calculating skill gaps…</div>}

        {data && (
          <p className="gaps-totals">
            {data.totals.jobs} role{data.totals.jobs === 1 ? '' : 's'} · {data.totals.activeStudents} student{data.totals.activeStudents === 1 ? '' : 's'} with skills listed
            {data.totals.emptyProfiles > 0 && (
              <span className="missing-note"> · {data.totals.emptyProfiles} with no skills yet (not counted)</span>
            )}
            {!data.trendAvailable && <span className="muted"> · Trends appear once more roles are posted</span>}
          </p>
        )}

        {data && data.skills.length === 0 && (
          <div className="empty-state">No roles to analyse. Post roles (or include closed roles) to see skill gaps.</div>
        )}

        {topics.length > 0 && (
          <div className="topic-cards">
            {topics.map((t, i) => (
              <div className="topic-card" key={t.key}>
                <small>SESSION TOPIC #{i + 1}</small>
                <b>{t.skill}</b>
                <span>{t.lacking} student{t.lacking === 1 ? '' : 's'} · needed by {t.jobCount} role{t.jobCount === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="gap-list">
          {data?.skills.map((s) => {
            const list = students[s.key];
            const open = openKey === s.key;
            return (
              <article className="gap-row" key={s.key}>
                <div className="gap-head">
                  <div className="gap-skill">
                    <b>{s.skill}</b>
                    {s.trend && (
                      <span className={`trend trend-${s.trend.direction}`} title={`${s.trend.recent} posting(s) in the last 30 days vs ${s.trend.previous} in the 30 days before`}>
                        {TREND_ICON[s.trend.direction]} {s.trend.direction === 'up' ? 'Rising' : s.trend.direction === 'down' ? 'Falling' : 'Steady'}
                      </span>
                    )}
                    <small title={s.jobs.map((j) => `${j.title} · ${j.company}`).join('\n')}>
                      Needed by {s.jobCount} role{s.jobCount === 1 ? '' : 's'}: {s.jobs.slice(0, 3).map((j) => j.title).join(', ')}{s.jobs.length > 3 ? '…' : ''}
                    </small>
                  </div>
                  <div className={`gap-figure ${s.lacking === 0 && s.population > 0 ? 'covered' : ''}`}>
                    <strong>{s.lackingPct}%</strong>
                    <small>DON'T SHOW IT</small>
                  </div>
                </div>

                <div className="gap-bar" role="img" aria-label={`${s.have} of ${s.population} students show ${s.skill}`}>
                  {s.population > 0 ? (
                    <>
                      <i className="have" style={{ width: `${100 - s.lackingPct}%` }} />
                      <i className="lack" style={{ width: `${s.lackingPct}%` }} />
                    </>
                  ) : <i className="none" style={{ width: '100%' }} />}
                </div>
                <div className="gap-legend">
                  <span><i className="have" /> {s.have} show it</span>
                  <span><i className="lack" /> {s.lacking} don't</span>
                  <span className="muted">of {s.population} {options.scope === 'eligible' ? 'eligible ' : ''}student{s.population === 1 ? '' : 's'}</span>
                  {s.lacking > 0 && (
                    <button type="button" className="text-link" onClick={() => toggleStudents(s.key)}>
                      <Users size={13} /> {open ? 'Hide' : 'View'} students {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>

                {open && (
                  <div className="gap-students">
                    {!list && <div className="empty-state"><Loader2 size={16} className="spin" /> Loading…</div>}
                    {list?.error && <p className="form-error">{list.error}</p>}
                    {Array.isArray(list) && (
                      <>
                        <div className="gap-students-head">
                          <span>{list.length} student{list.length === 1 ? '' : 's'} to invite</span>
                          <button type="button" className="small-primary" onClick={() => exportCsv(s.skill, s.key)}>
                            <Download size={12} /> Download CSV
                          </button>
                        </div>
                        <ul>
                          {list.map((st) => (
                            <li key={st.id}>
                              <button type="button" className="link-btn" onClick={() => onOpenStudent(st.id)}>{st.name}</button>
                              <small>{[st.department, st.cgpa != null ? `CGPA ${st.cgpa}` : null, st.email].filter(Boolean).join(' · ')}</small>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {data?.skills.length > 0 && <p className="disclaimer">Tip: invite students from the top topics first. Re-check this page after sessions as students update their profiles.</p>}
      </section>
    </div>
  );
}
