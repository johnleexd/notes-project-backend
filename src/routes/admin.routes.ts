import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireAdmin } from '@/middlewares/admin.middleware';
import {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  deleteUser,
  getSystemStats,
  getAllNotes,
  deleteNote,
  getUserNotes,
} from '@/controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ─── USER MANAGEMENT ────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// ─── SYSTEM STATISTICS ──────────────────────────────────────────────
router.get('/stats', getSystemStats);

// ─── NOTES MANAGEMENT ───────────────────────────────────────────────
router.get('/notes', getAllNotes);
router.delete('/notes/:noteId', deleteNote);
router.get('/users/:userId/notes', getUserNotes);

export default router;
