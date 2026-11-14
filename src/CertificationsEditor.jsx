import React, { useState } from 'react';
import { Plus, X, Link2, FileText, Loader2 } from 'lucide-react';
import { api } from './api.js';

/** A blank certification row. `mode` says which proof the student is giving. */
export const newCertRow = () => ({ name: '', mode: 'link', url: '', fileKey: '', fileName: '' });

/** Rows from the saved profile. */
export function rowsFromProfile(profile) {
  return (profile?.certificationProofs || []).map((p) => ({
    name: p.name,
    mode: p.fileKey ? 'pdf' : 'link',
    url: p.url || '',
    fileKey: p.fileKey || '',
    fileName: p.fileName || '',
  }));
}

const looksLikeUrl = (v) => {
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch { return false; }
};

/** Problem with a row, or '' if it's fine. Fully empty rows are ignored. */
export function rowProblem(row) {
  const name = row.name.trim();
  const hasProof = row.mode === 'pdf' ? Boolean(row.fileKey) : Boolean(row.url.trim());
  if (!name && !hasProof) return '';
  if (!name) return 'Add the certification name.';
  if (row.mode === 'pdf') return row.fileKey ? '' : 'Upload the certificate PDF.';
  if (!row.url.trim()) return 'Add the credential link.';
  return looksLikeUrl(row.url.trim()) ? '' : 'Enter a valid web address, e.g. https://www.credly.com/badges/…';
}

/** What gets sent to the server (only the chosen proof for each row). */
export function rowsToPayload(rows) {
  return rows
    .filter((r) => r.name.trim() || r.url.trim() || r.fileKey)
    .map((r) => ({
      name: r.name.trim(),
      url: r.mode === 'link' ? r.url.trim() : '',
      fileKey: r.mode === 'pdf' ? r.fileKey : '',
      fileName: r.mode === 'pdf' ? r.fileName : '',
    }));
}

/**
 * Certifications with required proof: each row is a name plus EITHER a credential link
 * OR an uploaded PDF. There is no "add proof later" — the profile can't be saved without it.
 */
export default function CertificationsEditor({ rows, onChange, showErrors = false, max = 20 }) {
  const [uploading, setUploading] = useState({}); // row index → true
  const [uploadErrors, setUploadErrors] = useState({});

  const update = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));

  const upload = async (i, file) => {
    if (!file) return;
    setUploadErrors((e) => ({ ...e, [i]: '' }));
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadErrors((e) => ({ ...e, [i]: 'Certificates must be PDF files.' }));
      return;
    }
    setUploading((u) => ({ ...u, [i]: true }));
    try {
      const { fileKey, fileName } = await api.uploadCertificate(file);
      update(i, { fileKey, fileName, mode: 'pdf' });
    } catch (err) {
      setUploadErrors((e) => ({ ...e, [i]: err.message }));
    } finally {
      setUploading((u) => ({ ...u, [i]: false }));
    }
  };

  return (
    <div className="certs-editor">
      <label className="certs-label">Certifications</label>
      <small className="field-hint">
        Each certification needs proof: paste its credential link (Coursera, Credly, AWS, Google…) or upload the certificate as a PDF.
      </small>

      {rows.map((row, i) => {
        const problem = showErrors ? rowProblem(row) : '';
        return (
          <div className={`cert-row ${problem ? 'has-problem' : ''}`} key={i}>
            <div className="cert-row-top">
              <input
                className="cert-name"
                placeholder="Certification name, e.g. AWS Cloud Practitioner"
                value={row.name}
                onChange={(e) => update(i, { name: e.target.value })}
                aria-label={`Certification ${i + 1} name`}
              />
              <div className="segmented small" role="group" aria-label="Type of proof">
                <button type="button" className={row.mode === 'link' ? 'active' : ''} onClick={() => update(i, { mode: 'link' })}>
                  <Link2 size={13} /> Link
                </button>
                <button type="button" className={row.mode === 'pdf' ? 'active' : ''} onClick={() => update(i, { mode: 'pdf' })}>
                  <FileText size={13} /> PDF
                </button>
              </div>
              <button type="button" className="cert-remove" aria-label="Remove certification" title="Remove" onClick={() => remove(i)}>
                <X size={15} />
              </button>
            </div>

            {row.mode === 'link' ? (
              <input
                className="cert-proof"
                type="url"
                placeholder="https://www.credly.com/badges/…"
                value={row.url}
                onChange={(e) => update(i, { url: e.target.value })}
                aria-label={`Credential link for ${row.name || `certification ${i + 1}`}`}
              />
            ) : (
              <label className="cert-file">
                <FileText size={16} />
                <span className="cert-file-name">
                  {uploading[i] ? 'Uploading…' : row.fileName || 'No PDF uploaded yet'}
                </span>
                <span className="upload-btn small">
                  {uploading[i] ? <Loader2 size={13} className="spin" /> : row.fileKey ? 'Replace PDF' : 'Upload PDF'}
                </span>
                <input
                  className="file-input-hidden"
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={uploading[i]}
                  onChange={(e) => { upload(i, e.target.files?.[0]); e.target.value = ''; }}
                />
              </label>
            )}
            {(problem || uploadErrors[i]) && <small className="field-error">{uploadErrors[i] || problem}</small>}
          </div>
        );
      })}

      {rows.length < max && (
        <button type="button" className="cert-add" onClick={() => onChange([...rows, newCertRow()])}>
          <Plus size={14} /> Add certification
        </button>
      )}
    </div>
  );
}
