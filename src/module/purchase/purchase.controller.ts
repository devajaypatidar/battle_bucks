import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchasesService } from './purchase.service';
import { CreatePurchaseDto, PurchaseResponseDto, PurchaseHistoryFilterDto, PaginatedPurchaseHistoryDto, PurchaseSummaryDto } from './purchase.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase with gems' })
  @ApiResponse({
    status: 201,
    description: 'Purchase completed successfully',
    type: PurchaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient gems, invalid items, or duplicate purchase',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more items not found',
  })
  async createPurchase(
    @Req() req,
    @Body() createPurchaseDto: CreatePurchaseDto
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.createPurchase(req.user.id, createPurchaseDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user purchase history with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  @ApiResponse({
    status: 200,
    description: 'Purchase history retrieved successfully',
    type: PaginatedPurchaseHistoryDto,
  })
  async getPurchaseHistory(
    @Req() req,
    @Query() filterDto: PurchaseHistoryFilterDto
  ): Promise<PaginatedPurchaseHistoryDto> {
    return this.purchasesService.getPurchaseHistory(req.user.id, filterDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get user purchase summary and statistics' })
  @ApiResponse({
    status: 200,
    description: 'Purchase summary retrieved successfully',
    type: PurchaseSummaryDto,
  })
  async getPurchaseSummary(@Req() req): Promise<PurchaseSummaryDto> {
    return this.purchasesService.getPurchaseSummary(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed information about a specific purchase' })
  @ApiResponse({
    status: 200,
    description: 'Purchase details retrieved successfully',
    type: PurchaseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Purchase not found or not owned by user',
  })
  async getPurchaseById(
    @Req() req,
    @Param('id') purchaseId: string
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.getPurchaseById(req.user.id, purchaseId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed purchase fulfillment' })
  @ApiResponse({
    status: 200,
    description: 'Purchase retry initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Purchase cannot be retried or no failed fulfillments',
  })
  @ApiResponse({
    status: 404,
    description: 'Purchase not found',
  })
  async retryPurchase(
    @Req() req,
    @Param('id') purchaseId: string
  ) {
    return this.purchasesService.retryPurchase(req.user.id, purchaseId);
  }
}