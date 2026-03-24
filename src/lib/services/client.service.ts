/**
 * Client Service
 * خدمة العملاء
 * 
 * Business logic layer for client operations
 * Uses cache for read operations with automatic invalidation
 */

import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';
import { CacheService } from '@/lib/cache';
import { log } from '@/lib/logger';
import type { Client } from '@prisma/client';
import type { CreateClientData, UpdateClientData } from '@/lib/repositories/client.repository';

/**
 * Client statistics interface
 */
export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * Client with project count
 */
export interface ClientWithProjects extends Client {
  projectCount: number;
}

/**
 * Active client for dropdowns/selectors (partial data)
 */
export interface ActiveClientDTO {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

// Cache key generators
const CACHE_KEYS = {
  clients: (orgId: string) => `clients:${orgId}`,
  activeClients: (orgId: string) => `clients:active:${orgId}`,
  clientById: (id: string) => `client:${id}`,
  clientStats: (orgId: string) => `clients:stats:${orgId}`,
};

// Cache TTL in seconds
const CACHE_TTL = {
  short: 60,        // 1 minute - for frequently changing data
  medium: 300,      // 5 minutes - for lists
  long: 900,        // 15 minutes - for stats
};

/**
 * Client Service
 * Handles all business logic related to clients
 */
class ClientService {
  /**
   * Get all clients for an organization (cached)
   */
  async getClients(organizationId: string): Promise<Client[]> {
    const cacheKey = CACHE_KEYS.clients(organizationId);
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        log.service('ClientService', 'getClients', { organizationId });
        return prisma.client.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
        });
      },
      { ttl: CACHE_TTL.medium, prefix: 'bp' }
    );
  }

  /**
   * Get active clients for dropdowns/selectors (cached)
   * Good candidate for caching - frequently accessed, rarely changes
   */
  async getActiveClients(organizationId: string): Promise<ActiveClientDTO[]> {
    const cacheKey = CACHE_KEYS.activeClients(organizationId);
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        log.service('ClientService', 'getActiveClients', { organizationId });
        return prisma.client.findMany({
          where: { organizationId, isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        });
      },
      { ttl: CACHE_TTL.long, prefix: 'bp' }
    );
  }

  /**
   * Get client by ID (cached)
   */
  async getClientById(id: string, organizationId: string): Promise<Client | null> {
    const cacheKey = CACHE_KEYS.clientById(id);
    
    const cached = await CacheService.get<Client>(cacheKey, { prefix: 'bp' });
    if (cached && cached.organizationId === organizationId) {
      return cached;
    }
    
    log.service('ClientService', 'getClientById', { id, organizationId });
    
    const client = await prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        projects: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            contractValue: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });
    
    if (client) {
      await CacheService.set(cacheKey, client, { ttl: CACHE_TTL.medium, prefix: 'bp' });
    }
    
    return client;
  }

  /**
   * Create a new client (invalidates cache)
   */
  async createClient(
    data: CreateClientData,
    organizationId: string,
    userId: string
  ): Promise<Client> {
    log.service('ClientService', 'createClient', { organizationId, name: data.name });
    
    const client = await prisma.client.create({
      data: {
        ...data,
        organizationId,
        creditLimit: data.creditLimit || 0,
        paymentTerms: data.paymentTerms || 30,
      },
    });

    await logAudit({
      userId,
      organizationId,
      entityType: 'client',
      entityId: client.id,
      action: 'create',
      description: `تم إنشاء العميل: ${client.name}`,
      newValue: client,
    });

    // Invalidate relevant caches
    await this.invalidateCache(organizationId);

    return client;
  }

  /**
   * Update client (invalidates cache)
   */
  async updateClient(
    id: string,
    data: UpdateClientData,
    organizationId: string,
    userId: string
  ): Promise<Client> {
    log.service('ClientService', 'updateClient', { id, organizationId });
    
    const oldClient = await prisma.client.findFirst({
      where: { id, organizationId },
    });

    if (!oldClient) {
      throw new Error('Client not found');
    }

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    await logAudit({
      userId,
      organizationId,
      entityType: 'client',
      entityId: client.id,
      action: 'update',
      description: `تم تحديث العميل: ${client.name}`,
      oldValue: oldClient,
      newValue: client,
    });

    // Invalidate relevant caches
    await this.invalidateCache(organizationId, id);

    return client;
  }

  /**
   * Soft delete client (mark as inactive) (invalidates cache)
   */
  async deleteClient(id: string, organizationId: string, userId: string): Promise<void> {
    log.service('ClientService', 'deleteClient', { id, organizationId });
    
    const client = await prisma.client.findFirst({
      where: { id, organizationId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId,
      organizationId,
      entityType: 'client',
      entityId: id,
      action: 'delete',
      description: `تم حذف العميل: ${client.name}`,
      oldValue: client,
    });

    // Invalidate relevant caches
    await this.invalidateCache(organizationId, id);
  }

  /**
   * Get client statistics (cached)
   */
  async getClientStats(organizationId: string): Promise<ClientStats> {
    const cacheKey = CACHE_KEYS.clientStats(organizationId);
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        log.service('ClientService', 'getClientStats', { organizationId });
        const [total, active] = await Promise.all([
          prisma.client.count({ where: { organizationId } }),
          prisma.client.count({ where: { organizationId, isActive: true } }),
        ]);

        return {
          total,
          active,
          inactive: total - active,
        };
      },
      { ttl: CACHE_TTL.long, prefix: 'bp' }
    );
  }

  /**
   * Search clients by name or contact info
   * Not cached - search queries vary a lot
   */
  async searchClients(query: string, organizationId: string): Promise<Client[]> {
    log.service('ClientService', 'searchClients', { query, organizationId });
    
    return prisma.client.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { contactPerson: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  /**
   * Check if client has active projects
   * Not cached - needs real-time data
   */
  async hasActiveProjects(clientId: string): Promise<boolean> {
    const count = await prisma.project.count({
      where: { clientId, status: 'active' },
    });
    return count > 0;
  }

  /**
   * Invalidate cache for client-related data
   */
  private async invalidateCache(organizationId: string, clientId?: string): Promise<void> {
    const keysToDelete = [
      CACHE_KEYS.clients(organizationId),
      CACHE_KEYS.activeClients(organizationId),
      CACHE_KEYS.clientStats(organizationId),
    ];
    
    if (clientId) {
      keysToDelete.push(CACHE_KEYS.clientById(clientId));
    }
    
    await Promise.all(
      keysToDelete.map(key => CacheService.delete(key, { prefix: 'bp' }))
    );
    
    log.debug('Cache invalidated', { organizationId, clientId });
  }
}

// Export singleton instance
export const clientService = new ClientService();
