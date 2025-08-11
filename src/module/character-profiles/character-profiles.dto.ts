// ==========================================
// FILE: src/character-profiles/character-profiles.dto.ts
// ==========================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, MinLength, MaxLength, Matches } from 'class-validator';

// Create Character Profile DTO
export class CreateCharacterProfileDto {
  @ApiProperty({
    description: 'Character name',
    example: 'ShadowWarrior',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @MinLength(2, { message: 'Character name must be at least 2 characters long' })
  @MaxLength(30, { message: 'Character name must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_\-\s]+$/, {
    message: 'Character name can only contain letters, numbers, spaces, underscores, and hyphens',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Game ID for game-specific character (null for platform-wide)',
    example: 'clp123456789',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Character metadata (avatar settings, preferences, etc.)',
    example: {
      avatarColor: '#FF5733',
      preferredWeaponClass: 'rifle',
      displayBadges: true,
      customSettings: {
        voicePack: 'english',
        theme: 'dark'
      }
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

// Update Character Profile DTO
export class UpdateCharacterProfileDto {
  @ApiPropertyOptional({
    description: 'Character name',
    example: 'ShadowLegend',
    minLength: 2,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_\-\s]+$/)
  name?: string;

  @ApiPropertyOptional({
    description: 'Character metadata updates',
    example: {
      avatarColor: '#00FF00',
      displayBadges: false
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

// Equip Item DTO
export class EquipItemDto {
  @ApiProperty({
    description: 'Store item ID to equip',
    example: 'clp123456789',
  })
  @IsString()
  itemId: string;

  @ApiPropertyOptional({
    description: 'Equipment slot (auto-determined if not provided)',
    example: 'primary_weapon_skin',
  })
  @IsOptional()
  @IsString()
  slot?: string;
}

// Game Info DTO (reused)
export class GameInfoDto {
  @ApiProperty({
    description: 'Game unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Game name',
    example: 'Counter-Strike 2',
  })
  name: string;

  @ApiProperty({
    description: 'Game short code',
    example: 'CS2',
  })
  code: string;
}

// Store Item Summary DTO (for equipped items)
export class EquippedStoreItemDto {
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
    description: 'Item type',
    example: 'NON_CONSUMABLE',
  })
  type: string;

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

  @ApiPropertyOptional({
    description: 'Game ID (null for platform-wide items)',
    example: 'clp123456789',
  })
  gameId?: string;
}

// Equipped Item DTO
export class EquippedItemDto {
  @ApiProperty({
    description: 'Equipment record unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Store item ID',
    example: 'clp987654321',
  })
  itemId: string;

  @ApiProperty({
    description: 'Equipment slot',
    example: 'primary_weapon_skin',
  })
  slot: string;

  @ApiProperty({
    description: 'When the item was equipped',
    example: '2024-01-15T10:30:00Z',
  })
  equippedAt: Date;

  @ApiProperty({
    description: 'Store item details',
    type: EquippedStoreItemDto,
  })
  storeItem: EquippedStoreItemDto;
}

// Character Profile Response DTO
export class CharacterProfileResponseDto {
  @ApiProperty({
    description: 'Character profile unique identifier',
    example: 'clp123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Character name',
    example: 'ShadowWarrior',
  })
  name: string;

  @ApiProperty({
    description: 'Whether this is the active character for its game/platform',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Game ID (null for platform-wide character)',
    example: 'clp123456789',
  })
  gameId?: string;

  @ApiPropertyOptional({
    description: 'Associated game information',
    type: GameInfoDto,
  })
  game?: GameInfoDto;

  @ApiPropertyOptional({
    description: 'Character metadata and settings',
    example: {
      avatarColor: '#FF5733',
      preferredWeaponClass: 'rifle',
      displayBadges: true
    },
  })
  metadata?: any;

  @ApiProperty({
    description: 'Items currently equipped to this character',
    type: [EquippedItemDto],
  })
  equippedItems: EquippedItemDto[];

  @ApiProperty({
    description: 'Number of equipped items',
    example: 5,
  })
  equippedItemsCount: number;

  @ApiProperty({
    description: 'Character creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last character update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

// Character Profiles List DTO
export class CharacterProfilesListDto {
  @ApiProperty({
    description: 'Array of all character profiles',
    type: [CharacterProfileResponseDto],
  })
  profiles: CharacterProfileResponseDto[];

  @ApiProperty({
    description: 'Character profiles organized by game',
    example: {
      'platform-wide': ['profile1', 'profile2'],
      'game-cs2': ['profile3'],
      'game-valorant': ['profile4', 'profile5']
    },
  })
  profilesByGame: Record<string, CharacterProfileResponseDto[]>;

  @ApiProperty({
    description: 'Total number of character profiles',
    example: 5,
  })
  totalProfiles: number;

  @ApiProperty({
    description: 'Number of active character profiles',
    example: 3,
  })
  activeProfiles: number;
}

// Equipment Response DTO
export class EquipmentResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Equipped Dragon Lore AK-47 Skin to primary_weapon_skin slot',
  })
  message: string;

  @ApiProperty({
    description: 'Details of the newly equipped item',
    type: EquippedItemDto,
  })
  equippedItem: EquippedItemDto;

  @ApiProperty({
    description: 'Character profile ID',
    example: 'clp123456789',
  })
  profileId: string;

  @ApiProperty({
    description: 'Equipment slot that was used',
    example: 'primary_weapon_skin',
  })
  slot: string;
}