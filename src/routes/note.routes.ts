import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '@/controllers/note.controller';

const router = Router();

// All note routes require authentication
router.use(authenticate);

// POST   /api/notes       → Create a new note
router.post('/', createNote);

// GET    /api/notes        → Get all notes for authenticated user
router.get('/', getAllNotes);

// GET    /api/notes/:id    → Get a single note by ID
router.get('/:id', getNoteById);

// PUT    /api/notes/:id    → Update a note by ID
router.put('/:id', updateNote);

// DELETE /api/notes/:id    → Delete a note by ID
router.delete('/:id', deleteNote);

export default router;
