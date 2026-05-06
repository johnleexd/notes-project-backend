import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the authenticated user has ADMIN role
 * Must be used AFTER authenticate middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized. Please authenticate first.',
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        status: 'error',
        message: 'Forbidden. Admin access required.',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking admin privileges',
    });
  }
};
