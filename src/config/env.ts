import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  APP_NAME: z.string().default('Portfolio API'),
  PORT: z.string().default('8000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  BACKEND_URL: z.string().url().default('http://localhost:8000'),
  JWT_SECRET: z.string().min(1, 'JWT Secret is required'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587').transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().min(1, 'SMTP User is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP Password is required'),
  SMTP_FROM: z.string().min(1, 'SMTP From is required'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid Environment Variables:', _env.error.format());
  process.exit(1);
}

export const ENV = _env.data;
