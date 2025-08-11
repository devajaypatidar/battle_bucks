import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CharacterProfilesService } from './character-profiles.service';
import { 
  CreateCharacterProfileDto,
  UpdateCharacterProfileDto,
  CharacterProfileResponseDto,
  EquipItemDto,
  EquipmentResponseDto,
  CharacterProfilesListDto 
} from './character-profiles.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Character Profiles')
@Controller('characters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CharacterProfilesController {
  constructor(private readonly characterProfilesService: CharacterProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user character profiles' })
  @ApiResponse({
    status: 200,
    description: 'Character profiles retrieved successfully',
    type: CharacterProfilesListDto,
  })
  async getCharacterProfiles(@Req() req): Promise<CharacterProfilesListDto> {
    return this.characterProfilesService.getCharacterProfiles(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new character profile' })
  @ApiResponse({
    status: 201,
    description: 'Character profile created successfully',
    type: CharacterProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid character data or game not found',
  })
  async createCharacterProfile(
    @Req() req,
    @Body() createCharacterProfileDto: CreateCharacterProfileDto
  ): Promise<CharacterProfileResponseDto> {
    return this.characterProfilesService.createCharacterProfile(req.user.id, createCharacterProfileDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get character profile with equipped items' })
  @ApiResponse({
    status: 200,
    description: 'Character profile retrieved successfully',
    type: CharacterProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile not found or not owned by user',
  })
  async getCharacterProfile(
    @Req() req,
    @Param('id') profileId: string
  ): Promise<CharacterProfileResponseDto> {
    return this.characterProfilesService.getCharacterProfile(req.user.id, profileId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update character profile information' })
  @ApiResponse({
    status: 200,
    description: 'Character profile updated successfully',
    type: CharacterProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile not found',
  })
  async updateCharacterProfile(
    @Req() req,
    @Param('id') profileId: string,
    @Body() updateCharacterProfileDto: UpdateCharacterProfileDto
  ): Promise<CharacterProfileResponseDto> {
    return this.characterProfilesService.updateCharacterProfile(req.user.id, profileId, updateCharacterProfileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete character profile' })
  @ApiResponse({
    status: 200,
    description: 'Character profile deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete active character profile',
  })
  async deleteCharacterProfile(
    @Req() req,
    @Param('id') profileId: string
  ) {
    return this.characterProfilesService.deleteCharacterProfile(req.user.id, profileId);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Set character profile as active for its game' })
  @ApiResponse({
    status: 200,
    description: 'Character profile activated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile not found',
  })
  async activateCharacterProfile(
    @Req() req,
    @Param('id') profileId: string
  ) {
    return this.characterProfilesService.activateCharacterProfile(req.user.id, profileId);
  }

  @Post(':id/equip')
  @ApiOperation({ summary: 'Equip an item to character profile' })
  @ApiResponse({
    status: 200,
    description: 'Item equipped successfully',
    type: EquipmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Item cannot be equipped (not owned, incompatible, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile or item not found',
  })
  async equipItem(
    @Req() req,
    @Param('id') profileId: string,
    @Body() equipItemDto: EquipItemDto
  ): Promise<EquipmentResponseDto> {
    return this.characterProfilesService.equipItem(req.user.id, profileId, equipItemDto);
  }

  @Delete(':id/unequip/:itemId')
  @ApiOperation({ summary: 'Unequip a specific item from character profile' })
  @ApiResponse({
    status: 200,
    description: 'Item unequipped successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile or equipped item not found',
  })
  async unequipItem(
    @Req() req,
    @Param('id') profileId: string,
    @Param('itemId') itemId: string
  ) {
    return this.characterProfilesService.unequipItem(req.user.id, profileId, itemId);
  }

  @Delete(':id/unequip-slot/:slot')
  @ApiOperation({ summary: 'Unequip item from specific slot' })
  @ApiResponse({
    status: 200,
    description: 'Slot cleared successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Character profile not found or slot empty',
  })
  async unequipSlot(
    @Req() req,
    @Param('id') profileId: string,
    @Param('slot') slot: string
  ) {
    return this.characterProfilesService.unequipSlot(req.user.id, profileId, slot);
  }
}
