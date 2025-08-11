import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../module/database/prisma.service';
import { CacheService } from '../services/cache.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        uptime: { type: 'number', example: 3600.123 },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with database and cache status' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
  })
  async getDetailedHealth() {
    const startTime = Date.now();

    // Test database connection
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Test cache service
    const cacheStats = this.cacheService.getStats();

    const totalResponseTime = Date.now() - startTime;

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`,
        },
        cache: {
          status: 'healthy',
          size: cacheStats.size,
          expiredEntries: cacheStats.expired,
        },
      },
      performance: {
        totalResponseTime: `${totalResponseTime}ms`,
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    };
  }
}