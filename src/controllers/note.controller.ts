import { Request, Response } from 'express';
import { NoteRepository } from '@/repositories';
import { createNoteSchema, updateNoteSchema } from '@/schema/note.schema';

// ─── CREATE NOTE ─────────────────────────────────────────────────────
export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = createNoteSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { title, content, category, tags } = validation.data;
    const userId = req.user!.userId;

    const note = await NoteRepository.create({
      title,
      content,
      category: category ?? null,
      tags: tags ?? [],
      user: { connect: { id: userId } },
    });

    res.status(201).json({
      status: 'success',
      message: 'Note created successfully',
      data: { note },
    });
  } catch (error: any) {
    console.error('Create Note Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create note',
    });
  }
};

// ─── GET ALL NOTES (for authenticated user) ──────────────────────────
export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Optional query filters
    const { category, search, archived } = req.query;

    const notes = await NoteRepository.findAllByUserId(userId, {
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
      archived: archived === 'true' ? true : archived === 'false' ? false : undefined,
    });

    res.status(200).json({
      status: 'success',
      message: 'Notes retrieved successfully',
      data: {
        count: notes.length,
        notes,
      },
    });
  } catch (error: any) {
    console.error('Get Notes Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve notes',
    });
  }
};

// ─── GET SINGLE NOTE ─────────────────────────────────────────────────
export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const note = await NoteRepository.findByIdAndUserId(id, userId);

    if (!note) {
      res.status(404).json({
        status: 'error',
        message: 'Note not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Note retrieved successfully',
      data: { note },
    });
  } catch (error: any) {
    console.error('Get Note Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve note',
    });
  }
};

// ─── UPDATE NOTE ─────────────────────────────────────────────────────
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = updateNoteSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const userId = req.user!.userId;
    const id = String(req.params.id);

    // Check ownership
    const existingNote = await NoteRepository.findByIdAndUserId(id, userId);

    if (!existingNote) {
      res.status(404).json({
        status: 'error',
        message: 'Note not found',
      });
      return;
    }

    const updatedNote = await NoteRepository.update(id, validation.data);

    res.status(200).json({
      status: 'success',
      message: 'Note updated successfully',
      data: { note: updatedNote },
    });
  } catch (error: any) {
    console.error('Update Note Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update note',
    });
  }
};

// ─── DELETE NOTE ─────────────────────────────────────────────────────
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);

    // Check ownership
    const existingNote = await NoteRepository.findByIdAndUserId(id, userId);

    if (!existingNote) {
      res.status(404).json({
        status: 'error',
        message: 'Note not found',
      });
      return;
    }

    await NoteRepository.delete(id);

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Note Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete note',
    });
  }
};
