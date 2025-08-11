import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  InventoryFilterDto, 
  PaginatedInventoryDto, 
  InventoryItemResponseDto, 
  InventorySummaryDto,
  UseItemResponseDto,
  InventoryCategoryDto 
} from './inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async getInventory(userId: string, filterDto: InventoryFilterDto): Promise<PaginatedInventoryDto> {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      type, 
      gameId, 
      search, 
      showConsumed = false 
    } = filterDto;
    
    const skip = (page - 1) * limit;

    // Build dynamic where clause
    const where: any = {
      userId,
      isConsumed: showConsumed ? undefined : false, // Exclude consumed items by default
    };

    // Join with store item for filtering
    const storeItemWhere: any = {
      isActive: true,
    };

    if (category) {
      storeItemWhere.category = category;
    }

    if (type) {
      storeItemWhere.type = type;
    }

    if (gameId) {
      storeItemWhere.OR = [
        { gameId: gameId },
        { gameId: null }, // Platform-wide items
      ];
    }

    if (search) {
      storeItemWhere.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    try {
      const [inventoryItems, total] = await Promise.all([
        this.prisma.userInventory.findMany({
          where: {
            ...where,
            storeItem: storeItemWhere,
          },
          include: {
            storeItem: {
              include: {
                game: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { acquiredAt: 'desc' },
            { storeItem: { name: 'asc' } },
          ],
          skip,
          take: limit,
        }),
        this.prisma.userInventory.count({
          where: {
            ...where,
            storeItem: storeItemWhere,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Retrieved ${inventoryItems.length} inventory items for user ${userId}`);

      return {
        items: inventoryItems.map(item => this.toInventoryResponseDto(item)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error retrieving inventory:', error);
      throw new BadRequestException('Failed to retrieve inventory');
    }
  }

  async getInventorySummary(userId: string): Promise<InventorySummaryDto> {
    try {
      const [inventoryStats, categoryStats, totalValue] = await Promise.all([
        // Basic inventory statistics
        this.prisma.userInventory.aggregate({
          where: { userId, isConsumed: false },
          _count: { id: true },
          _sum: { quantity: true },
        }),
        
        // Category breakdown
        this.prisma.userInventory.groupBy({
          by: ['itemId'],
          where: { userId, isConsumed: false },
          _count: { id: true },
        }),
        
        // Total value calculation
        this.prisma.userInventory.findMany({
          where: { userId, isConsumed: false },
          include: {
            storeItem: {
              select: { price: true },
            },
          },
        }),
      ]);

      // Calculate total value
      const totalGemValue = totalValue.reduce((sum, item) => {
        return sum + (item.storeItem.price * item.quantity);
      }, 0);

      // Get category distribution
      const categoryDistribution = await this.getCategoryDistribution(userId);

      // Get most recent acquisition
      const recentItem = await this.prisma.userInventory.findFirst({
        where: { userId },
        orderBy: { acquiredAt: 'desc' },
        include: {
          storeItem: {
            select: { name: true },
          },
        },
      });

      return {
        totalItems: inventoryStats._count.id || 0,
        totalQuantity: inventoryStats._sum.quantity || 0,
        totalValue: totalGemValue,
        categoryDistribution,
        lastAcquiredItem: recentItem?.storeItem.name,
        lastAcquiredDate: recentItem?.acquiredAt,
      };
    } catch (error) {
      this.logger.error('Error getting inventory summary:', error);
      throw new BadRequestException('Failed to get inventory summary');
    }
  }

  async getInventoryCategories(userId: string): Promise<InventoryCategoryDto[]> {
    const categoryData = await this.prisma.userInventory.groupBy({
      by: ['itemId'],
      where: { userId, isConsumed: false },
      _count: { id: true },
      _sum: { quantity: true },
    });

    // Get detailed category information
    const categories = await this.prisma.storeItem.groupBy({
      by: ['category'],
      where: {
        id: {
          in: categoryData.map(item => item.itemId),
        },
      },
      _count: { category: true },
    });

    return categories.map(category => ({
      category: category.category as any,
      itemCount: category._count.category,
      description: this.getCategoryDescription(category.category),
    }));
  }

  async getGameInventory(
    userId: string, 
    gameId: string, 
    filterDto: InventoryFilterDto
  ): Promise<PaginatedInventoryDto> {
    // Verify game exists
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, isActive: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found or inactive');
    }

    return this.getInventory(userId, {
      ...filterDto,
      gameId,
    });
  }

  async getInventoryItem(userId: string, itemId: string): Promise<InventoryItemResponseDto> {
    const inventoryItem = await this.prisma.userInventory.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId,
        },
      },
      include: {
        storeItem: {
          include: {
            game: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Item not found in inventory');
    }

    // Get usage history if it's a consumable
    let usageHistory: any[] = [];
    if (inventoryItem.storeItem.type === 'CONSUMABLE') {
      usageHistory = await this.getItemUsageHistory(userId, itemId);
    }

    return {
      ...this.toInventoryResponseDto(inventoryItem),
      usageHistory,
    };
  }

  async useItem(userId: string, itemId: string): Promise<UseItemResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      // Get inventory item
      const inventoryItem = await tx.userInventory.findUnique({
        where: {
          userId_itemId: { userId, itemId },
        },
        include: {
          storeItem: true,
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException('Item not found in inventory');
      }

      if (inventoryItem.storeItem.type !== 'CONSUMABLE') {
        throw new BadRequestException('Only consumable items can be used');
      }

      if (inventoryItem.quantity <= 0 || inventoryItem.isConsumed) {
        throw new BadRequestException('No usable quantity available');
      }

      // Decrease quantity
      const updatedItem = await tx.userInventory.update({
        where: {
          userId_itemId: { userId, itemId },
        },
        data: {
          quantity: { decrement: 1 },
          usedAt: new Date(),
          isConsumed: inventoryItem.quantity === 1, // Mark as consumed if last item
        },
      });

      this.logger.log(`User ${userId} used item ${itemId}, remaining quantity: ${updatedItem.quantity}`);

      return {
        message: `Used ${inventoryItem.storeItem.name} successfully`,
        remainingQuantity: updatedItem.quantity,
        isFullyConsumed: updatedItem.isConsumed,
        usedAt: updatedItem.usedAt || undefined,
      };
    });
  }

  private async getCategoryDistribution(userId: string) {
    const categoryData = await this.prisma.userInventory.findMany({
      where: { userId, isConsumed: false },
      include: {
        storeItem: {
          select: { category: true },
        },
      },
    });

    const distribution = categoryData.reduce((acc, item) => {
      const category = item.storeItem.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return distribution;
  }

  private async getItemUsageHistory(userId: string, itemId: string) {
    // This would typically come from a usage log table
    // For now, we'll return basic usage information
    const item = await this.prisma.userInventory.findUnique({
      where: {
        userId_itemId: { userId, itemId },
      },
    });

    if (!item || !item.usedAt) {
      return [];
    }

    return [
      {
        usedAt: item.usedAt,
        quantityUsed: 1,
        remainingAfterUse: item.quantity,
      },
    ];
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      SKIN: 'Cosmetic items that change appearance',
      DIGITAL_REWARD: 'Digital vouchers and online rewards',
      PHYSICAL_MERCH: 'Physical merchandise and collectibles',
      UTILITY: 'Functional items and services',
      CONSUMABLE: 'One-time use items and temporary boosts',
    };
    return descriptions[category] || 'Items';
  }

  private toInventoryResponseDto(inventoryItem: any): InventoryItemResponseDto {
    return {
      id: inventoryItem.id,
      itemId: inventoryItem.itemId,
      quantity: inventoryItem.quantity,
      acquiredAt: inventoryItem.acquiredAt,
      usedAt: inventoryItem.usedAt,
      isConsumed: inventoryItem.isConsumed,
      storeItem: {
        id: inventoryItem.storeItem.id,
        name: inventoryItem.storeItem.name,
        description: inventoryItem.storeItem.description,
        category: inventoryItem.storeItem.category,
        type: inventoryItem.storeItem.type,
        deliveryType: inventoryItem.storeItem.deliveryType,
        rarity: inventoryItem.storeItem.rarity,
        price: inventoryItem.storeItem.price,
        imageUrl: inventoryItem.storeItem.imageUrl,
        game: inventoryItem.storeItem.game,
      },
    };
  }
}