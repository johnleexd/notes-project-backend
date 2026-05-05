import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/services/auth.service';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        status: 'error',
        message: 'Access token has expired. Please refresh your token.',
      });
      return;
    }

    res.status(401).json({
      status: 'error',
      message: 'Invalid access token.',
    });
  }
};
