import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateCharacterProfileDto,
  UpdateCharacterProfileDto,
  CharacterProfileResponseDto,
  EquipItemDto,
  EquipmentResponseDto,
  CharacterProfilesListDto 
} from './character-profiles.dto';

@Injectable()
export class CharacterProfilesService {
  private readonly logger = new Logger(CharacterProfilesService.name);

  constructor(private prisma: PrismaService) {}

  async getCharacterProfiles(userId: string): Promise<CharacterProfilesListDto> {
    const profiles = await this.prisma.characterProfile.findMany({
      where: { userId },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        equippedItems: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                category: true,
                rarity: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            equippedItems: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });

    const profilesByGame = profiles.reduce((acc, profile) => {
      const gameKey = profile.gameId || 'platform-wide';
      if (!acc[gameKey]) {
        acc[gameKey] = [];
      }
      acc[gameKey].push(this.toCharacterProfileResponseDto(profile));
      return acc;
    }, {});

    return {
      profiles: profiles.map(profile => this.toCharacterProfileResponseDto(profile)),
      profilesByGame,
      totalProfiles: profiles.length,
      activeProfiles: profiles.filter(p => p.isActive).length,
    };
  }

  async createCharacterProfile(
    userId: string,
    createCharacterProfileDto: CreateCharacterProfileDto
  ): Promise<CharacterProfileResponseDto> {
    const { name, gameId, metadata } = createCharacterProfileDto;

    // Validate game exists if gameId provided
    if (gameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId, isActive: true },
      });

      if (!game) {
        throw new BadRequestException('Game not found or inactive');
      }
    }

    // Check for duplicate character names within the same game/platform
    const existingProfile = await this.prisma.characterProfile.findFirst({
      where: {
        userId,
        name,
        gameId: gameId || null,
      },
    });

    if (existingProfile) {
      const scope = gameId ? 'this game' : 'platform-wide';
      throw new ConflictException(`Character with name "${name}" already exists for ${scope}`);
    }

    // Create character profile
    const profile = await this.prisma.characterProfile.create({
      data: {
        userId,
        name,
        gameId,
        metadata,
        isActive: true, // First character for this game/platform is active by default
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        equippedItems: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                category: true,
                rarity: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Created character profile "${name}" for user ${userId}`);
    return this.toCharacterProfileResponseDto(profile);
  }

  async getCharacterProfile(userId: string, profileId: string): Promise<CharacterProfileResponseDto> {
    const profile = await this.prisma.characterProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        equippedItems: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                type: true,
                rarity: true,
                imageUrl: true,
                gameId: true,
              },
            },
          },
          orderBy: {
            equippedAt: 'desc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Character profile not found');
    }

    return this.toCharacterProfileResponseDto(profile);
  }

  async updateCharacterProfile(
    userId: string,
    profileId: string,
    updateCharacterProfileDto: UpdateCharacterProfileDto
  ): Promise<CharacterProfileResponseDto> {
    const { name, metadata } = updateCharacterProfileDto;

    // Check if character exists and belongs to user
    const existingProfile = await this.prisma.characterProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!existingProfile) {
      throw new NotFoundException('Character profile not found');
    }

    // Check for name conflicts if name is being changed
    if (name && name !== existingProfile.name) {
      const duplicateName = await this.prisma.characterProfile.findFirst({
        where: {
          userId,
          name,
          gameId: existingProfile.gameId,
          id: { not: profileId },
        },
      });

      if (duplicateName) {
        const scope = existingProfile.gameId ? 'this game' : 'platform-wide';
        throw new ConflictException(`Character with name "${name}" already exists for ${scope}`);
      }
    }

    // Update character profile
    const updatedProfile = await this.prisma.characterProfile.update({
      where: { id: profileId },
      data: {
        ...(name && { name }),
        ...(metadata && { metadata }),
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        equippedItems: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                category: true,
                rarity: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Updated character profile ${profileId} for user ${userId}`);
    return this.toCharacterProfileResponseDto(updatedProfile);
  }

  async deleteCharacterProfile(userId: string, profileId: string) {
    const profile = await this.prisma.characterProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Character profile not found');
    }

    // Delete character profile (cascading will remove equipped items)
    await this.prisma.characterProfile.delete({
      where: { id: profileId },
    });

    this.logger.log(`Deleted character profile ${profileId} for user ${userId}`);
    return { message: `Character profile "${profile.name}" deleted successfully` };
  }

  async activateCharacterProfile(userId: string, profileId: string) {
    const profile = await this.prisma.characterProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Character profile not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Deactivate other profiles for the same game/platform
      await tx.characterProfile.updateMany({
        where: {
          userId,
          gameId: profile.gameId,
          id: { not: profileId },
        },
        data: { isActive: false },
      });

      // Activate this profile
      await tx.characterProfile.update({
        where: { id: profileId },
        data: { isActive: true },
      });
    });

    this.logger.log(`Activated character profile ${profileId} for user ${userId}`);
    return { message: `Character profile "${profile.name}" activated successfully` };
  }

  async equipItem(
    userId: string,
    profileId: string,
    equipItemDto: EquipItemDto
  ): Promise<EquipmentResponseDto> {
    const { itemId, slot } = equipItemDto;

    return this.prisma.$transaction(async (tx) => {
      // Verify character profile ownership
      const profile = await tx.characterProfile.findFirst({
        where: {
          id: profileId,
          userId,
        },
        include: { game: true },
      });

      if (!profile) {
        throw new NotFoundException('Character profile not found');
      }

      // Verify user owns the item
      const inventoryItem = await tx.userInventory.findFirst({
        where: {
          userId,
          itemId,
          isConsumed: false,
        },
        include: {
          storeItem: true,
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException('Item not found in inventory or already consumed');
      }

      // Validate item compatibility with character's game
      await this.validateItemCompatibility(inventoryItem.storeItem, profile);

      // Check if item can be equipped (non-consumable items only)
      if (inventoryItem.storeItem.type === 'CONSUMABLE') {
        throw new BadRequestException('Consumable items cannot be equipped');
      }

      // Determine slot if not provided
      const equipmentSlot = slot || this.determineSlotFromItem(inventoryItem.storeItem);

      // Remove existing item from slot if present
      await tx.characterEquippedItem.deleteMany({
        where: {
          profileId,
          slot: equipmentSlot,
        },
      });

      // Remove item from other slots if already equipped
      await tx.characterEquippedItem.deleteMany({
        where: {
          profileId,
          itemId,
        },
      });

      // Equip new item
      const equippedItem = await tx.characterEquippedItem.create({
        data: {
          profileId,
          itemId,
          slot: equipmentSlot,
        },
        include: {
          storeItem: {
            select: {
              id: true,
              name: true,
              category: true,
              type: true,
              rarity: true,
              imageUrl: true,
            },
          },
        },
      });

      this.logger.log(`Equipped item ${itemId} to slot ${equipmentSlot} for character ${profileId}`);

      return {
        message: `Equipped ${inventoryItem.storeItem.name} to ${equipmentSlot} slot`,
        equippedItem: {
          id: equippedItem.id,
          itemId: equippedItem.itemId,
          slot: equippedItem.slot || equipmentSlot,
          equippedAt: equippedItem.equippedAt,
          storeItem: {
            ...equippedItem.storeItem,
            rarity: equippedItem.storeItem.rarity || undefined,
            imageUrl: equippedItem.storeItem.imageUrl || undefined,
          },
        },
        profileId,
        slot: equipmentSlot,
      };
    });
  }

  async unequipItem(userId: string, profileId: string, itemId: string) {
    // Verify character profile ownership
    const profile = await this.prisma.characterProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Character profile not found');
    }

    // Find and remove equipped item
    const equippedItem = await this.prisma.characterEquippedItem.findFirst({
      where: {
        profileId,
        itemId,
      },
      include: {
        storeItem: {
          select: { name: true },
        },
      },
    });

    if (!equippedItem) {
      throw new NotFoundException('Item not equipped to this character');
    }

    await this.prisma.characterEquippedItem.delete({
      where: { id: equippedItem.id },
    });

    this.logger.log(`Unequipped item ${itemId} from character ${profileId}`);
    return { 
      message: `Unequipped ${equippedItem.storeItem.name} from character`,
      slot: equippedItem.slot,
    };
  }

  async unequipSlot(userId: string, profileId: string, slot: string) {
    // Verify character profile ownership
    const profile = await this.prisma.characterProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException('Character profile not found');
    }

    // Find and remove item from slot
    const equippedItem = await this.prisma.characterEquippedItem.findFirst({
      where: {
        profileId,
        slot,
      },
      include: {
        storeItem: {
          select: { name: true },
        },
      },
    });

    if (!equippedItem) {
      throw new NotFoundException('No item equipped in this slot');
    }

    await this.prisma.characterEquippedItem.delete({
      where: { id: equippedItem.id },
    });

    this.logger.log(`Cleared slot ${slot} for character ${profileId}`);
    return { 
      message: `Cleared ${slot} slot`,
      itemName: equippedItem.storeItem.name,
    };
  }

  private async validateItemCompatibility(storeItem: any, profile: any) {
    // Platform-wide items can be equipped to any character
    if (!storeItem.gameId) {
      return;
    }

    // Game-specific items can only be equipped to characters of the same game
    if (storeItem.gameId !== profile.gameId) {
      const itemGame = storeItem.gameId;
      const profileGame = profile.gameId || 'platform-wide';
      throw new BadRequestException(
        `Item is for ${itemGame} but character is for ${profileGame}`
      );
    }
  }

  private determineSlotFromItem(storeItem: any): string {
    const category = storeItem.category;
    const metadata = storeItem.gameSpecificData || {};

    // Use game-specific slot if provided
    if (metadata.slot) {
      return metadata.slot;
    }

    // Default slot mapping based on category
    const slotMapping = {
      SKIN: metadata.weaponClass ? `${metadata.weaponClass}_skin` : 'primary_skin',
      UTILITY: 'utility',
      CONSUMABLE: 'consumable', // Won't be reached due to earlier check
      DIGITAL_REWARD: 'reward',
      PHYSICAL_MERCH: 'merchandise',
    };

    return slotMapping[category] || 'misc';
  }

  private toCharacterProfileResponseDto(profile: any): CharacterProfileResponseDto {
    return {
      id: profile.id,
      name: profile.name,
      isActive: profile.isActive,
      gameId: profile.gameId,
      game: profile.game,
      metadata: profile.metadata,
      equippedItems: profile.equippedItems?.map(item => ({
        id: item.id,
        itemId: item.itemId,
        slot: item.slot,
        equippedAt: item.equippedAt,
        storeItem: item.storeItem,
      })) || [],
      equippedItemsCount: profile._count?.equippedItems || profile.equippedItems?.length || 0,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}