import multer from 'multer';

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const isCertificate = err.field === 'certificate';
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `${isCertificate ? 'Certificate' : 'Resume'} must be 5 MB or smaller.`
      : isCertificate ? 'Certificates must be uploaded as PDF files.' : 'Upload a PDF, DOC, DOCX or TXT file.';
    return res.status(400).json({ error: message });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(' ');
    return res.status(400).json({ error: message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}.` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That record already exists.' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side.' : err.message });
}
