/* ── Habibi Shopping — app.js (Server-based version) ── */

const API = 'http://localhost:3000/api';

/* ─── STATE ─── */
const state = {
  cart: JSON.parse(localStorage.getItem('habibi_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('habibi_user') || 'null'),
  wishlist: JSON.parse(localStorage.getItem('habibi_wishlist') || '[]'),
  products: [],
  categories: [],
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  currentPage: 'home',
};

/* ─── CART ─── */
const Cart = {
  save() { localStorage.setItem('habibi_cart', JSON.stringify(state.cart)); },
  add(product) {
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + 1, product.stock);
    } else {
      state.cart.push({ ...product, qty: 1 });
    }
    this.save();
    updateCartUI();
    toast(`✅ ${product.name} added to cart`);
  },
  remove(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    this.save();
    updateCartUI();
    renderCartItems();
  },
  updateQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(item.qty + delta, item.stock));
    this.save();
    updateCartUI();
    renderCartItems();
  },
  total() { return state.cart.reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return state.cart.reduce((s, i) => s + i.qty, 0); },
  clear() { state.cart = []; this.save(); updateCartUI(); renderCartItems(); }
};

/* ─── WISHLIST ─── */
const Wishlist = {
  save() { localStorage.setItem('habibi_wishlist', JSON.stringify(state.wishlist)); },
  toggle(id) {
    const idx = state.wishlist.indexOf(id);
    if (idx > -1) { state.wishlist.splice(idx, 1); toast('💔 Removed from wishlist'); }
    else { state.wishlist.push(id); toast('❤️ Added to wishlist'); }
    this.save();
  },
  has(id) { return state.wishlist.includes(id); }
};

/* ─── TOAST ─── */
function toast(msg, duration = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

/* ─── API CALLS ─── */
async function fetchProducts(category = 'all', search = '') {
  try {
    let url = `${API}/products?`;
    if (category !== 'all') url += `category=${category}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (error) {
    console.warn('Server offline, using cached data');
    // If server is down, use cached products
    const cached = localStorage.getItem('habibi_products_cache');
    if (cached) {
      let products = JSON.parse(cached);
      // Apply filters locally
      if (category !== 'all') {
        products = products.filter(p => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q)
        );
      }
      return products;
    }
    toast('⚠️ Could not connect to server');
    return [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch {
    console.warn('Server offline, using default categories');
    // Fallback categories
    return [
      { id: "food", label: "Food & Snacks", icon: "🍕" },
      { id: "drinks", label: "Drinks", icon: "🧃" },
      { id: "shoes", label: "Shoes", icon: "👟" },
      { id: "clothing", label: "Clothing", icon: "👕" },
      { id: "stationery", label: "Stationery", icon: "📚" },
      { id: "electronics", label: "Electronics", icon: "💻" },
      { id: "beauty", label: "Beauty", icon: "💄" },
      { id: "other", label: "Other", icon: "📦" }
    ];
  }
}

async function placeOrder(orderData) {
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to place order');
    }
    return await res.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to place order');
  }
}

async function loginUser(email, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
}

async function registerUser(name, email, password) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
}

async function fetchOrders() {
  try {
    const res = await fetch(`${API}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  } catch {
    toast('⚠️ Could not load orders');
    return [];
  }
}

/* ─── CART UI ─── */
function updateCartUI() {
  const count = Cart.count();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  if (state.cart.length === 0) {
    container.innerHTML = `<div class="cart-empty">
      <div style="font-size:48px">🛒</div>
      <p>Your cart is empty.<br>Start shopping, habibi!</p>
    </div>`;
  } else {
    container.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/70x70?text=📦'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">R${item.price.toFixed(2)} each</div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="Cart.updateQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="Cart.updateQty(${item.id}, 1)">+</button>
            <button class="remove-item" onclick="Cart.remove(${item.id})">🗑</button>
          </div>
        </div>
      </div>
    `).join('');
  }
  const subtotal = Cart.total();
  const delivery = subtotal > 0 ? 25 : 0;
  document.getElementById('cart-subtotal').textContent = `R${subtotal.toFixed(2)}`;
  document.getElementById('cart-delivery').textContent = delivery > 0 ? `R${delivery.toFixed(2)}` : 'Free';
  document.getElementById('cart-total').textContent = `R${(subtotal + delivery).toFixed(2)}`;
}

function openCart() {
  renderCartItems();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── PRODUCTS ─── */
function starsHTML(rating) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  let sorted = [...products];
  if (state.sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (state.sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  else if (state.sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  else if (state.sortBy === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (countEl) countEl.textContent = `${sorted.length} item${sorted.length !== 1 ? 's' : ''}`;

  if (sorted.length === 0) {
    grid.innerHTML = `<div class="no-results">
      <div style="font-size:48px;margin-bottom:12px">🔍</div>
      <h3>No products found</h3>
      <p>Try a different search or category</p>
    </div>`;
    return;
  }

  grid.className = 'products-grid stagger';
  grid.innerHTML = sorted.map(p => `
    <div class="product-card" onclick="openProductModal(${p.id})">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=📦'">
        ${p.stock < 5 && p.stock > 0 ? `<span class="product-badge badge badge-warn">Only ${p.stock} left</span>` : ''}
        ${p.stock === 0 ? `<span class="product-badge badge" style="background:#f1f1f1;color:#999">Out of stock</span>` : ''}
        <button class="product-wishlist" onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)">${Wishlist.has(p.id) ? '❤️' : '🤍'}</button>
      </div>
      <div class="product-body">
        <div class="product-cat">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description}</div>
        <div class="product-rating">
          <span class="stars">${starsHTML(p.rating)}</span>
          <span>${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div class="product-price">R${p.price.toFixed(2)}</div>
          <button class="add-to-cart ${p.stock === 0 ? 'out-of-stock' : ''}" onclick="event.stopPropagation(); addToCartById(${p.id})" title="Add to cart" ${p.stock === 0 ? 'disabled' : ''}>+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleWishlist(id, btn) {
  Wishlist.toggle(id);
  btn.textContent = Wishlist.has(id) ? '❤️' : '🤍';
}

function addToCartById(id) {
  const p = state.products.find(p => p.id === id);
  if (p) Cart.add(p);
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">Loading products…</div>`;
  const products = await fetchProducts(state.currentCategory, state.searchQuery);
  state.products = products;
  // Cache products for offline use
  localStorage.setItem('habibi_products_cache', JSON.stringify(products));
  renderProducts(products);
}

/* ─── CATEGORIES ─── */
async function renderCategories() {
  const cats = await fetchCategories();
  state.categories = cats;
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="cat-card active" data-cat="all" onclick="filterCategory('all', this)">
      <span class="cat-icon">🛒</span>All
    </div>
    ${cats.map(c => `
      <div class="cat-card" data-cat="${c.id}" onclick="filterCategory('${c.id}', this)">
        <span class="cat-icon">${c.icon}</span>${c.label}
      </div>
    `).join('')}
  `;
}

function filterCategory(cat, el) {
  state.currentCategory = cat;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  loadProducts();
}

/* ─── PRODUCT MODAL ─── */
function openProductModal(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="badge badge-brand">${product.category}</span>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <img class="modal-img" src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/560x315?text=📦'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div class="modal-product-name">${product.name}</div>
          ${product.stock < 5 && product.stock > 0 ? `<span class="badge badge-warn">Only ${product.stock} left!</span>` : ''}
          ${product.stock === 0 ? `<span class="badge" style="background:#eee;color:#999">Out of stock</span>` : ''}
        </div>
        <div class="product-rating" style="margin-bottom:12px;">
          <span class="stars">${starsHTML(product.rating)}</span>
          <span>${product.rating} out of 5 (${product.reviews} reviews)</span>
        </div>
        <div class="modal-product-desc">${product.description}</div>
        <div class="modal-product-price">R${product.price.toFixed(2)}</div>
        <div class="modal-actions">
          <button class="btn btn-primary" style="flex:1" onclick="addToCartAndClose(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
            🛒 Add to Cart
          </button>
          <button class="btn btn-outline" onclick="toggleWishlistModal(${product.id}, this)">
            ${Wishlist.has(product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  `;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Fix for: Passing product object in onclick was causing issues
function addToCartAndClose(id) {
  const product = state.products.find(p => p.id === id);
  if (product) {
    Cart.add(product);
    closeModal();
  }
}

function toggleWishlistModal(id, btn) {
  Wishlist.toggle(id);
  btn.textContent = Wishlist.has(id) ? '❤️' : '🤍';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── AUTH MODAL (FIXED & IMPROVED) ─── */
function openAuthModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 style="font-family:var(--font-head);font-size:20px;font-weight:800;">Welcome to Habibi 🛒</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="auth-tabs">
          <button class="auth-tab active" onclick="switchAuthTab('login', this)">Sign In</button>
          <button class="auth-tab" onclick="switchAuthTab('register', this)">Register</button>
        </div>
        <div id="auth-form-wrap">
          ${loginForm()}
        </div>
        <p style="text-align:center;font-size:12px;color:var(--muted);margin-top:16px;">
          Demo account: test@habibi.co.za / test123
        </p>
      </div>
    </div>
  `;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Focus on first input
  setTimeout(() => {
    const firstInput = document.querySelector('#auth-form-wrap input');
    if (firstInput) firstInput.focus();
  }, 300);
}

function loginForm() {
  return `
    <form id="auth-form" onsubmit="event.preventDefault(); submitLogin();">
      <div id="auth-error" class="form-error" style="display:none;margin-bottom:12px;"></div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="auth-email" type="email" placeholder="your@email.com" autocomplete="email" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="auth-password" type="password" placeholder="Password" autocomplete="current-password" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full" id="auth-submit-btn">Sign In</button>
    </form>
  `;
}

function registerForm() {
  return `
    <form id="auth-form" onsubmit="event.preventDefault(); submitRegister();">
      <div id="auth-error" class="form-error" style="display:none;margin-bottom:12px;"></div>
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input class="form-input" id="auth-name" type="text" placeholder="Your name" autocomplete="name" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="auth-email" type="email" placeholder="your@email.com" autocomplete="email" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="auth-password" type="password" placeholder="Create a password (min 4 characters)" autocomplete="new-password" required minlength="4">
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Password</label>
        <input class="form-input" id="auth-password-confirm" type="password" placeholder="Confirm your password" autocomplete="new-password" required minlength="4">
      </div>
      <button type="submit" class="btn btn-primary btn-full" id="auth-submit-btn">Create Account</button>
    </form>
  `;
}

function switchAuthTab(tab, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('auth-form-wrap').innerHTML = tab === 'login' ? loginForm() : registerForm();
  
  // Focus on first input
  setTimeout(() => {
    const firstInput = document.querySelector('#auth-form-wrap input');
    if (firstInput) firstInput.focus();
  }, 100);
}

async function submitLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');
  
  // Clear previous error
  errEl.style.display = 'none';
  
  // Validate
  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields';
    errEl.style.display = 'block';
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';
  
  try {
    const user = await loginUser(email, password);
    state.user = user;
    localStorage.setItem('habibi_user', JSON.stringify(user));
    updateAuthUI();
    closeModal();
    toast(`👋 Welcome back, ${user.name}!`);
    
    // If user was trying to checkout, redirect to checkout
    if (state.currentPage === 'checkout') {
      navigateTo('checkout');
    }
  } catch (e) {
    errEl.textContent = e.message || 'Login failed';
    errEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
}

async function submitRegister() {
  const name = document.getElementById('auth-name')?.value?.trim();
  const email = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const passwordConfirm = document.getElementById('auth-password-confirm')?.value;
  const errEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');
  
  // Clear previous error
  errEl.style.display = 'none';
  
  // Validate
  if (!name || !email || !password || !passwordConfirm) {
    errEl.textContent = 'Please fill in all fields';
    errEl.style.display = 'block';
    return;
  }
  
  if (password.length < 4) {
    errEl.textContent = 'Password must be at least 4 characters';
    errEl.style.display = 'block';
    return;
  }
  
  if (password !== passwordConfirm) {
    errEl.textContent = 'Passwords do not match';
    errEl.style.display = 'block';
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';
  
  try {
    const user = await registerUser(name, email, password);
    state.user = user;
    localStorage.setItem('habibi_user', JSON.stringify(user));
    updateAuthUI();
    closeModal();
    toast(`🎉 Welcome to Habibi, ${user.name}!`);
    
    // If user was trying to checkout, redirect to checkout
    if (state.currentPage === 'checkout') {
      navigateTo('checkout');
    }
  } catch (e) {
    errEl.textContent = e.message || 'Registration failed';
    errEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}

function logout() {
  state.user = null;
  localStorage.removeItem('habibi_user');
  updateAuthUI();
  toast('👋 Signed out. Come back soon!');
  navigateTo('home');
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const userDisplay = document.getElementById('user-display');
  if (state.user) {
    if (btn) btn.style.display = 'none';
    if (userDisplay) {
      userDisplay.style.display = 'flex';
      userDisplay.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">${state.user.name[0].toUpperCase()}</div>
          <span style="font-size:14px;font-weight:600">${state.user.name.split(' ')[0]}</span>
          <button class="btn btn-sm btn-outline" onclick="logout()" style="margin-left:4px">Sign out</button>
        </div>
      `;
    }
  } else {
    if (btn) btn.style.display = 'flex';
    if (userDisplay) userDisplay.style.display = 'none';
  }
}

// Check if user is logged in (for protected pages)
function requireAuth() {
  if (!state.user) {
    toast('⚠️ Please sign in to continue');
    openAuthModal();
    return false;
  }
  return true;
}

/* ─── CHECKOUT ─── */
function renderCheckout() {
  const section = document.getElementById('checkout-section');
  if (!section) return;
  const total = Cart.total();
  const delivery = total > 0 ? 25 : 0;
  section.innerHTML = `
    <div class="container">
      <h1 style="font-family:var(--font-head);font-size:32px;margin-bottom:32px;">Checkout</h1>
      ${state.cart.length === 0 ? `
        <div style="text-align:center;padding:80px 20px;">
          <div style="font-size:56px;margin-bottom:16px">🛒</div>
          <h3 style="font-family:var(--font-head);font-size:22px;">Your cart is empty</h3>
          <p style="color:var(--muted);margin:12px 0 24px;">Add some products before checking out</p>
          <button class="btn btn-primary" onclick="navigateTo('home')">Browse Products</button>
        </div>
      ` : `
        <div class="checkout-grid">
          <div>
            ${!state.user ? `
              <div class="checkout-card" style="background:var(--brand-light);border-color:var(--brand);">
                <p style="color:var(--brand-dark);font-weight:600;margin-bottom:12px;">👋 Sign in for faster checkout</p>
                <button class="btn btn-primary btn-sm" onclick="openAuthModal()">Sign In / Register</button>
              </div>
            ` : ''}
            
            <div class="checkout-card">
              <h3>Delivery Details</h3>
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input class="form-input" id="co-name" placeholder="Your full name" value="${state.user ? state.user.name : ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-input" id="co-email" type="email" placeholder="your@email.com" value="${state.user ? state.user.email : ''}">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Campus / Building</label>
                  <input class="form-input" id="co-building" placeholder="e.g. Res Block C">
                </div>
                <div class="form-group">
                  <label class="form-label">Room / Floor</label>
                  <input class="form-input" id="co-room" placeholder="e.g. Room 204">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone (WhatsApp)</label>
                <input class="form-input" id="co-phone" type="tel" placeholder="+27 ...">
              </div>
              <div class="form-group">
                <label class="form-label">Notes for seller</label>
                <textarea class="form-input" id="co-notes" rows="2" placeholder="Any special requests…"></textarea>
              </div>
            </div>

            <div class="checkout-card">
              <h3>Payment</h3>
              <p style="color:var(--muted);font-size:14px;margin-bottom:16px;">Pay on delivery. We accept cash, EFT, or SnapScan.</p>
              <div style="display:flex;gap:12px;">
                <div style="flex:1;padding:14px;border:2px solid var(--brand);border-radius:var(--radius-sm);text-align:center;font-family:var(--font-head);font-size:13px;font-weight:700;color:var(--brand);">💵 Cash</div>
                <div style="flex:1;padding:14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);text-align:center;font-family:var(--font-head);font-size:13px;font-weight:700;color:var(--muted);">🏦 EFT</div>
                <div style="flex:1;padding:14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);text-align:center;font-family:var(--font-head);font-size:13px;font-weight:700;color:var(--muted);">📱 SnapScan</div>
              </div>
            </div>
          </div>

          <div class="order-summary-card">
            <h3 style="font-family:var(--font-head);font-size:18px;font-weight:800;margin-bottom:20px;">Order Summary</h3>
            ${state.cart.map(item => `
              <div class="order-line">
                <span>${item.name} × ${item.qty}</span>
                <span>R${(item.price * item.qty).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="order-line" style="color:var(--muted);margin-top:8px;">
              <span>Subtotal</span><span>R${total.toFixed(2)}</span>
            </div>
            <div class="order-line" style="color:var(--muted);">
              <span>Delivery</span><span>R${delivery.toFixed(2)}</span>
            </div>
            <div class="order-line total">
              <span>Total</span><span style="color:var(--brand);">R${(total + delivery).toFixed(2)}</span>
            </div>
            <button class="btn btn-primary btn-full" style="margin-top:16px;" onclick="submitOrder()">
              Place Order →
            </button>
            <p style="font-size:12px;color:var(--muted);text-align:center;margin-top:10px;">Pay on delivery. No card needed.</p>
          </div>
        </div>
      `}
    </div>
  `;
}

async function submitOrder() {
  const name = document.getElementById('co-name')?.value.trim();
  const email = document.getElementById('co-email')?.value.trim();
  const building = document.getElementById('co-building')?.value.trim();
  const room = document.getElementById('co-room')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  const notes = document.getElementById('co-notes')?.value.trim();

  if (!name || !email || !building || !phone) {
    toast('⚠️ Please fill in all required fields');
    return;
  }

  try {
    const order = await placeOrder({
      customer: { name, email, building, room, phone, notes },
      items: state.cart,
      total: Cart.total() + 25,
      userId: state.user?.id || null
    });
    Cart.clear();
    toast(`🎉 Order ${order.id} placed! We'll WhatsApp you shortly.`, 4000);
    setTimeout(() => navigateTo('orders'), 1200);
  } catch (error) {
    toast('❌ Failed to place order. Is the server running?');
  }
}

/* ─── ORDERS PAGE ─── */
async function renderOrdersPage() {
  if (!requireAuth()) {
    navigateTo('home');
    return;
  }
  
  const section = document.getElementById('orders-section');
  if (!section) return;
  section.innerHTML = `<div class="container"><div style="text-align:center;padding:60px;color:var(--muted)">Loading orders…</div></div>`;
  try {
    const orders = await fetchOrders();
    const myOrders = state.user
      ? orders.filter(o => o.userId === state.user.id || o.customer?.email === state.user?.email)
      : [];
    section.innerHTML = `
      <div class="container">
        <h1 style="font-family:var(--font-head);font-size:32px;margin-bottom:8px;">My Orders</h1>
        <p style="color:var(--muted);margin-bottom:32px;">Track your orders and delivery status</p>
        ${myOrders.length === 0 ? `
          <div style="text-align:center;padding:80px 20px;">
            <div style="font-size:56px;margin-bottom:16px">📦</div>
            <h3 style="font-family:var(--font-head);font-size:22px;">No orders yet</h3>
            <p style="color:var(--muted);margin:12px 0 24px;">Your order history will appear here</p>
            <button class="btn btn-primary" onclick="navigateTo('home')">Start Shopping</button>
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${myOrders.reverse().map(o => `
                  <tr>
                    <td style="font-family:var(--font-head);font-weight:700;">${o.id}</td>
                    <td style="color:var(--muted);">${new Date(o.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td>${o.items?.length || 0} item${o.items?.length !== 1 ? 's' : ''}</td>
                    <td style="font-family:var(--font-head);font-weight:700;">R${o.total?.toFixed(2)}</td>
                    <td>
                      <span class="badge ${o.status === 'pending' ? 'badge-warn' : 'badge-success'}">
                        <span class="status-dot" style="background:${o.status === 'pending' ? '#F7C23E' : '#1A7A4A'}"></span>
                        ${o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch {
    section.innerHTML = `<div class="container"><p style="color:var(--muted);text-align:center;padding:60px;">Could not load orders. Is the server running?</p></div>`;
  }
}

/* ─── ROUTING ─── */
function navigateTo(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeCart();
  if (page === 'checkout') renderCheckout();
  if (page === 'orders') renderOrdersPage();
}

/* ─── INIT ─── */
async function init() {
  updateCartUI();
  updateAuthUI();

  await renderCategories();
  await loadProducts();

  // Check if user is coming back to an existing session
  const savedUser = localStorage.getItem('habibi_user');
  if (savedUser) {
    try {
      state.user = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('habibi_user');
    }
  }

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      state.searchQuery = e.target.value;
      debounce = setTimeout(() => loadProducts(), 350);
    });
  }

  // Sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts(state.products);
    });
  }

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Cart overlay click
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  // Keyboard close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });

  // Mobile menu
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('mobile-open');
  });
  
  // Allow pressing Enter to submit auth forms
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('modal-overlay').classList.contains('open')) {
      const activeTab = document.querySelector('.auth-tab.active');
      if (activeTab) {
        e.preventDefault();
        if (activeTab.textContent.includes('Sign In')) {
          submitLogin();
        } else {
          submitRegister();
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', init);