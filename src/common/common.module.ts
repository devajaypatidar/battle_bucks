import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { ResourceProtectionGuard } from './guards/resource-protection.guard';
import { HealthController } from './controllers/health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    CacheService,
    LoggingInterceptor,
    PerformanceInterceptor,
    ResourceProtectionGuard,
  ],
  exports: [
    CacheService,
    LoggingInterceptor,
    PerformanceInterceptor,
    ResourceProtectionGuard,
  ],
})
export class CommonModule {}