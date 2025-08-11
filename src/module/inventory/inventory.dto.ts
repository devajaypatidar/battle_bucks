// ==========================================
// FILE: src/inventory/inventory.dto.ts
// ==========================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min, Max } from 'class-validator';
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

// Inventory Filter DTO
export class InventoryFilterDto {
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
    description: 'Filter by game ID',
    example: 'clp123456789',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Search items by name (case-insensitive)',
    example: 'dragon',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Include consumed/used items',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  showConsumed?: boolean = false;
}

// Game Info DTO (for inventory responses)
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

// Store Item Summary DTO (for inventory responses)
export class InventoryStoreItemDto {
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
    example: 'Legendary weapon skin with dragon artwork',
  })
  description?: string;

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

  @ApiProperty({
    description: 'Item price in gems',
    example: 2500,
  })
  price: number;

  @ApiPropertyOptional({
    description: 'Item image URL',
    example: 'https://cdn.battlebucks.com/items/dragon-lore.jpg',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Associated game information',
    type: GameInfoDto,
  })
  game?: GameInfoDto;
}

// Item Usage History DTO
export class ItemUsageHistoryDto {
  @ApiProperty({
    description: 'Date and time when item was used',
    example: '2024-01-15T10:30:00Z',
  })
  usedAt: Date;

  @ApiProperty({
    description: 'Quantity used in this instance',
    example: 1,
  })
  quantityUsed: number;

  @ApiProperty({
    description: 'Remaining quantity after this use',
    example: 2,
  })
  remainingAfterUse: number;
}

// Inventory Item Response DTO
export class InventoryItemResponseDto {
  @ApiProperty({
    description: 'Inventory record unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Store item ID',
    example: 'clp987654321',
  })
  itemId: string;

  @ApiProperty({
    description: 'Quantity owned',
    example: 3,
  })
  quantity: number;

  @ApiProperty({
    description: 'Date when item was acquired',
    example: '2024-01-15T10:30:00Z',
  })
  acquiredAt: Date;

  @ApiPropertyOptional({
    description: 'Date when item was last used (for consumables)',
    example: '2024-01-15T12:30:00Z',
  })
  usedAt?: Date;

  @ApiProperty({
    description: 'Whether the item is fully consumed',
    example: false,
  })
  isConsumed: boolean;

  @ApiProperty({
    description: 'Store item details',
    type: InventoryStoreItemDto,
  })
  storeItem: InventoryStoreItemDto;

  @ApiPropertyOptional({
    description: 'Usage history for consumable items',
    type: [ItemUsageHistoryDto],
  })
  usageHistory?: ItemUsageHistoryDto[];
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

// Paginated Inventory Response DTO
export class PaginatedInventoryDto {
  @ApiProperty({
    description: 'Array of inventory items',
    type: [InventoryItemResponseDto],
  })
  items: InventoryItemResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

// Inventory Summary DTO
export class InventorySummaryDto {
  @ApiProperty({
    description: 'Total number of unique items owned',
    example: 25,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total quantity of all items',
    example: 45,
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'Total value of inventory in gems',
    example: 15000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Distribution of items by category',
    example: { SKIN: 10, CONSUMABLE: 15, UTILITY: 5 },
  })
  categoryDistribution: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Name of most recently acquired item',
    example: 'Dragon Lore AK-47 Skin',
  })
  lastAcquiredItem?: string;

  @ApiPropertyOptional({
    description: 'Date of most recent acquisition',
    example: '2024-01-15T10:30:00Z',
  })
  lastAcquiredDate?: Date;
}

// Use Item Response DTO
export class UseItemResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Used Health Potion successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Remaining quantity after use',
    example: 2,
  })
  remainingQuantity: number;

  @ApiProperty({
    description: 'Whether the item is now fully consumed',
    example: false,
  })
  isFullyConsumed: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when item was used',
    example: '2024-01-15T10:30:00Z',
  })
  usedAt?: Date;
}

// Inventory Category DTO
export class InventoryCategoryDto {
  @ApiProperty({
    description: 'Category name',
    enum: ItemCategory,
    example: ItemCategory.SKIN,
  })
  category: ItemCategory;

  @ApiProperty({
    description: 'Number of items in this category',
    example: 12,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Category description',
    example: 'Cosmetic items that change appearance',
  })
  description: string;
}