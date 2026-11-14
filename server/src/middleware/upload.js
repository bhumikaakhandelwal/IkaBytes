import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { CERT_DIR } from '../services/certificates.js';

export const RESUME_DIR = path.resolve('uploads', 'resumes');
fs.mkdirSync(RESUME_DIR, { recursive: true });

const ALLOWED = ['.pdf', '.doc', '.docx', '.txt'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RESUME_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'resume'));
    cb(null, true);
  },
});

// Certificate PDFs (proof for a certification instead of a credential link)
export const certificateUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CERT_DIR),
    filename: (req, file, cb) => cb(null, `${req.user.id}-cert-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.pdf`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'certificate'));
    }
    cb(null, true);
  },
});
