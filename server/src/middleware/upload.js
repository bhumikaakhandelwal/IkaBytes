import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

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
