// ==========================================
// FILE: src/purchases/purchases.dto.ts
// ==========================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, Min, Max, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enums
export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

export enum DeliveryType {
  IN_GAME = 'IN_GAME',
  EMAIL = 'EMAIL',
  SHOPIFY = 'SHOPIFY',
  FUNCTIONAL = 'FUNCTIONAL',
}

// Purchase Item DTO for creating purchases
export class PurchaseItemDto {
  @ApiProperty({
    description: 'Store item ID to purchase',
    example: 'clp123456789',
  })
  @IsString()
  itemId: string;

  @ApiProperty({
    description: 'Quantity to purchase',
    example: 1,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(100, { message: 'Maximum quantity per item is 100' })
  quantity: number;
}

// Create Purchase DTO
export class CreatePurchaseDto {
  @ApiProperty({
    description: 'Array of items to purchase',
    type: [PurchaseItemDto],
    example: [
      { itemId: 'clp123456789', quantity: 1 },
      { itemId: 'clp987654321', quantity: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate purchases',
    example: 'purchase_2024_user123_1642781234',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

// Purchase History Filter DTO
export class PurchaseHistoryFilterDto {
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
    description: 'Number of purchases per page',
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
    description: 'Filter by purchase status',
    enum: PurchaseStatus,
  })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;
}

// Store Item Summary DTO (for purchase responses)
export class StoreItemSummaryDto {
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
    example: 'SKIN',
  })
  category: string;

  @ApiProperty({
    description: 'Item type (consumable or permanent)',
    example: 'NON_CONSUMABLE',
  })
  type: string;

  @ApiProperty({
    description: 'How the item is delivered',
    example: 'IN_GAME',
  })
  deliveryType: string;

  @ApiPropertyOptional({
    description: 'Item rarity level',
    example: 'LEGENDARY',
  })
  rarity?: string;

  @ApiPropertyOptional({
    description: 'Item image URL',
    example: 'https://cdn.battlebucks.com/items/dragon-lore.jpg',
  })
  imageUrl?: string;
}

// Purchase Item Response DTO
export class PurchaseItemResponseDto {
  @ApiProperty({
    description: 'Purchase item unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Store item ID that was purchased',
    example: 'clp987654321',
  })
  itemId: string;

  @ApiProperty({
    description: 'Quantity purchased',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit at time of purchase',
    example: 500,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Total price for this item (unitPrice × quantity)',
    example: 1000,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Store item details',
    type: StoreItemSummaryDto,
  })
  storeItem: StoreItemSummaryDto;
}

// Purchase Response DTO
export class PurchaseResponseDto {
  @ApiProperty({
    description: 'Purchase unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who made the purchase',
    example: 'clp987654321',
  })
  userId: string;

  @ApiProperty({
    description: 'Total amount in gems spent',
    example: 2500,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Purchase status',
    enum: PurchaseStatus,
    example: PurchaseStatus.COMPLETED,
  })
  status: PurchaseStatus;

  @ApiPropertyOptional({
    description: 'Payment method used (for future integrations)',
    example: 'gems',
  })
  paymentMethod?: string;

  @ApiProperty({
    description: 'Array of purchased items',
    type: [PurchaseItemResponseDto],
  })
  items: PurchaseItemResponseDto[];

  @ApiProperty({
    description: 'Purchase creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

// Fulfillment Response DTO
export class FulfillmentResponseDto {
  @ApiProperty({
    description: 'Fulfillment unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Purchase ID this fulfillment belongs to',
    example: 'clp987654321',
  })
  purchaseId: string;

  @ApiProperty({
    description: 'Item ID being fulfilled',
    example: 'clp456789123',
  })
  itemId: string;

  @ApiProperty({
    description: 'Fulfillment status',
    enum: FulfillmentStatus,
    example: FulfillmentStatus.COMPLETED,
  })
  status: FulfillmentStatus;

  @ApiProperty({
    description: 'Delivery type',
    enum: DeliveryType,
    example: DeliveryType.IN_GAME,
  })
  deliveryType: DeliveryType;

  @ApiPropertyOptional({
    description: 'Delivery-specific data (email addresses, order IDs, etc.)',
    example: { email: 'player@example.com', trackingNumber: 'TRK123456' },
  })
  deliveryData?: any;

  @ApiProperty({
    description: 'Number of delivery attempts',
    example: 1,
  })
  attempts: number;

  @ApiPropertyOptional({
    description: 'Last attempt timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastAttempt?: Date;

  @ApiPropertyOptional({
    description: 'Completion timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Fulfillment creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Store item details',
    type: StoreItemSummaryDto,
  })
  storeItem: StoreItemSummaryDto;
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

// Paginated Purchase History Response DTO
export class PaginatedPurchaseHistoryDto {
  @ApiProperty({
    description: 'Array of purchase records',
    type: [PurchaseResponseDto],
  })
  purchases: PurchaseResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

// Purchase Summary DTO (for user stats)
export class PurchaseSummaryDto {
  @ApiProperty({
    description: 'Total number of purchases made',
    example: 15,
  })
  totalPurchases: number;

  @ApiProperty({
    description: 'Total gems spent',
    example: 25000,
  })
  totalGemsSpent: number;

  @ApiProperty({
    description: 'Total items purchased',
    example: 45,
  })
  totalItemsPurchased: number;

  @ApiProperty({
    description: 'Most recent purchase date',
    example: '2024-01-15T10:30:00Z',
  })
  lastPurchaseDate?: Date;

  @ApiProperty({
    description: 'Favorite item category',
    example: 'SKIN',
  })
  favoriteCategory?: string;
}