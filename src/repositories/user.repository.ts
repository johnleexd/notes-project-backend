import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
}
