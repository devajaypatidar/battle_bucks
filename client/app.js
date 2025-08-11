// BattleBucks Client Application
class BattleBucksApp {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.token = localStorage.getItem('battleBucksToken');
        this.refreshToken = localStorage.getItem('battleBucksRefreshToken');
        this.user = null;
        this.currentPage = 'dashboard';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.initializeNavigation();
    }

    // Authentication Management
    checkAuthStatus() {
        if (this.token) {
            this.validateToken()
                .then(valid => {
                    if (valid) {
                        this.showMainApp();
                        this.loadUserProfile();
                        this.navigateToPage('dashboard');
                    } else {
                        this.logout();
                    }
                })
                .catch(() => this.logout());
        } else {
            this.showAuthPage();
        }
    }

    async validateToken() {
        try {
            const response = await this.makeRequest('/api/v1/users/profile', 'GET');
            this.user = response;
            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    async login(email, password) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            this.token = data.accessToken;
            this.refreshToken = data.refreshToken;
            this.user = data.user;

            localStorage.setItem('battleBucksToken', this.token);
            localStorage.setItem('battleBucksRefreshToken', this.refreshToken);

            this.hideLoading();
            this.showMainApp();
            this.updateUserDisplay();
            this.navigateToPage('dashboard');
            this.showToast('Login successful!', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast('Login failed: ' + error.message, 'error');
        }
    }

    async register(username, email, password) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            this.token = data.accessToken;
            this.refreshToken = data.refreshToken;
            this.user = data.user;

            localStorage.setItem('battleBucksToken', this.token);
            localStorage.setItem('battleBucksRefreshToken', this.refreshToken);

            this.hideLoading();
            this.showMainApp();
            this.updateUserDisplay();
            this.navigateToPage('dashboard');
            this.showToast('Registration successful! Welcome to BattleBucks!', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast('Registration failed: ' + error.message, 'error');
        }
    }

    logout() {
        localStorage.removeItem('battleBucksToken');
        localStorage.removeItem('battleBucksRefreshToken');
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        this.showAuthPage();
    }

    // HTTP Request Helper
    async makeRequest(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, config);

        if (response.status === 401) {
            // Token expired, try to refresh
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.token}`;
                const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
                    ...config,
                    headers,
                });
                if (!retryResponse.ok) {
                    const errorData = await retryResponse.json();
                    throw new Error(errorData.message || `HTTP ${retryResponse.status}`);
                }
                return await retryResponse.json();
            } else {
                this.logout();
                throw new Error('Session expired');
            }
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (!response.ok) return false;

            const data = await response.json();
            this.token = data.accessToken;
            this.refreshToken = data.refreshToken;
            localStorage.setItem('battleBucksToken', this.token);
            localStorage.setItem('battleBucksRefreshToken', this.refreshToken);
            return true;
        } catch (error) {
            return false;
        }
    }

    // UI Management
    showAuthPage() {
        document.getElementById('authPage').style.display = 'block';
        document.querySelector('.navbar').style.display = 'none';
        this.hideAllPages();
        document.getElementById('authPage').style.display = 'block';
    }

    showMainApp() {
        document.getElementById('authPage').style.display = 'none';
        document.querySelector('.navbar').style.display = 'block';
    }

    hideAllPages() {
        document.querySelectorAll('.page').forEach(page => {
            if (page.id !== 'authPage') {
                page.style.display = 'none';
            }
        });
    }

    navigateToPage(pageName) {
        this.hideAllPages();
        document.getElementById(pageName + 'Page').style.display = 'block';
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
        
        this.currentPage = pageName;
        this.loadPageData(pageName);
    }

    updateUserDisplay() {
        if (this.user) {
            document.getElementById('usernameDisplay').textContent = this.user.username;
            document.getElementById('gemBalance').textContent = `${this.user.gemBalance} Gems`;
        }
    }

    // Data Loading Functions
    async loadPageData(page) {
        try {
            switch (page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'store':
                    await this.loadStore();
                    break;
                case 'inventory':
                    await this.loadInventory();
                    break;
                case 'characters':
                    await this.loadCharacters();
                    break;
                case 'purchases':
                    await this.loadPurchases();
                    break;
            }
        } catch (error) {
            this.showToast('Error loading page data: ' + error.message, 'error');
        }
    }

    async loadUserProfile() {
        try {
            this.user = await this.makeRequest('/api/v1/users/profile');
            this.updateUserDisplay();
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    async loadDashboard() {
        try {
            // Load dashboard stats
            const [inventorySummary, purchaseSummary, featuredItems, recentPurchases] = await Promise.all([
                this.makeRequest('/api/v1/inventory/summary'),
                this.makeRequest('/api/v1/purchases/summary'),
                this.makeRequest('/api/v1/store/featured'),
                this.makeRequest('/api/v1/purchases/history?limit=5')
            ]);

            // Update dashboard stats
            document.getElementById('dashGemBalance').textContent = this.user.gemBalance;
            document.getElementById('dashInventoryCount').textContent = inventorySummary.totalItems;
            document.getElementById('dashPurchaseCount').textContent = purchaseSummary.totalPurchases;

            // Load character count
            const characters = await this.makeRequest('/api/v1/characters');
            document.getElementById('dashCharacterCount').textContent = characters.totalProfiles;

            // Display featured items
            this.displayFeaturedItems(featuredItems);
            
            // Display recent purchases
            this.displayRecentPurchases(recentPurchases.purchases || []);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Error loading dashboard data', 'error');
        }
    }

    async loadStore(page = 1, filters = {}) {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '12',
                ...filters
            });

            const storeData = await this.makeRequest(`/api/v1/store/items?${queryParams}`);
            this.displayStoreItems(storeData.items);
            this.displayPagination(storeData.pagination, 'storePagination');
        } catch (error) {
            console.error('Error loading store:', error);
            this.showToast('Error loading store items', 'error');
        }
    }

    async loadInventory() {
        try {
            const [inventory, inventorySummary] = await Promise.all([
                this.makeRequest('/api/v1/inventory'),
                this.makeRequest('/api/v1/inventory/summary')
            ]);

            this.displayInventorySummary(inventorySummary);
            this.displayInventoryItems(inventory.items);
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showToast('Error loading inventory', 'error');
        }
    }

    async loadCharacters() {
        try {
            const charactersData = await this.makeRequest('/api/v1/characters');
            this.displayCharacters(charactersData.profiles);
        } catch (error) {
            console.error('Error loading characters:', error);
            this.showToast('Error loading characters', 'error');
        }
    }

    async loadPurchases() {
        try {
            const [purchaseHistory, purchaseSummary] = await Promise.all([
                this.makeRequest('/api/v1/purchases/history'),
                this.makeRequest('/api/v1/purchases/summary')
            ]);

            this.displayPurchaseSummary(purchaseSummary);
            this.displayPurchaseHistory(purchaseHistory.purchases);
        } catch (error) {
            console.error('Error loading purchases:', error);
            this.showToast('Error loading purchase history', 'error');
        }
    }

    // Display Functions
    displayFeaturedItems(items) {
        const container = document.getElementById('featuredItems');
        if (!items || items.length === 0) {
            container.innerHTML = '<p>No featured items available</p>';
            return;
        }

        container.innerHTML = items.slice(0, 4).map(item => `
            <div class="item-card" onclick="app.showItemDetail('${item.id}')">
                <div class="item-image">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}">` : '<i class="fas fa-image"></i>'}
                </div>
                <div class="item-content">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.price} Gems</div>
                    <div class="item-rarity rarity-${item.rarity?.toLowerCase() || 'common'}">${item.rarity || 'Common'}</div>
                </div>
            </div>
        `).join('');
    }

    displayRecentPurchases(purchases) {
        const container = document.getElementById('recentPurchases');
        if (!purchases || purchases.length === 0) {
            container.innerHTML = '<p>No recent purchases</p>';
            return;
        }

        container.innerHTML = purchases.map(purchase => `
            <div class="purchase-item">
                <div class="purchase-details">
                    <h4>Purchase #${purchase.id.slice(-8)}</h4>
                    <p>${new Date(purchase.createdAt).toLocaleDateString()} - ${purchase.items.length} item(s)</p>
                </div>
                <div class="purchase-amount">${purchase.totalAmount} Gems</div>
            </div>
        `).join('');
    }

    displayStoreItems(items) {
        const container = document.getElementById('storeItems');
        if (!items || items.length === 0) {
            container.innerHTML = '<p>No items available</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-image">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}">` : '<i class="fas fa-image"></i>'}
                </div>
                <div class="item-content">
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description || ''}</div>
                    <div class="item-meta">
                        <div class="item-price">${item.price} Gems</div>
                        <div class="item-rarity rarity-${item.rarity?.toLowerCase() || 'common'}">${item.rarity || 'Common'}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-primary" onclick="app.showPurchaseModal('${item.id}')">
                            <i class="fas fa-shopping-cart"></i> Buy Now
                        </button>
                        <button class="btn-secondary" onclick="app.showItemDetail('${item.id}')">
                            <i class="fas fa-info"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayInventorySummary(summary) {
        const container = document.getElementById('inventorySummary');
        container.innerHTML = `
            <div class="summary-stat">
                <h4>${summary.totalItems}</h4>
                <p>Total Items</p>
            </div>
            <div class="summary-stat">
                <h4>${summary.totalQuantity}</h4>
                <p>Total Quantity</p>
            </div>
            <div class="summary-stat">
                <h4>${summary.totalValue}</h4>
                <p>Total Value (Gems)</p>
            </div>
            <div class="summary-stat">
                <h4>${summary.lastAcquiredItem || 'None'}</h4>
                <p>Latest Item</p>
            </div>
        `;
    }

    displayInventoryItems(items) {
        const container = document.getElementById('inventoryItems');
        if (!items || items.length === 0) {
            container.innerHTML = '<p>No items in inventory</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-image">
                    ${item.storeItem.imageUrl ? `<img src="${item.storeItem.imageUrl}" alt="${item.storeItem.name}">` : '<i class="fas fa-image"></i>'}
                </div>
                <div class="item-content">
                    <div class="item-name">${item.storeItem.name}</div>
                    <div class="item-description">Quantity: ${item.quantity}</div>
                    <div class="item-meta">
                        <div class="item-price">${item.storeItem.price} Gems</div>
                        <div class="item-rarity rarity-${item.storeItem.rarity?.toLowerCase() || 'common'}">${item.storeItem.rarity || 'Common'}</div>
                    </div>
                    <div class="item-actions">
                        ${item.storeItem.type === 'CONSUMABLE' && !item.isConsumed ? 
                            `<button class="btn-primary" onclick="app.useItem('${item.itemId}')">
                                <i class="fas fa-magic"></i> Use Item
                            </button>` : ''
                        }
                        <button class="btn-secondary" onclick="app.showItemDetail('${item.itemId}')">
                            <i class="fas fa-info"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayCharacters(characters) {
        const container = document.getElementById('characterProfiles');
        if (!characters || characters.length === 0) {
            container.innerHTML = '<div class="loading">No characters created yet. Create your first character!</div>';
            return;
        }

        container.innerHTML = characters.map(character => `
            <div class="character-card ${character.isActive ? 'active' : ''}">
                <div class="character-avatar">
                    <i class="fas fa-user-ninja"></i>
                </div>
                <div class="character-name">${character.name}</div>
                <div class="character-game">${character.game ? character.game.name : 'Platform-wide'}</div>
                <div class="character-stats">
                    <div class="character-stat">
                        <div class="character-stat-value">${character.equippedItemsCount || 0}</div>
                        <div>Equipped</div>
                    </div>
                    <div class="character-stat">
                        <div class="character-stat-value">${character.isActive ? 'Active' : 'Inactive'}</div>
                        <div>Status</div>
                    </div>
                </div>
                <div class="character-actions">
                    ${!character.isActive ? 
                        `<button class="btn-primary" onclick="app.activateCharacter('${character.id}')">
                            <i class="fas fa-check"></i> Activate
                        </button>` : ''
                    }
                    <button class="btn-secondary" onclick="app.editCharacter('${character.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="app.deleteCharacter('${character.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayPurchaseSummary(summary) {
        const container = document.getElementById('purchaseSummary');
        container.innerHTML = `
            <div class="summary-stat">
                <h4>${summary.totalPurchases}</h4>
                <p>Total Purchases</p>
            </div>
            <div class="summary-stat">
                <h4>${summary.totalGemsSpent}</h4>
                <p>Gems Spent</p>
            </div>
            <div class="summary-stat">
                <h4>${summary.totalItemsPurchased}</h4>
                <p>Items Purchased</p>
            </div>
            <div class="summary-stat">
                <h4>${summary.favoriteCategory || 'None'}</h4>
                <p>Favorite Category</p>
            </div>
        `;
    }

    displayPurchaseHistory(purchases) {
        const container = document.getElementById('purchaseHistory');
        if (!purchases || purchases.length === 0) {
            container.innerHTML = '<p>No purchase history available</p>';
            return;
        }

        container.innerHTML = purchases.map(purchase => `
            <div class="purchase-item">
                <div class="purchase-details">
                    <h4>Purchase #${purchase.id.slice(-8)}</h4>
                    <p>${new Date(purchase.createdAt).toLocaleDateString()} - ${purchase.items.length} item(s)</p>
                    <p>Status: <strong>${purchase.status}</strong></p>
                </div>
                <div class="purchase-amount">${purchase.totalAmount} Gems</div>
            </div>
        `).join('');
    }

    displayPagination(pagination, containerId) {
        const container = document.getElementById(containerId);
        if (!pagination || pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button ${pagination.hasPrev ? '' : 'disabled'} 
                    onclick="app.changePage(${pagination.page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i === pagination.page) {
                paginationHTML += `<button class="active">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="app.changePage(${i})">${i}</button>`;
            }
        }
        
        // Next button
        paginationHTML += `
            <button ${pagination.hasNext ? '' : 'disabled'} 
                    onclick="app.changePage(${pagination.page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = paginationHTML;
    }

    // Action Functions
    async showPurchaseModal(itemId) {
        try {
            const item = await this.makeRequest(`/api/v1/store/items/${itemId}`);
            const modal = document.getElementById('purchaseModal');
            const detailsContainer = document.getElementById('purchaseDetails');

            detailsContainer.innerHTML = `
                <div class="purchase-item-details">
                    <div class="item-image">
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.description || ''}</p>
                        <div class="item-price">Price: <strong>${item.price} Gems</strong></div>
                        <div class="item-rarity rarity-${item.rarity?.toLowerCase() || 'common'}">${item.rarity || 'Common'}</div>
                        <p>Your Balance: <strong>${this.user.gemBalance} Gems</strong></p>
                        ${this.user.gemBalance < item.price ? 
                            '<p style="color: #ff4444;">Insufficient gems!</p>' : 
                            '<p style="color: #44ff44;">Purchase available</p>'
                        }
                    </div>
                </div>
            `;

            modal.classList.add('active');

            // Set up purchase confirmation
            document.getElementById('confirmPurchaseBtn').onclick = () => {
                if (this.user.gemBalance >= item.price) {
                    this.purchaseItem(itemId);
                } else {
                    this.showToast('Insufficient gems!', 'error');
                }
            };
        } catch (error) {
            this.showToast('Error loading item details', 'error');
        }
    }

    async purchaseItem(itemId) {
        try {
            this.showLoading();
            await this.makeRequest('/api/v1/purchases', 'POST', {
                items: [{ itemId, quantity: 1 }]
            });

            this.hideLoading();
            this.closeModal('purchaseModal');
            this.showToast('Purchase successful!', 'success');
            
            // Refresh user data and current page
            await this.loadUserProfile();
            this.loadPageData(this.currentPage);
        } catch (error) {
            this.hideLoading();
            this.showToast('Purchase failed: ' + error.message, 'error');
        }
    }

    async useItem(itemId) {
        try {
            const result = await this.makeRequest(`/api/v1/inventory/${itemId}/use`, 'POST');
            this.showToast(result.message, 'success');
            
            // Refresh inventory
            if (this.currentPage === 'inventory') {
                await this.loadInventory();
            }
            await this.loadUserProfile();
        } catch (error) {
            this.showToast('Failed to use item: ' + error.message, 'error');
        }
    }

    async showItemDetail(itemId) {
        try {
            const item = await this.makeRequest(`/api/v1/store/items/${itemId}`);
            const modal = document.getElementById('itemDetailModal');
            const content = document.getElementById('itemDetailContent');

            content.innerHTML = `
                <div class="item-detail">
                    <div class="item-image">
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <p>${item.description || 'No description available'}</p>
                        <div class="item-meta">
                            <p><strong>Price:</strong> ${item.price} Gems</p>
                            <p><strong>Category:</strong> ${item.category}</p>
                            <p><strong>Type:</strong> ${item.type}</p>
                            <p><strong>Rarity:</strong> ${item.rarity || 'Common'}</p>
                            <p><strong>Delivery:</strong> ${item.deliveryType}</p>
                            ${item.game ? `<p><strong>Game:</strong> ${item.game.name}</p>` : '<p><strong>Game:</strong> Platform-wide</p>'}
                        </div>
                    </div>
                </div>
            `;

            modal.classList.add('active');
        } catch (error) {
            this.showToast('Error loading item details', 'error');
        }
    }

    showCreateCharacterModal() {
        document.getElementById('characterModalTitle').textContent = 'Create Character';
        document.getElementById('characterForm').reset();
        document.getElementById('characterModal').classList.add('active');
    }

    async createCharacter(name, gameId) {
        try {
            this.showLoading();
            const characterData = { name };
            if (gameId) characterData.gameId = gameId;

            await this.makeRequest('/api/v1/characters', 'POST', characterData);
            
            this.hideLoading();
            this.closeModal('characterModal');
            this.showToast('Character created successfully!', 'success');
            
            if (this.currentPage === 'characters') {
                await this.loadCharacters();
            }
        } catch (error) {
            this.hideLoading();
            this.showToast('Failed to create character: ' + error.message, 'error');
        }
    }

    async activateCharacter(characterId) {
        try {
            await this.makeRequest(`/api/v1/characters/${characterId}/activate`, 'PUT');
            this.showToast('Character activated!', 'success');
            
            if (this.currentPage === 'characters') {
                await this.loadCharacters();
            }
        } catch (error) {
            this.showToast('Failed to activate character: ' + error.message, 'error');
        }
    }

    async deleteCharacter(characterId) {
        if (!confirm('Are you sure you want to delete this character?')) return;

        try {
            await this.makeRequest(`/api/v1/characters/${characterId}`, 'DELETE');
            this.showToast('Character deleted!', 'success');
            
            if (this.currentPage === 'characters') {
                await this.loadCharacters();
            }
        } catch (error) {
            this.showToast('Failed to delete character: ' + error.message, 'error');
        }
    }

    changePage(page) {
        if (this.currentPage === 'store') {
            this.loadStore(page, this.getCurrentStoreFilters());
        }
    }

    getCurrentStoreFilters() {
        return {
            category: document.getElementById('categoryFilter').value,
            rarity: document.getElementById('rarityFilter').value,
            search: document.getElementById('searchInput').value
        };
    }

    // UI Helper Functions
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Auth form handlers
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.login(email, password);
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            this.register(username, email, password);
        });

        // Auth tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabType = tab.dataset.tab;
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.style.display = 'none';
                });
                document.getElementById(tabType + 'Form').style.display = 'block';
            });
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Store filters
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.loadStore(1, this.getCurrentStoreFilters());
        });

        document.getElementById('rarityFilter').addEventListener('change', () => {
            this.loadStore(1, this.getCurrentStoreFilters());
        });

        document.getElementById('searchInput').addEventListener('input', 
            this.debounce(() => {
                this.loadStore(1, this.getCurrentStoreFilters());
            }, 500)
        );

        // Character creation
        document.getElementById('createCharacterBtn').addEventListener('click', () => {
            this.showCreateCharacterModal();
        });

        document.getElementById('characterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('characterName').value;
            const gameId = document.getElementById('characterGame').value;
            this.createCharacter(name, gameId);
        });

        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.remove('active');
            });
        });

        document.querySelectorAll('.btn-secondary').forEach(btn => {
            if (btn.textContent.includes('Cancel')) {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) modal.classList.remove('active');
                });
            }
        });

        // Mobile navigation
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    initializeNavigation() {
        // Close mobile menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('navMenu').classList.remove('active');
            });
        });
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BattleBucksApp();
});

// Global functions for onclick handlers
window.app = app;