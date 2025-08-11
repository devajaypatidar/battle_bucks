# BattleBucks Web Client

A comprehensive HTML/CSS/JavaScript client application that demonstrates the complete integration of the BattleBucks Gaming Platform API. This client showcases all the features and functionality of the BattleBucks ecosystem.

## 🎮 Features Overview

### Authentication System
- **User Registration**: Create new accounts with email, username, and secure passwords
- **User Login**: Secure JWT-based authentication
- **Token Refresh**: Automatic token renewal for seamless sessions
- **Session Management**: Persistent login sessions with secure token storage

### Dashboard
- **User Statistics**: Real-time display of gems, inventory items, characters, and purchases
- **Recent Activity**: Shows latest purchases and transactions
- **Featured Items**: Displays highlighted store items
- **Quick Navigation**: Easy access to all platform features

### Store Management
- **Browse Items**: View all available store items with pagination
- **Advanced Filtering**: Filter by category, rarity, and search functionality
- **Item Details**: Comprehensive item information including metadata
- **Purchase System**: Secure gem-based purchasing with balance validation
- **Featured Showcase**: Highlighted premium and rare items

### Inventory System
- **Inventory Overview**: Complete list of owned items with quantities
- **Usage Statistics**: Total items, quantities, and value calculations
- **Item Management**: Use consumable items and view item details
- **Category Organization**: Items organized by type and category
- **Real-time Updates**: Inventory updates after purchases and usage

### Character Profiles
- **Character Creation**: Create platform-wide or game-specific characters
- **Character Management**: Edit, delete, and activate character profiles
- **Equipment System**: Equip items to characters (framework ready)
- **Multi-game Support**: Support for different gaming platforms
- **Profile Customization**: Metadata support for avatar settings and preferences

### Purchase History
- **Transaction History**: Complete record of all purchases
- **Purchase Analytics**: Summary statistics including favorite categories
- **Order Details**: Detailed breakdown of each purchase
- **Status Tracking**: Monitor purchase and fulfillment status

## 🚀 Getting Started

### Prerequisites
- BattleBucks API server running on `http://localhost:3001`
- Modern web browser with JavaScript enabled
- Internet connection for Font Awesome icons

### Installation

1. **Start the BattleBucks API Server**:
   ```bash
   cd battle_bucks
   npm run start:dev
   ```

2. **Open the Client Application**:
   - Navigate to the `client` directory
   - Open `index.html` in your web browser
   - Or serve it through a local web server:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js
   npx serve .
   
   # Using Live Server (VS Code extension)
   # Right-click on index.html and select "Open with Live Server"
   ```

3. **Access the Application**:
   - Open your browser to `http://localhost:8080` (or the appropriate URL)
   - The application will automatically connect to the API at `http://localhost:3001`

## 📱 Usage Guide

### First Time Setup

1. **Registration**:
   - Click the "Register" tab on the login screen
   - Enter a unique username, valid email, and secure password
   - Password must meet complexity requirements (8+ chars, mixed case, numbers, symbols)
   - Click "Create Account" to register and automatically log in

2. **Initial Login**:
   - Use the "Login" tab with your email and password
   - Successful login grants you 1000 starting gems
   - You'll be redirected to the dashboard

### Navigation

The application features a clean, responsive navigation bar with the following sections:

- **🏠 Dashboard**: Overview and statistics
- **🏪 Store**: Browse and purchase items
- **📦 Inventory**: Manage owned items
- **🥷 Characters**: Create and manage character profiles
- **🧾 Purchases**: View transaction history

### Core Workflows

#### Shopping Experience
1. Navigate to the **Store** section
2. Use filters to find specific items:
   - **Category**: Skins, Digital Rewards, Physical Merch, Utilities, Consumables
   - **Rarity**: Common to Mythic level items
   - **Search**: Find items by name
3. Click on items to view detailed information
4. Click "Buy Now" to purchase items (requires sufficient gems)
5. Confirm purchase in the modal dialog

#### Inventory Management
1. Visit the **Inventory** section to see all owned items
2. View inventory summary with total items, quantities, and value
3. Use consumable items by clicking "Use Item"
4. View detailed item information
5. Track usage history for consumable items

#### Character System
1. Go to the **Characters** section
2. Click "Create Character" to add new profiles
3. Choose between platform-wide or game-specific characters
4. Activate characters to set them as your primary profile
5. Edit or delete existing characters as needed

#### Purchase Tracking
1. Access the **Purchases** section for complete transaction history
2. View purchase summary statistics
3. Check individual purchase details and status
4. Monitor fulfillment progress

## 🛠 Technical Implementation

### Architecture
- **Frontend**: Vanilla HTML5, CSS3, and ES6+ JavaScript
- **Styling**: Custom CSS with responsive design and animations
- **API Communication**: RESTful API integration with JWT authentication
- **State Management**: Client-side application state with localStorage persistence

### Key Components

#### Authentication Manager
- JWT token handling with automatic refresh
- Secure token storage in localStorage
- Session validation and automatic logout
- Error handling for authentication failures

#### API Client
- Centralized HTTP request handling
- Automatic token attachment to authenticated requests
- Error handling and user feedback
- Request/response interceptors for token refresh

#### UI Components
- Modal dialogs for purchases and character creation
- Toast notifications for user feedback
- Loading states and progress indicators
- Responsive navigation with mobile support

#### Data Management
- Real-time data fetching and updates
- Pagination support for large datasets
- Client-side filtering and searching
- Optimistic UI updates

### Responsive Design
- **Desktop**: Full-featured interface with sidebar navigation
- **Tablet**: Adapted layout with collapsible navigation
- **Mobile**: Touch-friendly interface with hamburger menu
- **Cross-browser**: Compatible with modern browsers

## 🎨 Customization

### Theming
The application uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #1e3c72;
  --accent-color: #ffd700;
  --text-color: #ffffff;
  --card-background: rgba(255, 255, 255, 0.1);
}
```

### Configuration
Update the API base URL in `app.js`:

```javascript
this.baseURL = 'http://localhost:3001/api/v1'; // Change this to your API URL
```

## 🔧 API Integration

### Endpoints Used

The client integrates with all major BattleBucks API endpoints:

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

#### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

#### Store Operations
- `GET /store/items` - Browse store items (with filtering and pagination)
- `GET /store/items/:id` - Get item details
- `GET /store/featured` - Get featured items
- `GET /store/categories` - Get store categories

#### Purchase System
- `POST /purchases` - Create new purchase
- `GET /purchases/history` - Get purchase history
- `GET /purchases/summary` - Get purchase statistics
- `GET /purchases/:id` - Get purchase details

#### Inventory Management
- `GET /inventory` - Get user inventory
- `GET /inventory/summary` - Get inventory statistics
- `GET /inventory/:itemId` - Get specific inventory item
- `POST /inventory/:itemId/use` - Use consumable item

#### Character Profiles
- `GET /characters` - Get character profiles
- `POST /characters` - Create character profile
- `GET /characters/:id` - Get character details
- `PUT /characters/:id` - Update character profile
- `DELETE /characters/:id` - Delete character profile
- `PUT /characters/:id/activate` - Activate character

### Error Handling
- Network error recovery
- Token expiration handling
- User-friendly error messages
- Retry mechanisms for failed requests

## 🧪 Testing the Integration

### Test Scenarios

1. **User Registration and Login**:
   - Register with valid credentials
   - Login with registered account
   - Verify 1000 starting gems

2. **Store Browsing and Purchasing**:
   - Browse different categories
   - Filter by rarity levels
   - Search for specific items
   - Purchase items with sufficient gems
   - Attempt purchase without sufficient gems

3. **Inventory Management**:
   - View purchased items in inventory
   - Use consumable items
   - Check inventory statistics

4. **Character Management**:
   - Create platform-wide characters
   - Create game-specific characters
   - Activate different characters
   - Edit and delete characters

5. **Purchase History**:
   - Review transaction history
   - Check purchase statistics
   - Verify purchase details

### Demo Data
The application works with any data provided by the API. For testing purposes, you can:
- Create store items through the API documentation at `/api/docs`
- Purchase items to populate inventory
- Create multiple characters for testing
- Use consumable items to test usage tracking

## 🚀 Deployment

### Production Deployment
1. Update the API base URL in `app.js` to your production API endpoint
2. Optimize assets (minify CSS/JS, compress images)
3. Serve through a web server (Apache, Nginx, or CDN)
4. Enable HTTPS for secure token transmission
5. Configure proper CORS settings on the API server

### Environment Configuration
```javascript
// Development
this.baseURL = 'http://localhost:3001/api/v1';

// Production
this.baseURL = 'https://api.battlebucks.com/api/v1';
```

## 🤝 Contributing

This client application serves as a comprehensive reference implementation for integrating with the BattleBucks API. Feel free to:
- Extend functionality for new API features
- Improve the user interface and user experience
- Add new gaming platform integrations
- Enhance mobile responsiveness
- Optimize performance and loading times

## 📄 License

This client application is provided as a demonstration and reference implementation for the BattleBucks Gaming Platform API.

---

**Built with ❤️ for the BattleBucks Gaming Community**

For API documentation, visit: `http://localhost:3001/api/docs`