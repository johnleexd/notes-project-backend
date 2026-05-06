import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export class NoteRepository {
  /**
   * Create a new note
   */
  static async create(data: Prisma.NoteCreateInput) {
    return prisma.note.create({
      data,
    });
  }

  /**
   * Find note by ID and userId (ensure ownership)
   */
  static async findByIdAndUserId(id: string, userId: string) {
    return prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Find note by ID only (admin use or internal)
   */
  static async findById(id: string) {
    return prisma.note.findUnique({
      where: { id },
    });
  }

  /**
   * Get all notes for a specific user with optional filters
   */
  static async findAllByUserId(
    userId: string,
    filters?: {
      category?: string;
      search?: string;
      archived?: boolean;
    }
  ) {
    const where: Prisma.NoteWhereInput = { userId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.archived !== undefined) {
      where.isArchived = filters.archived;
    }

    return prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a note
   */
  static async update(id: string, data: Prisma.NoteUpdateInput) {
    return prisma.note.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a note
   */
  static async delete(id: string) {
    return prisma.note.delete({
      where: { id },
    });
  }
}
