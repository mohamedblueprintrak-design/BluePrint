# ===========================================
# Repositories Index
# تصدير المستودعات
# ===========================================

export { BaseRepository, type Repository, type FindManyOptions } from './base.repository';
export { UserRepository, type UserWithOrganization, type CreateUserData, type UpdateUserData } from './user.repository';
export { ProjectRepository, type ProjectWithDetails, type CreateProjectData, type UpdateProjectData } from './project.repository';

import { prisma } from '@/lib/db';
import { UserRepository } from './user.repository';
import { ProjectRepository } from './project.repository';

// Singleton instances
let userRepo: UserRepository | null = null;
let projectRepo: ProjectRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepo) {
    userRepo = new UserRepository(prisma);
  }
  return userRepo;
}

export function getProjectRepository(): ProjectRepository {
  if (!projectRepo) {
    projectRepo = new ProjectRepository(prisma);
  }
  return projectRepo;
}
