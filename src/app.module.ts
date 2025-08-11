import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './module/database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './module/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './module/store/store.module';
import { PurchaseModule } from './module/purchase/purchase.module';
import { InventoryModule } from './module/inventory/inventory.module';
import { CharacterProfilesModule } from './module/character-profiles/character-profiles.module';
import { CommonModule } from './common/common.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { ResourceProtectionGuard } from './common/guards/resource-protection.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Rate limiting configuration for production scale
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium', 
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 300000, // 5 minutes
        limit: 500, // 500 requests per 5 minutes
      }
    ]),
    CommonModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    StoreModule,
    PurchaseModule,
    InventoryModule,
    CharacterProfilesModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceProtectionGuard,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
