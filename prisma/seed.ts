import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order to respect foreign keys)
  await prisma.characterEquippedItem.deleteMany();
  await prisma.characterProfile.deleteMany();
  await prisma.itemFulfillment.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.userInventory.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.userWallet.deleteMany();
  await prisma.gameItemIntegration.deleteMany();
  await prisma.storeItem.deleteMany();
  await prisma.gameUserProfile.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create Games
  const games = await Promise.all([
    prisma.game.create({
      data: {
        name: 'Call of Duty: Warzone',
        code: 'COD_WZ',
        description: 'Battle royale game with custom skins and weapon modifications',
        isActive: true,
        gameConfig: {
          maxPlayers: 150,
          supportedPlatforms: ['PC', 'PlayStation', 'Xbox'],
          itemCategories: ['WEAPON_SKIN', 'CHARACTER_SKIN', 'EMOTE']
        }
      }
    }),
    prisma.game.create({
      data: {
        name: 'VALORANT',
        code: 'VAL',
        description: 'Tactical FPS with agent skins and weapon skins',
        isActive: true,
        gameConfig: {
          maxPlayers: 10,
          supportedPlatforms: ['PC'],
          itemCategories: ['WEAPON_SKIN', 'AGENT_SKIN', 'SPRAY']
        }
      }
    }),
    prisma.game.create({
      data: {
        name: 'Fortnite',
        code: 'FTN',
        description: 'Battle royale with building mechanics and cosmetic items',
        isActive: true,
        gameConfig: {
          maxPlayers: 100,
          supportedPlatforms: ['PC', 'PlayStation', 'Xbox', 'Mobile', 'Switch'],
          itemCategories: ['CHARACTER_SKIN', 'EMOTE', 'PICKAXE', 'GLIDER']
        }
      }
    })
  ]);

  console.log('🎮 Created games');

  // Create Store Items
  const storeItems = [];

  // Call of Duty items
  const codItems = await Promise.all([
    prisma.storeItem.create({
      data: {
        name: 'Dragon\'s Breath AK-47',
        description: 'Legendary weapon skin with fire effects and custom animation',
        price: 2500,
        category: 'SKIN',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[0].id,
        rarity: 'LEGENDARY',
        metadata: {
          weaponType: 'ASSAULT_RIFLE',
          effectType: 'FIRE',
          animated: true
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Ghost Operator Skin',
        description: 'Rare operator skin with tactical gear and night vision',
        price: 1800,
        category: 'SKIN',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[0].id,
        rarity: 'RARE',
        metadata: {
          operatorName: 'Ghost',
          faction: 'Coalition'
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Victory Dance Emote',
        description: 'Epic celebration emote for post-match victories',
        price: 800,
        category: 'UTILITY',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[0].id,
        rarity: 'EPIC',
        metadata: {
          duration: '3 seconds',
          category: 'CELEBRATION'
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Double XP Token',
        description: 'Consumable item that doubles XP gain for 1 hour',
        price: 500,
        category: 'CONSUMABLE',
        type: 'CONSUMABLE',
        deliveryType: 'FUNCTIONAL',
        gameId: games[0].id,
        rarity: 'COMMON',
        metadata: {
          duration: '1 hour',
          effect: 'DOUBLE_XP'
        }
      }
    })
  ]);

  // VALORANT items
  const valItems = await Promise.all([
    prisma.storeItem.create({
      data: {
        name: 'Prime Vandal',
        description: 'Mythic weapon skin with unique sound effects and finisher',
        price: 3500,
        category: 'SKIN',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[1].id,
        rarity: 'MYTHIC',
        metadata: {
          weaponType: 'RIFLE',
          collection: 'Prime',
          hasFinisher: true
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Reyna Vampire Skin',
        description: 'Epic agent skin with gothic theme and custom voicelines',
        price: 2200,
        category: 'SKIN',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[1].id,
        rarity: 'EPIC',
        metadata: {
          agentName: 'Reyna',
          theme: 'VAMPIRE'
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Radiant Buddy',
        description: 'Rare gun buddy charm that glows with radiant energy',
        price: 600,
        category: 'UTILITY',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[1].id,
        rarity: 'RARE',
        metadata: {
          type: 'GUN_BUDDY',
          effect: 'GLOW'
        }
      }
    })
  ]);

  // Fortnite items
  const ftnItems = await Promise.all([
    prisma.storeItem.create({
      data: {
        name: 'Cosmic Wanderer Skin',
        description: 'Legendary outfit with space theme and reactive effects',
        price: 2000,
        category: 'SKIN',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[2].id,
        rarity: 'LEGENDARY',
        metadata: {
          theme: 'SPACE',
          reactive: true,
          set: 'Cosmic'
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Stellar Pickaxe',
        description: 'Epic harvesting tool with cosmic particle effects',
        price: 1500,
        category: 'UTILITY',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[2].id,
        rarity: 'EPIC',
        metadata: {
          type: 'PICKAXE',
          effects: 'COSMIC_PARTICLES'
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'Floss Dance',
        description: 'Iconic dance emote that became a cultural phenomenon',
        price: 500,
        category: 'UTILITY',
        type: 'NON_CONSUMABLE',
        deliveryType: 'IN_GAME',
        gameId: games[2].id,
        rarity: 'UNCOMMON',
        metadata: {
          type: 'EMOTE',
          category: 'DANCE'
        }
      }
    })
  ]);

  // Platform-wide items
  const platformItems = await Promise.all([
    prisma.storeItem.create({
      data: {
        name: 'BattleBucks Pro Membership',
        description: 'Monthly subscription with exclusive benefits and discounts',
        price: 1000,
        category: 'DIGITAL_REWARD',
        type: 'CONSUMABLE',
        deliveryType: 'FUNCTIONAL',
        gameId: null, // Platform-wide
        rarity: 'LEGENDARY',
        metadata: {
          duration: '30 days',
          benefits: ['20% store discount', 'Exclusive items access', 'Priority support']
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: 'BattleBucks T-Shirt',
        description: 'Official BattleBucks merchandise - comfortable cotton t-shirt',
        price: 1500,
        category: 'PHYSICAL_MERCH',
        type: 'NON_CONSUMABLE',
        deliveryType: 'SHOPIFY',
        gameId: null,
        rarity: 'COMMON',
        metadata: {
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          color: 'Black',
          material: '100% Cotton'
        }
      }
    }),
    prisma.storeItem.create({
      data: {
        name: '1000 Gem Pack',
        description: 'Instant gem boost for your wallet',
        price: 0, // Free gems for demo
        category: 'DIGITAL_REWARD',
        type: 'CONSUMABLE',
        deliveryType: 'FUNCTIONAL',
        gameId: null,
        rarity: 'COMMON',
        metadata: {
          gemAmount: 1000,
          instant: true
        }
      }
    })
  ]);

  console.log('🛍️ Created store items');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.create({
    data: {
      username: 'DemoGamer',
      email: 'demo@battlebucks.com',
      password: hashedPassword
    }
  });

  // Create user wallet with starting gems
  await prisma.userWallet.create({
    data: {
      userId: demoUser.id,
      balance: 5000, // Starting with 5000 gems
      walletTransactions: {
        create: {
          type: 'CREDIT',
          amount: 5000,
          description: 'Welcome bonus',
          referenceId: 'WELCOME_BONUS'
        }
      }
    }
  });

  // Create character profiles for the demo user
  await Promise.all([
    prisma.characterProfile.create({
      data: {
        userId: demoUser.id,
        gameId: games[0].id, // COD
        name: 'Ghost_Warrior',
        isActive: true,
        metadata: {
          level: 45,
          favoriteWeapon: 'AK-47',
          playstyle: 'AGGRESSIVE'
        }
      }
    }),
    prisma.characterProfile.create({
      data: {
        userId: demoUser.id,
        gameId: games[1].id, // Valorant
        name: 'RadiantSniper',
        isActive: false,
        metadata: {
          rank: 'Diamond',
          mainAgent: 'Jett',
          favoriteMap: 'Ascent'
        }
      }
    }),
    prisma.characterProfile.create({
      data: {
        userId: demoUser.id,
        gameId: null, // Platform-wide
        name: 'BattleBucksChampion',
        isActive: true,
        metadata: {
          totalPurchases: 0,
          memberSince: new Date(),
          tier: 'BRONZE'
        }
      }
    })
  ]);

  // Create some demo purchases and inventory
  const demoPurchase = await prisma.purchase.create({
    data: {
      userId: demoUser.id,
      totalAmount: 800,
      status: 'COMPLETED',
      items: {
        create: {
          itemId: codItems[3].id, // Double XP Token
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500
        }
      }
    }
  });

  // Add purchased item to inventory
  await prisma.userInventory.create({
    data: {
      userId: demoUser.id,
      itemId: codItems[3].id,
      quantity: 1
    }
  });

  // Create wallet transaction for purchase
  const wallet = await prisma.userWallet.findUnique({
    where: { userId: demoUser.id }
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet!.id,
      type: 'DEBIT',
      amount: 500,
      description: 'Purchase: Double XP Token',
      referenceId: demoPurchase.id
    }
  });

  // Update wallet balance
  await prisma.userWallet.update({
    where: { userId: demoUser.id },
    data: { balance: 4500 }
  });

  console.log('👤 Created demo user with data');
  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('Demo User Credentials:');
  console.log('Email: demo@battlebucks.com');
  console.log('Password: demo123');
  console.log('Starting Gems: 4500 (after demo purchase)');
  console.log('');
  console.log(`Created ${games.length} games`);
  console.log('Created multiple store items');
  console.log('Created 1 demo user with wallet, characters, and sample purchase');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });