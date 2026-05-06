import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ENV } from '@/config/env';
import { prisma } from '@/lib/prisma';
import { TokenType } from '@/generated/prisma/client';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const EMAIL_TOKEN_EXPIRY_HOURS = 24;

// ─── Password Hashing ───────────────────────────────────────────────
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// ─── JWT Tokens ──────────────────────────────────────────────────────
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, ENV.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.token.create({
    data: {
      type: TokenType.REFRESH,
      token,
      expiresAt,
      userId,
    },
  });

  return token;
};

export const verifyAccessToken = (token: string): { userId: string; email: string; role: string } => {
  return jwt.verify(token, ENV.JWT_SECRET) as { userId: string; email: string; role: string };
};

// ─── Email Verification Token ────────────────────────────────────────
export const generateEmailVerifyToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EMAIL_TOKEN_EXPIRY_HOURS);

  await prisma.token.create({
    data: {
      type: TokenType.EMAIL_VERIFY,
      token,
      expiresAt,
      userId,
    },
  });

  return token;
};

export const consumeEmailVerifyToken = async (token: string) => {
  const tokenRecord = await prisma.token.findUnique({ where: { token } });

  if (!tokenRecord) throw new Error('Invalid verification token');
  if (tokenRecord.type !== TokenType.EMAIL_VERIFY) throw new Error('Invalid token type');
  if (tokenRecord.consumedAt) throw new Error('Token has already been used');
  if (tokenRecord.revokedAt) throw new Error('Token has been revoked');
  if (new Date() > tokenRecord.expiresAt) throw new Error('Token has expired');

  // Mark token as consumed
  await prisma.token.update({
    where: { id: tokenRecord.id },
    data: { consumedAt: new Date() },
  });

  // Mark user email as verified
  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { emailVerified: new Date() },
  });

  return tokenRecord.userId;
};

// ─── Refresh Token Validation ────────────────────────────────────────
export const consumeRefreshToken = async (token: string) => {
  const tokenRecord = await prisma.token.findUnique({ where: { token } });

  if (!tokenRecord) throw new Error('Invalid refresh token');
  if (tokenRecord.type !== TokenType.REFRESH) throw new Error('Invalid token type');
  if (tokenRecord.consumedAt) throw new Error('Token has already been used');
  if (tokenRecord.revokedAt) throw new Error('Token has been revoked');
  if (new Date() > tokenRecord.expiresAt) throw new Error('Refresh token has expired');

  // Rotate: consume old token
  await prisma.token.update({
    where: { id: tokenRecord.id },
    data: { consumedAt: new Date() },
  });

  return tokenRecord.userId;
};
