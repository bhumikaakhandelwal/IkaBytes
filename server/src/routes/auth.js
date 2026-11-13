import { Router } from 'express';
import User, { ROLES } from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

const router = Router();

const ROLE_LABEL = { student: 'Student', tpo: 'Placement officer' };

function validateCredentials({ email, password, role }) {
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid college email.');
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  if (role && !ROLES.includes(role)) throw new HttpError(400, 'Choose Student or Placement officer.');
}

// POST /api/auth/register  { email, password, role: 'student'|'tpo', name? }
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, role, name = '' } = req.body;
  validateCredentials({ email, password, role });
  if (!role) throw new HttpError(400, 'Choose Student or Placement officer.');

  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');

  const fallbackName = name.trim() || email.split('@')[0];
  const user = await User.create({
    email,
    role,
    name: fallbackName,
    passwordHash: await User.hashPassword(password),
  });
  if (role === 'student') {
    await StudentProfile.create({ user: user._id, name: user.name, email: user.email });
  }
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
}));

// POST /api/auth/login  { email, password, role? }
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  validateCredentials({ email, password, role });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (role && role !== user.role) {
    throw new HttpError(403, `This account is registered as a ${ROLE_LABEL[user.role]}. Switch the role above.`);
  }
  res.json({ token: signToken(user), user: user.toPublic() });
}));

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Account no longer exists.');
  res.json({ user: user.toPublic() });
}));

export default router;
