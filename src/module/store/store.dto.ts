// ==========================================
// FILE: src/store/store.dto.ts
// ==========================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsUrl, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enums (matching Prisma schema)
export enum ItemCategory {
  SKIN = 'SKIN',
  DIGITAL_REWARD = 'DIGITAL_REWARD',
  PHYSICAL_MERCH = 'PHYSICAL_MERCH',
  UTILITY = 'UTILITY',
  CONSUMABLE = 'CONSUMABLE',
}

export enum ItemType {
  CONSUMABLE = 'CONSUMABLE',
  NON_CONSUMABLE = 'NON_CONSUMABLE',
}

export enum DeliveryType {
  IN_GAME = 'IN_GAME',
  EMAIL = 'EMAIL',
  SHOPIFY = 'SHOPIFY',
  FUNCTIONAL = 'FUNCTIONAL',
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
}

// Create Store Item DTO
export class CreateStoreItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Dragon Lore AK-47 Skin',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'Legendary weapon skin with intricate dragon artwork',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Price in gems',
    example: 2500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({
    description: 'Item category',
    enum: ItemCategory,
    example: ItemCategory.SKIN,
  })
  @IsEnum(ItemCategory)
  category: ItemCategory;

  @ApiProperty({
    description: 'Item type (consumable or permanent)',
    enum: ItemType,
    example: ItemType.NON_CONSUMABLE,
  })
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({
    description: 'How the item is delivered to users',
    enum: DeliveryType,
    example: DeliveryType.IN_GAME,
  })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiPropertyOptional({
    description: 'Game ID (null for platform-wide items)',
    example: 'clp123456789',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Item rarity level',
    enum: ItemRarity,
    example: ItemRarity.LEGENDARY,
  })
  @IsOptional()
  @IsEnum(ItemRarity)
  rarity?: ItemRarity;

  @ApiPropertyOptional({
    description: 'Item image URL',
    example: 'https://cdn.battlebucks.com/items/dragon-lore.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid image URL' })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional item metadata (JSON)',
    example: { 
      tags: ['weapon', 'rifle', 'legendary'],
      stats: { damage: 47, accuracy: 73 },
      unlockLevel: 25
    },
  })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Game-specific configuration data (JSON)',
    example: { 
      weaponClass: 'rifle',
      slot: 'primary',
      statTrack: true,
      tradeable: false
    },
  })
  @IsOptional()
  gameSpecificData?: any;
}

// Store Filter DTO
export class StoreFilterDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by game ID (includes platform-wide items)',
    example: 'clp123456789',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Filter by item category',
    enum: ItemCategory,
  })
  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @ApiPropertyOptional({
    description: 'Filter by item type',
    enum: ItemType,
  })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiPropertyOptional({
    description: 'Filter by item rarity',
    enum: ItemRarity,
  })
  @IsOptional()
  @IsEnum(ItemRarity)
  rarity?: ItemRarity;

  @ApiPropertyOptional({
    description: 'Search items by name (case-insensitive)',
    example: 'dragon',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Minimum price in gems',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price in gems',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

// Game Integration Response DTO
export class GameIntegrationDto {
  @ApiProperty({
    description: 'Item ID in the specific game',
    example: 'ak47_dragon_lore',
  })
  gameItemId: string;

  @ApiProperty({
    description: 'Type of item in the game system',
    example: 'weapon_skin',
  })
  gameItemType: string;

  @ApiPropertyOptional({
    description: 'Game-specific integration data',
    example: { statTrack: true, condition: 'factory_new', float: 0.001 },
  })
  integrationData?: any;
}

// Game Info DTO
export class GameInfoDto {
  @ApiProperty({
    description: 'Game unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Game name',
    example: 'Counter-Strike 2',
  })
  name: string;

  @ApiProperty({
    description: 'Game short code',
    example: 'CS2',
  })
  code: string;
}

// Store Item Response DTO
export class StoreItemResponseDto {
  @ApiProperty({
    description: 'Item unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Dragon Lore AK-47 Skin',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'Legendary weapon skin with intricate dragon artwork',
  })
  description?: string;

  @ApiProperty({
    description: 'Price in gems',
    example: 2500,
  })
  price: number;

  @ApiProperty({
    description: 'Item category',
    enum: ItemCategory,
    example: ItemCategory.SKIN,
  })
  category: ItemCategory;

  @ApiProperty({
    description: 'Item type',
    enum: ItemType,
    example: ItemType.NON_CONSUMABLE,
  })
  type: ItemType;

  @ApiProperty({
    description: 'Delivery method',
    enum: DeliveryType,
    example: DeliveryType.IN_GAME,
  })
  deliveryType: DeliveryType;

  @ApiPropertyOptional({
    description: 'Item rarity level',
    enum: ItemRarity,
    example: ItemRarity.LEGENDARY,
  })
  rarity?: ItemRarity;

  @ApiPropertyOptional({
    description: 'Item image URL',
    example: 'https://cdn.battlebucks.com/items/dragon-lore.jpg',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional item metadata',
  })
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Game-specific configuration data',
  })
  gameSpecificData?: any;

  @ApiProperty({
    description: 'Whether the item is currently available',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Associated game information (null for platform-wide items)',
    type: GameInfoDto,
  })
  game?: GameInfoDto;

  @ApiProperty({
    description: 'Game integration details',
    type: [GameIntegrationDto],
  })
  gameIntegrations: GameIntegrationDto[];

  @ApiProperty({
    description: 'Item creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

// Pagination DTO
export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

// Paginated Store Items Response DTO
export class PaginatedStoreItemsDto {
  @ApiProperty({
    description: 'Array of store items',
    type: [StoreItemResponseDto],
  })
  items: StoreItemResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

// Category Statistics DTO
export class CategoryStatsDto {
  @ApiProperty({
    description: 'Category name',
    enum: ItemCategory,
    example: ItemCategory.SKIN,
  })
  category: ItemCategory;

  @ApiProperty({
    description: 'Number of items in this category',
    example: 45,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Category description',
    example: 'Cosmetic items that change the appearance of characters or weapons',
  })
  description: string;
}