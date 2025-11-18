# BattleBucks Gaming Platform - Demo Guide

## 🚀 Quick Start

### 1. Start the Server

```bash
cd E:\Development\battleBucks\battle_bucks
npm run start:dev
```

### 2. Launch the Client

Open `client/launch.html` in your browser or navigate directly to `client/index.html`

### 3. Demo Account

- **Email**: demo@battlebucks.com
- **Password**: demo123
- **Starting Gems**: 4500

## 🎮 Features Demonstrated

### ✅ Completed Features

1. **User Authentication**
   - Registration and login system
   - JWT token-based authentication
   - Automatic token refresh
   - Secure logout functionality

2. **Store System**
   - Browse game items from multiple games (COD, VALORANT, Fortnite)
   - Platform-wide items (merchandise, memberships)
   - Item filtering by category and rarity
   - Search functionality
   - Pagination support

3. **Inventory Management**
   - View owned items
   - Use consumable items
   - Track item quantities and usage status

4. **Purchase System**
   - Buy items with gems
   - Purchase history tracking
   - Transaction summary statistics

5. **Character Profiles**
   - Create game-specific character profiles
   - Activate/deactivate characters
   - Character management interface

6. **Responsive Design**
   - Mobile-friendly interface
   - Dark theme with gaming aesthetics
   - Modern UI with smooth animations

### 🎯 Available Games & Items

#### Call of Duty: Warzone

- Dragon's Breath AK-47 (Legendary) - 2500 gems
- Ghost Operator Skin (Rare) - 1800 gems
- Victory Dance Emote (Epic) - 800 gems
- Double XP Token (Common) - 500 gems

#### VALORANT

- Prime Vandal (Mythic) - 3500 gems
- Reyna Vampire Skin (Epic) - 2200 gems
- Radiant Buddy (Rare) - 600 gems

#### Fortnite

- Cosmic Wanderer Skin (Legendary) - 2000 gems
- Stellar Pickaxe (Epic) - 1500 gems
- Floss Dance (Uncommon) - 500 gems

#### Platform-Wide Items

- BattleBucks Pro Membership (Legendary) - 1000 gems
- BattleBucks T-Shirt (Common) - 1500 gems
- 1000 Gem Pack (Common) - FREE for demo

## 🔧 Technical Details

### Backend (NestJS)

- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **API Documentation**: Available at http://localhost:3000/api/docs
- **Security**: Helmet, CORS, input validation

### Frontend (Vanilla JS)

- **Framework**: Pure JavaScript (no external dependencies)
- **Styling**: Custom CSS with modern design
- **Architecture**: Class-based component structure
- **Features**: Responsive design, error handling, loading states

### Database Schema

- **Users**: Authentication and profile management
- **Games**: Multi-game support system
- **Store Items**: Flexible item categorization
- **Purchases**: Complete transaction tracking
- **Inventory**: User item ownership
- **Characters**: Game-specific profiles
- **Wallet**: Gem balance and transactions

## 🌐 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/logout` - User logout

### Store

- `GET /api/v1/store/items` - List store items
- `GET /api/v1/store/items/:id` - Get item details
- `GET /api/v1/store/featured` - Featured items
- `GET /api/v1/store/categories` - Item categories

### Purchases

- `POST /api/v1/purchases` - Create purchase
- `GET /api/v1/purchases/history` - Purchase history
- `GET /api/v1/purchases/summary` - Purchase statistics

### Inventory

- `GET /api/v1/inventory` - User inventory
- `GET /api/v1/inventory/summary` - Inventory summary
- `POST /api/v1/inventory/:itemId/use` - Use consumable item

### Characters

- `GET /api/v1/characters` - List characters
- `POST /api/v1/characters` - Create character
- `PUT /api/v1/characters/:id/activate` - Activate character
- `DELETE /api/v1/characters/:id` - Delete character

## 🎨 UI Components

### Dashboard

- Statistics cards showing gems, items, characters, purchases
- Recent purchase history
- Featured store items
- Quick navigation

### Store

- Item grid with images, prices, and rarity indicators
- Filtering by category and rarity
- Search functionality
- Purchase modal with confirmation

### Inventory

- Item grid showing owned items
- Usage tracking for consumables
- Item details modal
- Inventory summary statistics

### Characters

- Character profile cards
- Creation and management interface
- Activation status indicators
- Game-specific organization

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet middleware)

## 📱 Responsive Design

- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements
- Optimized performance on all devices

## 🚀 Future Enhancements

1. **Real Game Integration**
   - API connections to actual games
   - Item delivery to game inventories

2. **Payment Processing**
   - Credit card payments
   - PayPal integration
   - Gem purchase system

3. **Social Features**
   - Friend system
   - Trading marketplace
   - Achievement system

4. **Advanced Analytics**
   - Purchase analytics
   - User behavior tracking
   - Business intelligence dashboard

## 🛠️ Development Commands

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema to database
npx ts-node prisma/seed.ts  # Seed demo data
```

## 📊 Demo Data

The system includes pre-seeded data:

- 3 Games (COD, VALORANT, Fortnite)
- 13 Store items across all categories
- 1 Demo user with complete profile
- Sample purchase and inventory data
- Character profiles for each game

## 🎯 Testing the Demo

1. **Login**: Use the demo credentials to access the platform
2. **Browse Store**: Explore items from different games
3. **Make Purchase**: Try buying items with your gems
4. **View Inventory**: Check your owned items
5. **Use Items**: Test consumable item functionality
6. **Create Characters**: Add new character profiles
7. **View History**: Check purchase and transaction history

The demo showcases a complete gaming marketplace platform with modern web technologies and a professional user experience.


changing this thing  to check the pull 

checking the PR Name changing again 
chcking vbersion 2 


this is the changes in the main branch commit now another commit which is ahead of new_branch 