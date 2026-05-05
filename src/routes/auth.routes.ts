import { Router } from 'express';
import {
  signup,
  verifyEmail,
  login,
  refreshAccessToken,
  logout,
} from '@/controllers/auth.controller';

const router = Router();

// POST /api/auth/signup
router.post('/signup', signup);

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', verifyEmail);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh
router.post('/refresh', refreshAccessToken);

// POST /api/auth/logout
router.post('/logout', logout);

export default router;
