import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../module/database/prisma.service';

@Injectable()
export class ResourceProtectionGuard implements CanActivate {
  private readonly logger = new Logger(ResourceProtectionGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let auth guard handle this
    }

    const resourceType = this.reflector.get<string>('resourceType', context.getHandler());
    const resourceIdParam = this.reflector.get<string>('resourceParam', context.getHandler()) || 'id';

    if (!resourceType) {
      return true; // No resource protection needed
    }

    const resourceId = request.params[resourceIdParam];
    if (!resourceId) {
      return true; // No specific resource to protect
    }

    // Check resource ownership
    const hasAccess = await this.checkResourceOwnership(
      user.sub,
      resourceType,
      resourceId,
    );

    if (!hasAccess) {
      this.logger.warn(`User ${user.sub} attempted to access ${resourceType} ${resourceId} without permission`);
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }

  private async checkResourceOwnership(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'purchase':
          const purchase = await this.prisma.purchase.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          return purchase?.userId === userId;

        case 'character-profile':
          const profile = await this.prisma.characterProfile.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          return profile?.userId === userId;

        case 'inventory':
          // For inventory, we check if the user owns the inventory item
          const inventoryItem = await this.prisma.userInventory.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          return inventoryItem?.userId === userId;

        default:
          this.logger.warn(`Unknown resource type: ${resourceType}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking resource ownership: ${error.message}`);
      return false;
    }
  }
}