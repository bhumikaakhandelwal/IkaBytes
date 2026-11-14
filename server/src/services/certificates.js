// Certificate proofs: every certification needs a credential link OR an uploaded PDF.
import fs from 'node:fs';
import path from 'node:path';
import { safeUrl } from './skills.js';
import { HttpError } from '../utils/asyncHandler.js';

export const CERT_DIR = path.resolve('uploads', 'certificates');
fs.mkdirSync(CERT_DIR, { recursive: true });

// Uploaded files are named "<userId>-cert-<timestamp>-<random>.pdf"; the name is the "fileKey"
const KEY_PATTERN = /^[a-f0-9]{24}-cert-\d+-[a-z0-9]+\.pdf$/;

export const certFilePath = (fileKey) => path.join(CERT_DIR, fileKey);

export function isOwnFileKey(fileKey, userId) {
  return typeof fileKey === 'string' && KEY_PATTERN.test(fileKey) && fileKey.startsWith(`${userId}-cert-`);
}

export function certFileExists(fileKey) {
  return typeof fileKey === 'string' && KEY_PATTERN.test(fileKey) && fs.existsSync(certFilePath(fileKey));
}

/** Proofs for a profile, including links saved by the older "certificationLinks" field. */
export function proofsFor(profile) {
  const proofs = new Map();
  for (const l of profile.certificationLinks || []) {
    if (l?.name) proofs.set(l.name.toLowerCase(), { name: l.name, url: l.url || '', fileKey: '', fileName: '' });
  }
  for (const p of profile.certificationProofs || []) {
    if (p?.name) {
      proofs.set(p.name.toLowerCase(), {
        name: p.name, url: p.url || '', fileKey: p.fileKey || '', fileName: p.fileName || '', uploadedAt: p.uploadedAt,
      });
    }
  }
  // One entry per certification name, in the student's order
  return (profile.certifications || []).map((name) => ({ url: '', fileKey: '', fileName: '', ...proofs.get(name.toLowerCase()), name }));
}

/**
 * Validates what the student submitted and returns clean proofs.
 * Each certification must have a valid http(s) link or one of the student's own uploaded PDFs.
 */
export function cleanProofs(input, userId, previous = []) {
  if (!Array.isArray(input)) throw new HttpError(400, 'Certifications must be a list.');
  const prevByKey = new Map(previous.filter((p) => p.fileKey).map((p) => [p.fileKey, p]));
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const name = String(raw?.name ?? '').trim().slice(0, 200);
    const urlInput = String(raw?.url ?? '').trim();
    const fileKey = String(raw?.fileKey ?? '').trim();
    if (!name && !urlInput && !fileKey) continue; // empty row
    if (!name) throw new HttpError(400, 'Every certification needs a name.');
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    if (fileKey) {
      if (!isOwnFileKey(fileKey, userId) || !certFileExists(fileKey)) {
        throw new HttpError(400, `The PDF for "${name}" was not found. Please upload it again.`);
      }
      const prev = prevByKey.get(fileKey);
      out.push({
        name,
        url: '',
        fileKey,
        fileName: String(raw?.fileName || prev?.fileName || 'certificate.pdf').slice(0, 200),
        uploadedAt: prev?.uploadedAt || new Date(),
      });
    } else if (urlInput) {
      const url = safeUrl(urlInput);
      if (!url) throw new HttpError(400, `The credential link for "${name}" is not a valid web address.`);
      out.push({ name, url, fileKey: '', fileName: '' });
    } else {
      throw new HttpError(400, `Add a credential link or upload a PDF for "${name}".`);
    }
    if (out.length > 20) throw new HttpError(400, 'You can add up to 20 certifications.');
  }
  return out;
}

/** Deletes this student's uploaded certificate PDFs that are no longer used. */
export function removeUnusedCertFiles(userId, proofs) {
  const keep = new Set(proofs.map((p) => p.fileKey).filter(Boolean));
  for (const file of fs.readdirSync(CERT_DIR)) {
    if (file.startsWith(`${userId}-cert-`) && !keep.has(file)) {
      fs.promises.unlink(certFilePath(file)).catch(() => {});
    }
  }
}
