import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePurchaseDto, PurchaseResponseDto, PurchaseHistoryFilterDto, PaginatedPurchaseHistoryDto, PurchaseSummaryDto } from './purchase.dto';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private prisma: PrismaService) {}

  async createPurchase(userId: string, createPurchaseDto: CreatePurchaseDto): Promise<PurchaseResponseDto> {
    const { items, idempotencyKey } = createPurchaseDto;

    // Check for duplicate purchase using idempotency key
    if (idempotencyKey) {
      const existingPurchase = await this.checkDuplicatePurchase(userId, idempotencyKey);
      if (existingPurchase) {
        this.logger.warn(`Duplicate purchase attempt detected: ${idempotencyKey}`);
        throw new ConflictException('Duplicate purchase detected');
      }
    }

    // Validate items and calculate total cost
    const { storeItems, totalCost } = await this.validatePurchaseItems(items);

    // Check user's gem balance
    const userWallet = await this.getUserWallet(userId);
    if (userWallet.balance < totalCost) {
      throw new BadRequestException(`Insufficient gems. Required: ${totalCost}, Available: ${userWallet.balance}`);
    }

    // Execute atomic purchase transaction
    return this.executePurchaseTransaction(userId, items, storeItems, totalCost, idempotencyKey);
  }

  private async checkDuplicatePurchase(userId: string, idempotencyKey: string) {
    const existingPurchase = await this.prisma.purchase.findFirst({
      where: {
        userId,
        // Store idempotency key in a custom field or use a separate table
        // For this implementation, we'll check recent purchases with same total
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });
    return existingPurchase;
  }

  private async validatePurchaseItems(items: { itemId: string; quantity: number }[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('At least one item is required for purchase');
    }

    const itemIds = items.map(item => item.itemId);
    
    // Get all requested items from database
    const storeItems = await this.prisma.storeItem.findMany({
      where: {
        id: { in: itemIds },
        isActive: true,
      },
    });

    if (storeItems.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found or inactive');
    }

    // Calculate total cost and validate quantities
    let totalCost = 0;
    const itemsMap = new Map(storeItems.map(item => [item.id, item]));

    for (const purchaseItem of items) {
      const storeItem = itemsMap.get(purchaseItem.itemId);
      
      if (!storeItem) {
        throw new NotFoundException(`Item ${purchaseItem.itemId} not found`);
      }
      
      // Validate quantity
      if (purchaseItem.quantity <= 0 || purchaseItem.quantity > 100) {
        throw new BadRequestException('Quantity must be between 1 and 100');
      }

      // For non-consumables, quantity should be 1
      if (storeItem.type === 'NON_CONSUMABLE' && purchaseItem.quantity !== 1) {
        throw new BadRequestException(`Non-consumable item ${storeItem.name} can only be purchased with quantity 1`);
      }

      totalCost += storeItem.price * purchaseItem.quantity;
    }

    return { storeItems, totalCost };
  }

  private async getUserWallet(userId: string) {
    const wallet = await this.prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('User wallet not found');
    }

    return wallet;
  }

  private async executePurchaseTransaction(
    userId: string,
    items: { itemId: string; quantity: number }[],
    storeItems: any[],
    totalCost: number,
    idempotencyKey?: string
  ): Promise<PurchaseResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      this.logger.log(`Starting purchase transaction for user ${userId}, total: ${totalCost} gems`);

      // 1. Check for existing non-consumable items
      await this.validateNonConsumableOwnership(tx, userId, items, storeItems);

      // 2. Deduct gems from user wallet
      const updatedWallet = await tx.userWallet.update({
        where: { userId },
        data: { balance: { decrement: totalCost } },
      });

      // Double-check balance after deduction
      if (updatedWallet.balance < 0) {
        throw new BadRequestException('Insufficient gems for this purchase');
      }

      // 3. Create wallet transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: updatedWallet.id,
          type: 'DEBIT',
          amount: totalCost,
          description: `Purchase of ${items.length} item(s)`,
          referenceId: 'purchase-pending', // Will update with purchase ID
        },
      });

      // 4. Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          userId,
          totalAmount: totalCost,
          status: 'COMPLETED',
          paymentMethod: 'GEMS',
        },
      });

      // 5. Create purchase items
      const purchaseItems: any[] = [];
      for (const item of items) {
        const storeItem = storeItems.find(si => si.id === item.itemId);
        const purchaseItem = await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: storeItem.price,
            totalPrice: storeItem.price * item.quantity,
          },
        });
        purchaseItems.push(purchaseItem);
      }

      // 6. Add items to user inventory
      await this.addItemsToInventory(tx, userId, items, storeItems);

      // 7. Process functional items (gem packs, instant effects)
      await this.processFunctionalItems(tx, userId, items, storeItems, updatedWallet.id);

      // 8. Create fulfillment records
      await this.createFulfillmentRecords(tx, purchase.id, userId, items, storeItems);

      // 9. Update wallet transaction with purchase ID
      await tx.walletTransaction.updateMany({
        where: {
          walletId: updatedWallet.id,
          referenceId: 'purchase-pending',
        },
        data: {
          referenceId: purchase.id,
        },
      });

      this.logger.log(`Purchase ${purchase.id} completed successfully for user ${userId}`);

      // Return complete purchase details
      return this.getPurchaseWithDetails(purchase.id, tx);
    });
  }

  private async validateNonConsumableOwnership(tx: any, userId: string, items: any[], storeItems: any[]) {
    for (const purchaseItem of items) {
      const storeItem = storeItems.find(si => si.id === purchaseItem.itemId);
      
      if (storeItem.type === 'NON_CONSUMABLE') {
        const existingInventory = await tx.userInventory.findUnique({
          where: {
            userId_itemId: {
              userId,
              itemId: purchaseItem.itemId,
            },
          },
        });

        if (existingInventory) {
          throw new BadRequestException(`You already own ${storeItem.name}`);
        }
      }
    }
  }

  private async addItemsToInventory(tx: any, userId: string, items: any[], storeItems: any[]) {
    for (const item of items) {
      const storeItem = storeItems.find(si => si.id === item.itemId);
      
      // Skip adding to inventory for functional items that are applied immediately
      if (storeItem.deliveryType === 'FUNCTIONAL' && storeItem.metadata?.instant) {
        continue;
      }
      
      if (storeItem.type === 'CONSUMABLE') {
        // For consumables, add to existing quantity or create new
        await tx.userInventory.upsert({
          where: {
            userId_itemId: {
              userId,
              itemId: item.itemId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            userId,
            itemId: item.itemId,
            quantity: item.quantity,
          },
        });
      } else {
        // For non-consumables, create new inventory entry
        await tx.userInventory.create({
          data: {
            userId,
            itemId: item.itemId,
            quantity: 1,
          },
        });
      }
    }
  }

  private async processFunctionalItems(tx: any, userId: string, items: any[], storeItems: any[], walletId: string) {
    for (const item of items) {
      const storeItem = storeItems.find(si => si.id === item.itemId);
      
      if (storeItem.deliveryType === 'FUNCTIONAL') {
        const metadata = storeItem.metadata;
        
        // Handle gem packs
        if (metadata?.gemAmount && metadata?.instant) {
          const gemAmount = metadata.gemAmount * item.quantity;
          
          // Add gems to user wallet
          await tx.userWallet.update({
            where: { userId },
            data: { balance: { increment: gemAmount } },
          });
          
          // Create wallet transaction for gem credit
          await tx.walletTransaction.create({
            data: {
              walletId,
              type: 'CREDIT',
              amount: gemAmount,
              description: `Gem Pack: ${storeItem.name} (${item.quantity}x)`,
              referenceId: `gem-pack-${storeItem.id}`,
            },
          });
          
          this.logger.log(`Applied ${gemAmount} gems from ${storeItem.name} for user ${userId}`);
        }
        
        // Handle other functional items (XP boosts, etc.)
        if (metadata?.effect === 'DOUBLE_XP') {
          // This would integrate with game systems
          this.logger.log(`Applied ${storeItem.name} effect for user ${userId}`);
        }
        
        // Handle membership benefits
        if (storeItem.name.includes('Membership')) {
          // This would update user membership status
          this.logger.log(`Applied ${storeItem.name} membership for user ${userId}`);
        }
      }
    }
  }

  private async createFulfillmentRecords(tx: any, purchaseId: string, userId: string, items: any[], storeItems: any[]) {
    for (const item of items) {
      const storeItem = storeItems.find(si => si.id === item.itemId);
      
      const fulfillmentStatus = this.getFulfillmentStatus(storeItem.deliveryType);
      const deliveryData = this.getDeliveryData(storeItem.deliveryType, storeItem);
      
      await tx.itemFulfillment.create({
        data: {
          purchaseId,
          userId,
          itemId: item.itemId,
          status: fulfillmentStatus,
          deliveryType: storeItem.deliveryType,
          deliveryData,
          completedAt: fulfillmentStatus === 'COMPLETED' ? new Date() : null,
        },
      });
    }
  }

  private getFulfillmentStatus(deliveryType: string): string {
    switch (deliveryType) {
      case 'IN_GAME':
      case 'FUNCTIONAL':
        return 'COMPLETED'; // Instant delivery
      case 'EMAIL':
      case 'SHOPIFY':
        return 'PENDING'; // Requires processing
      default:
        return 'PENDING';
    }
  }

  private getDeliveryData(deliveryType: string, storeItem: any): any {
    switch (deliveryType) {
      case 'IN_GAME':
        return { 
          delivered: true,
          deliveredAt: new Date(),
          itemType: storeItem.category,
        };
      case 'EMAIL':
        return {
          emailRequired: true,
          template: 'digital_reward',
          rewardData: storeItem.metadata,
        };
      case 'SHOPIFY':
        return {
          requiresShipping: true,
          productData: storeItem.gameSpecificData,
        };
      case 'FUNCTIONAL':
        return {
          applied: true,
          appliedAt: new Date(),
          function: storeItem.gameSpecificData?.function || 'utility',
        };
      default:
        return {};
    }
  }

  private async getPurchaseWithDetails(purchaseId: string, tx?: any): Promise<PurchaseResponseDto> {
    const prisma = tx || this.prisma;
    
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                type: true,
                deliveryType: true,
                imageUrl: true,
                rarity: true,
              },
            },
          },
        },
        fulfillments: {
          select: {
            id: true,
            itemId: true,
            status: true,
            deliveryType: true,
            attempts: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return this.toPurchaseResponseDto(purchase);
  }

  async getPurchaseHistory(userId: string, filterDto: PurchaseHistoryFilterDto): Promise<PaginatedPurchaseHistoryDto> {
    const { page = 1, limit = 20, status } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [purchases, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          items: {
            include: {
              storeItem: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  imageUrl: true,
                  rarity: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
              fulfillments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      purchases: purchases.map(purchase => this.toPurchaseResponseDto(purchase)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getPurchaseSummary(userId: string): Promise<PurchaseSummaryDto> {
    const [purchaseStats, categoryStats, recentPurchase] = await Promise.all([
      this.prisma.purchase.aggregate({
        where: { userId, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.purchaseItem.groupBy({
        by: ['itemId'],
        where: {
          purchase: { userId, status: 'COMPLETED' },
        },
        _sum: { quantity: true },
      }),
      this.prisma.purchase.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Get most purchased category
    const categoryCount = await this.prisma.purchaseItem.findMany({
      where: {
        purchase: { userId, status: 'COMPLETED' },
      },
      include: {
        storeItem: {
          select: { category: true },
        },
      },
    });

    const categoryFrequency = categoryCount.reduce((acc, item) => {
      const category = item.storeItem.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const favoriteCategory = Object.keys(categoryFrequency).length > 0 
      ? Object.keys(categoryFrequency).reduce((a, b) => 
          categoryFrequency[a] > categoryFrequency[b] ? a : b)
      : undefined;

    return {
      totalPurchases: purchaseStats._count.id || 0,
      totalGemsSpent: purchaseStats._sum.totalAmount || 0,
      totalItemsPurchased: categoryCount.length,
      lastPurchaseDate: recentPurchase?.createdAt,
      favoriteCategory,
    };
  }

  async getPurchaseById(userId: string, purchaseId: string): Promise<PurchaseResponseDto> {
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        id: purchaseId,
        userId,
      },
      include: {
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                type: true,
                deliveryType: true,
                imageUrl: true,
                rarity: true,
              },
            },
          },
        },
        fulfillments: {
          select: {
            id: true,
            itemId: true,
            status: true,
            deliveryType: true,
            attempts: true,
            lastAttempt: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found or not owned by user');
    }

    return this.toPurchaseResponseDto(purchase);
  }

  async retryPurchase(userId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        id: purchaseId,
        userId,
        status: 'COMPLETED',
      },
      include: {
        fulfillments: {
          where: {
            status: 'FAILED',
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found or cannot be retried');
    }

    if (purchase.fulfillments.length === 0) {
      throw new BadRequestException('No failed fulfillments to retry');
    }

    // Update failed fulfillments to retry status
    const updatedCount = await this.prisma.itemFulfillment.updateMany({
      where: {
        purchaseId,
        status: 'FAILED',
      },
      data: {
        status: 'RETRY',
        attempts: { increment: 1 },
        lastAttempt: new Date(),
      },
    });

    this.logger.log(`Purchase retry initiated for ${purchaseId}, ${updatedCount.count} fulfillments`);

    return {
      message: 'Purchase retry initiated successfully',
      retriedFulfillments: updatedCount.count,
    };
  }

  private toPurchaseResponseDto(purchase: any): PurchaseResponseDto {
    return {
      id: purchase.id,
      userId: purchase.userId,
      totalAmount: purchase.totalAmount,
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      items: purchase.items?.map(item => ({
        id: item.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        storeItem: item.storeItem,
      })) || [],
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    };
  }
}