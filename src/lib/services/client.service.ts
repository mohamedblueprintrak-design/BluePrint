/**
 * Client Service
 * خدمة العملاء
 * 
 * Business logic layer for client operations
 */

import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';
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
 * Client Service
 * Handles all business logic related to clients
 */
class ClientService {
  /**
   * Get all clients for an organization
   */
  async getClients(organizationId: string): Promise<Client[]> {
    return prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active clients for dropdowns/selectors
   */
  async getActiveClients(organizationId: string): Promise<Client[]> {
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
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string, organizationId: string): Promise<Client | null> {
    return prisma.client.findFirst({
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
  }

  /**
   * Create a new client
   */
  async createClient(
    data: CreateClientData,
    organizationId: string,
    userId: string
  ): Promise<Client> {
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

    return client;
  }

  /**
   * Update client
   */
  async updateClient(
    id: string,
    data: UpdateClientData,
    organizationId: string,
    userId: string
  ): Promise<Client> {
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

    return client;
  }

  /**
   * Soft delete client (mark as inactive)
   */
  async deleteClient(id: string, organizationId: string, userId: string): Promise<void> {
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
  }

  /**
   * Get client statistics
   */
  async getClientStats(organizationId: string): Promise<ClientStats> {
    const [total, active] = await Promise.all([
      prisma.client.count({ where: { organizationId } }),
      prisma.client.count({ where: { organizationId, isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  /**
   * Search clients by name or contact info
   */
  async searchClients(query: string, organizationId: string): Promise<Client[]> {
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
   */
  async hasActiveProjects(clientId: string): Promise<boolean> {
    const count = await prisma.project.count({
      where: { clientId, status: 'active' },
    });
    return count > 0;
  }
}

// Export singleton instance
export const clientService = new ClientService();
