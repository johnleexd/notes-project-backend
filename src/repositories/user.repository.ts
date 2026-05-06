import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export class UserRepository {
  /**
   * Find a user by email
   */
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by ID
   */
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user
   */
  static async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update user
   */
  static async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user
   */
  static async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(skip?: number, take?: number) {
    return prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get count of all users (admin only)
   */
  static async getUsersCount() {
    return prisma.user.count();
  }

  /**
   * Update user role (admin only)
   */
  static async updateRole(id: string, role: 'USER' | 'ADMIN') {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Delete user by admin (includes cleanup)
   */
  static async deleteUserByAdmin(id: string) {
    // Delete all tokens first
    await prisma.token.deleteMany({
      where: { userId: id },
    });

    // Delete all notes
    await prisma.note.deleteMany({
      where: { userId: id },
    });

    // Delete user
    return prisma.user.delete({
      where: { id },
    });
  }
}
