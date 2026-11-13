import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2, Lightbulb, AlertTriangle } from 'lucide-react';
import { api } from './api.js';

function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

const FIT_TONE = { strong: 'matched', moderate: '', weak: 'missing' };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_TONE = { high: 'missing', medium: '', low: 'matched' };

/**
 * Shows the student's AI career suggestions. They are stored in MongoDB, so opening the
 * dashboard never calls Groq. `version` changes after a profile save or resume upload
 * so the panel picks up the new "Analysing…" status.
 */
export default function AiSuggestions({ version = 0 }) {
  const [insights, setInsights] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [stale, setStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getInsights();
      setAiEnabled(data.aiEnabled);
      setInsights(data.insights);
      setStale(data.stale);
    } catch {
      /* panel stays hidden on error */
    }
  }, []);

  useEffect(() => { load(); }, [load, version]);

  // While an analysis is running, check again every 3 seconds
  useEffect(() => {
    if (insights?.status !== 'pending') return undefined;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [insights?.status, load]);

  const refresh = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      const data = await api.refreshInsights();
      setInsights(data.insights);
      setStale(false);
      setMessage(data.ai === 'cached' ? data.message : '');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (!aiEnabled || !insights) return null;
  const status = insights.status || 'idle';
  const has = Boolean(insights.summary);

  return (
    <section className="panel insights-panel">
      <div className="panel-heading">
        <div>
          <b><Sparkles size={14} /> AI career suggestions</b>
          <small>Based on your resume, profile and the roles posted by your placement office.</small>
        </div>
        <button className="small-primary" onClick={refresh} disabled={status === 'pending' || refreshing}>
          {status === 'pending'
            ? <><Loader2 size={12} className="spin" /> Analysing…</>
            : <><RefreshCw size={12} /> {stale ? 'Update suggestions' : 'Refresh'}</>}
        </button>
      </div>

      {stale && status === 'ready' && (
        <p className="insights-note">New roles were posted or your profile changed since these suggestions were made.</p>
      )}
      {message && <p className="insights-note">{message}</p>}
      {status === 'pending' && !has && <div className="empty-state"><Loader2 size={16} className="spin" /> Reading your resume and comparing it with open roles…</div>}
      {status === 'idle' && <p className="muted insights-empty">Upload your resume or save your profile to get personalised suggestions.</p>}
      {status === 'failed' && (
        <p className="form-error"><AlertTriangle size={13} /> {insights.error || 'Analysis failed.'} Try again in a minute.</p>
      )}

      {has && (
        <>
          <p className="insights-summary">{insights.summary}</p>
          <div className="insights-cols">
            <div>
              <p className="eyebrow">STRENGTHS</p>
              <ul>{(insights.strengths || []).map(s => <li key={s}>{s}</li>)}</ul>
            </div>
            <div>
              <p className="eyebrow">GAPS TO CLOSE</p>
              <ul>{(insights.gaps || []).map(s => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>

          <p className="eyebrow">NEXT STEPS</p>
          <p className="priority-legend">
            Priority shows how much each step should improve your chances for the roles currently posted:
            <b> high</b> = do this first, <b>medium</b> = worth doing soon, <b>low</b> = nice to have.
          </p>
          <div className="suggestion-list">
            {[...(insights.suggestions || [])]
              .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
              .map(s => (
              <div className="suggestion" key={s.title}>
                <Lightbulb size={15} />
                <div>
                  <b>{s.title} <Tag tone={PRIORITY_TONE[s.priority] || ''}>{s.priority} priority</Tag></b>
                  <p>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {(insights.jobFits || []).length > 0 && (
            <>
              <p className="eyebrow">ROLE BY ROLE</p>
              <div className="fit-list">
                {insights.jobFits.map(f => (
                  <div className="fit-row" key={f.jobId}>
                    <span><b>{f.title}</b> · {f.company} <Tag tone={FIT_TONE[f.fit]}>{f.fit} fit</Tag></span>
                    <small>{f.reason}</small>
                    <small className="next-step">→ {f.nextStep}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {insights.generatedAt && (
            <p className="disclaimer">
              AI-generated on {new Date(insights.generatedAt).toLocaleString()}. Treat it as advice, not a verdict.
            </p>
          )}
        </>
      )}
    </section>
  );
}
