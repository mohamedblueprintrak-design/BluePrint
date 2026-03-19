# ===========================================
# Base Repository Interface
# واجهة المستودع الأساسية
# ===========================================

import { PrismaClient } from '@prisma/client';

export interface FindManyOptions {
  skip?: number;
  take?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean | object>;
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: Record<string, unknown>): Promise<number>;
}

export abstract class BaseRepository<T> implements Repository<T> {
  protected prisma: PrismaClient;
  protected model: any;

  constructor(prisma: PrismaClient, model: any) {
    this.prisma = prisma;
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async findMany(options?: FindManyOptions): Promise<T[]> {
    return this.model.findMany({
      skip: options?.skip,
      take: options?.take,
      where: options?.where as any,
      orderBy: options?.orderBy,
      include: options?.include,
    });
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create({
      data: data as any,
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({
      where: { id },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.model.count({
      where: where as any,
    });
  }

  async transaction<R>(fn: (tx: any) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn);
  }
}
