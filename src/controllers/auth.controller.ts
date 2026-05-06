import { Request, Response } from 'express';
import { UserRepository } from '@/repositories';
import { signupSchema, loginSchema } from '@/schema/auth.schema';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerifyToken,
  consumeEmailVerifyToken,
  consumeRefreshToken,
} from '@/services/auth.service';
import { sendVerificationEmail } from '@/services/email.service';
import { ENV } from '@/config/env';

// ─── SIGNUP ──────────────────────────────────────────────────────────
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate request body
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password } = validation.data;

    // 2. Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists',
      });
      return;
    }

    // 3. Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    // 4. Generate email verification token and send email
    const verifyToken = await generateEmailVerifyToken(user.id);
    await sendVerificationEmail(email, name, verifyToken);

    // 5. Respond
    res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    console.error('Signup Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during signup',
    });
  }
};

// ─── VERIFY EMAIL ────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Verification token is required',
      });
      return;
    }

    const userId = await consumeEmailVerifyToken(token);

    const user = await UserRepository.findById(userId);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You can now log in.',
      data: {
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          emailVerified: user?.emailVerified,
        },
      },
    });
  } catch (error: any) {
    console.error('Verify Email Error:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Email verification failed',
    });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;

    // 2. Find user
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // 3. Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // 4. Check if email is verified
    if (!user.emailVerified) {
      res.status(403).json({
        status: 'error',
        message: 'Please verify your email before logging in',
      });
      return;
    }

    // 5. Generate tokens
    const accessToken = generateAccessToken(user.id, user.email!, user.role);
    const refreshToken = await generateRefreshToken(user.id);

    // 6. Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Respond with access token
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during login',
    });
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({
        status: 'error',
        message: 'Refresh token not found. Please log in again.',
      });
      return;
    }

    // Consume old refresh token and get userId
    const userId = await consumeRefreshToken(refreshToken);

    // Fetch user to get email for new access token
    const user = await UserRepository.findById(userId);
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Generate new pair of tokens (rotation)
    const newAccessToken = generateAccessToken(user.id, user.email!, user.role);
    const newRefreshToken = await generateRefreshToken(user.id);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error: any) {
    console.error('Refresh Token Error:', error.message);
    res.status(401).json({
      status: 'error',
      message: error.message || 'Failed to refresh token',
    });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during logout',
    });
  }
};
