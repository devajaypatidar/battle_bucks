import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { 
  InventoryFilterDto, 
  PaginatedInventoryDto, 
  InventoryItemResponseDto, 
  InventorySummaryDto,
  UseItemResponseDto,
  InventoryCategoryDto 
} from './inventory.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get user inventory with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'category', required: false, enum: ['SKIN', 'DIGITAL_REWARD', 'PHYSICAL_MERCH', 'UTILITY', 'CONSUMABLE'] })
  @ApiQuery({ name: 'type', required: false, enum: ['CONSUMABLE', 'NON_CONSUMABLE'] })
  @ApiQuery({ name: 'gameId', required: false, type: String, description: 'Filter by game ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by item name' })
  @ApiQuery({ name: 'showConsumed', required: false, type: Boolean, description: 'Include consumed items' })
  @ApiResponse({
    status: 200,
    description: 'Inventory retrieved successfully',
    type: PaginatedInventoryDto,
  })
  async getInventory(
    @Req() req,
    @Query() filterDto: InventoryFilterDto
  ): Promise<PaginatedInventoryDto> {
    return this.inventoryService.getInventory(req.user.id, filterDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary and statistics' })
  @ApiResponse({
    status: 200,
    description: 'Inventory summary retrieved successfully',
    type: InventorySummaryDto,
  })
  async getInventorySummary(@Req() req): Promise<InventorySummaryDto> {
    return this.inventoryService.getInventorySummary(req.user.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get inventory grouped by categories' })
  @ApiResponse({
    status: 200,
    description: 'Inventory categories retrieved successfully',
    type: [InventoryCategoryDto],
  })
  async getInventoryCategories(@Req() req): Promise<InventoryCategoryDto[]> {
    return this.inventoryService.getInventoryCategories(req.user.id);
  }

  @Get('games/:gameId')
  @ApiOperation({ summary: 'Get inventory items for specific game' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Game inventory retrieved successfully',
    type: PaginatedInventoryDto,
  })
  async getGameInventory(
    @Req() req,
    @Param('gameId') gameId: string,
    @Query() filterDto: InventoryFilterDto
  ): Promise<PaginatedInventoryDto> {
    return this.inventoryService.getGameInventory(req.user.id, gameId, filterDto);
  }

  @Get(':itemId')
  @ApiOperation({ summary: 'Get detailed information about inventory item' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item details retrieved successfully',
    type: InventoryItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found in inventory',
  })
  async getInventoryItem(
    @Req() req,
    @Param('itemId') itemId: string
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.getInventoryItem(req.user.id, itemId);
  }

  @Post(':itemId/use')
  @ApiOperation({ summary: 'Use a consumable item (decreases quantity)' })
  @ApiResponse({
    status: 200,
    description: 'Item used successfully',
    type: UseItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Item cannot be used (not consumable, insufficient quantity, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found in inventory',
  })
  async useItem(
    @Req() req,
    @Param('itemId') itemId: string
  ): Promise<UseItemResponseDto> {
    return this.inventoryService.useItem(req.user.id, itemId);
  }
}