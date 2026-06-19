import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(params: {
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    payload?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        payload: params.payload,
        ipAddress: params.ipAddress,
      },
    });
  }

  async getLogs(filters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // От новых к старым
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    const total = await this.prisma.auditLog.count({ where });

    return {
      data: logs,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  async getDocumentHistory(documentId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'Document',
        entityId: documentId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}