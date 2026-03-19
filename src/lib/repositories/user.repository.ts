# ===========================================
# User Repository
# مستودع المستخدمين
# ===========================================

import { PrismaClient, User } from '@prisma/client';
import { BaseRepository, FindManyOptions } from './base.repository';

export interface UserWithOrganization extends User {
  organization?: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    locale: string;
  } | null;
}

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  role?: string;
  organizationId?: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  language?: string;
  theme?: string;
  avatar?: string;
  isActive?: boolean;
  role?: string;
}

export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.model.findUnique({
      where: { username },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<UserWithOrganization | null> {
    return this.model.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            timezone: true,
            locale: true,
          },
        },
      },
    });
  }

  async findByIdWithOrganization(id: string): Promise<UserWithOrganization | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            timezone: true,
            locale: true,
          },
        },
      },
    });
  }

  async findManyByOrganization(
    organizationId: string,
    options?: FindManyOptions
  ): Promise<User[]> {
    return this.model.findMany({
      where: { organizationId },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.model.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.model.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.model.update({
      where: { id },
      data: { emailVerified: new Date() },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.model.count({
      where: { username },
    });
    return count > 0;
  }
}
