import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreItemDto, StoreItemResponseDto, StoreFilterDto, PaginatedStoreItemsDto, CategoryStatsDto } from './store.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('items')
  @ApiOperation({ summary: 'Browse store items with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'gameId', required: false, type: String, description: 'Filter by game ID' })
  @ApiQuery({ name: 'category', required: false, enum: ['SKIN', 'DIGITAL_REWARD', 'PHYSICAL_MERCH', 'UTILITY', 'CONSUMABLE'] })
  @ApiQuery({ name: 'type', required: false, enum: ['CONSUMABLE', 'NON_CONSUMABLE'] })
  @ApiQuery({ name: 'rarity', required: false, enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price in gems' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price in gems' })
  @ApiResponse({
    status: 200,
    description: 'Store items retrieved successfully',
    type: PaginatedStoreItemsDto,
  })
  async getStoreItems(@Query() filterDto: StoreFilterDto): Promise<PaginatedStoreItemsDto> {
    return this.storeService.getStoreItems(filterDto);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get store item by ID with full details' })
  @ApiResponse({
    status: 200,
    description: 'Store item retrieved successfully',
    type: StoreItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Store item not found',
  })
  async getStoreItemById(@Param('id') id: string): Promise<StoreItemResponseDto> {
    return this.storeService.getStoreItemById(id);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured store items (high rarity and popular)' })
  @ApiResponse({
    status: 200,
    description: 'Featured items retrieved successfully',
    type: [StoreItemResponseDto],
  })
  async getFeaturedItems(): Promise<StoreItemResponseDto[]> {
    return this.storeService.getFeaturedItems();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get store categories with item counts' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryStatsDto],
  })
  async getCategories(): Promise<CategoryStatsDto[]> {
    return this.storeService.getCategories();
  }

  @Get('games/:gameId/items')
  @ApiOperation({ summary: 'Get items for specific game (includes platform-wide items)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'rarity', required: false })
  @ApiResponse({
    status: 200,
    description: 'Game items retrieved successfully',
    type: PaginatedStoreItemsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Game not found',
  })
  async getItemsByGame(
    @Param('gameId') gameId: string,
    @Query() filterDto: StoreFilterDto
  ): Promise<PaginatedStoreItemsDto> {
    return this.storeService.getItemsByGame(gameId, filterDto);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new store item (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Store item created successfully',
    type: StoreItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid item data or game not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async createStoreItem(@Body() createStoreItemDto: CreateStoreItemDto): Promise<StoreItemResponseDto> {
    return this.storeService.createStoreItem(createStoreItemDto);
  }
}
