import { Module } from '@nestjs/common';
import { PurchasesService } from './purchase.service';
import { PurchasesController } from './purchase.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchaseModule {}