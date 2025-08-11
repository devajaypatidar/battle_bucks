import { Module } from '@nestjs/common';
import { CharacterProfilesService } from './character-profiles.service';
import { CharacterProfilesController } from './character-profiles.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CharacterProfilesController],
  providers: [CharacterProfilesService],
  exports: [CharacterProfilesService],
})
export class CharacterProfilesModule {}