import { Request, Response } from 'express';
import { UserRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';

// ─── GET ALL USERS ──────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const [users, totalCount] = await Promise.all([
      UserRepository.getAllUsers(skip, take),
      UserRepository.getUsersCount(),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get All Users Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users',
    });
  }
};

// ─── GET USER DETAILS ────────────────────────────────────────────────
export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    const user = await UserRepository.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Get user's notes count and tokens count
    const [notesCount, tokensCount] = await Promise.all([
      prisma.note.count({ where: { userId } }),
      prisma.token.count({ where: { userId } }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'User details retrieved successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          notesCount,
          tokensCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Get User Details Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user details',
    });
  }
};

// ─── UPDATE USER ROLE ───────────────────────────────────────────────
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;

    // Validate role
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be USER or ADMIN',
      });
      return;
    }

    // Check if user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Prevent removing admin status from self
    if (req.user?.userId === userId && role === 'USER') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot remove admin role from yourself',
      });
      return;
    }

    const updatedUser = await UserRepository.updateRole(userId, role);

    res.status(200).json({
      status: 'success',
      message: `User role updated to ${role}`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error('Update User Role Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user role',
    });
  }
};

// ─── DELETE USER ─────────────────────────────────────────────────────
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    // Check if user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Prevent deleting yourself
    if (req.user?.userId === userId) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account as an admin',
      });
      return;
    }

    await UserRepository.deleteUserByAdmin(userId);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: {
        deletedUserId: userId,
      },
    });
  } catch (error: any) {
    console.error('Delete User Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
    });
  }
};

// ─── GET SYSTEM STATISTICS ──────────────────────────────────────────
export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalNotes, adminCount, unverifiedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.note.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { emailVerified: null } }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'System statistics retrieved',
      data: {
        stats: {
          totalUsers,
          totalNotes,
          adminCount,
          unverifiedUsers,
          averageNotesPerUser: totalUsers > 0 ? (totalNotes / totalUsers).toFixed(2) : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Get System Stats Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve system statistics',
    });
  }
};

// ─── GET ALL NOTES (ADMIN VIEW) ──────────────────────────────────────
export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.note.count(),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'All notes retrieved successfully',
      data: {
        notes,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get All Notes Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve notes',
    });
  }
};

// ─── DELETE NOTE (ADMIN) ─────────────────────────────────────────────
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = req.params.noteId as string;

    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      res.status(404).json({
        status: 'error',
        message: 'Note not found',
      });
      return;
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
      data: {
        deletedNoteId: noteId,
      },
    });
  } catch (error: any) {
    console.error('Delete Note Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete note',
    });
  }
};

// ─── GET USER'S NOTES (ADMIN) ────────────────────────────────────────
export const getUserNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    // Check if user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.note.count({ where: { userId } }),
    ]);

    res.status(200).json({
      status: 'success',
      message: `Retrieved notes for user ${user.email}`,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get User Notes Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user notes',
    });
  }
};
