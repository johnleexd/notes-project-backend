import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ error: 'Email is required' })
    .email('Please provide a valid email address'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Please provide a valid email address'),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
