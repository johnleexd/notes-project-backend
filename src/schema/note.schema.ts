import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be at most 255 characters'),
  content: z
    .string({ error: 'Content is required' })
    .min(1, 'Content cannot be empty'),
  category: z
    .string()
    .max(100, 'Category must be at most 100 characters')
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(50, 'Each tag must be at most 50 characters'))
    .max(10, 'You can have at most 10 tags')
    .optional()
    .default([]),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be at most 255 characters')
    .optional(),
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be at most 100 characters')
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(50, 'Each tag must be at most 50 characters'))
    .max(10, 'You can have at most 10 tags')
    .optional(),
  isArchived: z
    .boolean()
    .optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
