import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { CreateStoreItemDto, StoreItemResponseDto, StoreFilterDto, PaginatedStoreItemsDto, CategoryStatsDto } from './store.dto';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getStoreItems(filterDto: StoreFilterDto): Promise<PaginatedStoreItemsDto> {
    const { 
      page = 1, 
      limit = 20, 
      gameId, 
      category, 
      type, 
      rarity, 
      search, 
      minPrice, 
      maxPrice 
    } = filterDto;
    
    const skip = (page - 1) * limit;

    // Build dynamic where clause
    const where: any = {
      isActive: true,
    };

    // Game filtering (specific game OR platform-wide)
    if (gameId) {
      where.OR = [
        { gameId: gameId },
        { gameId: null }, // Platform-wide items
      ];
    }

    // Category filtering
    if (category) {
      where.category = category;
    }

    // Type filtering
    if (type) {
      where.type = type;
    }

    // Rarity filtering
    if (rarity) {
      where.rarity = rarity;
    }

    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    try {
      // Execute query with pagination
      const [items, total] = await Promise.all([
        this.prisma.storeItem.findMany({
          where,
          include: {
            game: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            gameIntegrations: {
              select: {
                gameItemId: true,
                gameItemType: true,
                integrationData: true,
              },
            },
          },
          orderBy: [
            { rarity: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        this.prisma.storeItem.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Retrieved ${items.length} store items (page ${page}/${totalPages})`);

      return {
        items: items.map(item => this.toResponseDto(item)),
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
      this.logger.error('Error retrieving store items:', error);
      throw new BadRequestException('Failed to retrieve store items');
    }
  }

  async getStoreItemById(id: string): Promise<StoreItemResponseDto> {
    const item = await this.prisma.storeItem.findUnique({
      where: { id },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        gameIntegrations: {
          select: {
            gameItemId: true,
            gameItemType: true,
            integrationData: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Store item not found');
    }

    if (!item.isActive) {
      throw new NotFoundException('Store item is no longer available');
    }

    return this.toResponseDto(item);
  }

  async getFeaturedItems(): Promise<StoreItemResponseDto[]> {
    return this.cacheService.getOrSet(
      'featured-items',
      async () => {
        const items = await this.prisma.storeItem.findMany({
          where: {
            isActive: true,
            rarity: {
              in: ['LEGENDARY', 'MYTHIC', 'EPIC'],
            },
          },
          include: {
            game: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: [
            { rarity: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 12, // Featured showcase limit
        });

        this.logger.log(`Retrieved ${items.length} featured items`);
        return items.map(item => this.toResponseDto(item));
      },
      10 * 60 * 1000, // Cache for 10 minutes
    );
  }

  async getCategories(): Promise<CategoryStatsDto[]> {
    return this.cacheService.getOrSet(
      'store-categories',
      async () => {
        const categoryStats = await this.prisma.storeItem.groupBy({
          by: ['category'],
          where: {
            isActive: true,
          },
          _count: {
            category: true,
          },
          orderBy: {
            _count: {
              category: 'desc',
            },
          },
        });

        return categoryStats.map(stat => ({
          category: stat.category as any,
          itemCount: stat._count.category,
          description: this.getCategoryDescription(stat.category),
        }));
      },
      15 * 60 * 1000, // Cache for 15 minutes
    );
  }

  async getItemsByGame(gameId: string, filterDto: StoreFilterDto): Promise<PaginatedStoreItemsDto> {
    // Verify game exists
    const game = await this.prisma.game.findUnique({
      where: { 
        id: gameId,
        isActive: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found or inactive');
    }

    this.logger.log(`Retrieving items for game: ${game.name} (${game.code})`);

    // Get items for this specific game + platform-wide items
    return this.getStoreItems({
      ...filterDto,
      gameId,
    });
  }

  async createStoreItem(createStoreItemDto: CreateStoreItemDto): Promise<StoreItemResponseDto> {
    const {
      name,
      description,
      price,
      category,
      type,
      deliveryType,
      gameId,
      rarity,
      imageUrl,
      metadata,
      gameSpecificData,
    } = createStoreItemDto;

    // Validate game exists if gameId provided
    if (gameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        throw new BadRequestException('Game not found');
      }
    }

    // Validate price
    if (price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    try {
      const item = await this.prisma.storeItem.create({
        data: {
          name,
          description,
          price,
          category,
          type,
          deliveryType,
          gameId,
          rarity,
          imageUrl,
          metadata,
          gameSpecificData,
          isActive: true,
        },
        include: {
          game: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      this.logger.log(`Created new store item: ${item.name} (${item.id})`);
      return this.toResponseDto(item);
    } catch (error) {
      this.logger.error('Error creating store item:', error);
      throw new BadRequestException('Failed to create store item');
    }
  }

  private toResponseDto(item: any): StoreItemResponseDto {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      type: item.type,
      deliveryType: item.deliveryType,
      rarity: item.rarity,
      imageUrl: item.imageUrl,
      metadata: item.metadata,
      gameSpecificData: item.gameSpecificData,
      isActive: item.isActive,
      game: item.game,
      gameIntegrations: item.gameIntegrations || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      SKIN: 'Cosmetic items that change the appearance of characters or weapons',
      DIGITAL_REWARD: 'Digital vouchers, codes, and online rewards',
      PHYSICAL_MERCH: 'Physical merchandise and collectibles',
      UTILITY: 'Functional items like name changes and extra lives',
      CONSUMABLE: 'One-time use items and temporary boosts',
    };
    return descriptions[category] || 'Store items';
  }
}