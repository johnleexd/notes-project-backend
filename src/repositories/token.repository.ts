import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TokenRepository {
  /**
   * Create a new token
   */
  static async create(data: Prisma.TokenCreateInput) {
    return prisma.token.create({
      data,
    });
  }

  /**
   * Find a token by token value and type
   */
  static async findByTokenAndType(token: string, type: string) {
    return prisma.token.findFirst({
      where: {
        token,
        type: type as any,
      },
    });
  }

  /**
   * Find a token by user ID and type
   */
  static async findByUserIdAndType(userId: string, type: string) {
    return prisma.token.findFirst({
      where: {
        userId,
        type: type as any,
      },
    });
  }

  /**
   * Update a token
   */
  static async update(id: string, data: Prisma.TokenUpdateInput) {
    return prisma.token.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a token
   */
  static async delete(id: string) {
    return prisma.token.delete({
      where: { id },
    });
  }

  /**
   * Delete all tokens of a specific user and type
   */
  static async deleteByUserIdAndType(userId: string, type: string) {
    return prisma.token.deleteMany({
      where: {
        userId,
        type: type as any,
      },
    });
  }
}
