const API = '/api';

const state = {
  cart: JSON.parse(localStorage.getItem('habibi_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('habibi_user') || 'null'),
  wishlist: JSON.parse(localStorage.getItem('habibi_wishlist') || '[]'),
  products: [], categories: [],
  currentCategory: 'all', searchQuery: '', sortBy: 'default', currentPage: 'home',
  points: 0, discountAmount: 0,
  rewardBalance: 0,
  rewardProgress: null,
  tier: 'bronze',
  streak: { count: 0, bonusAmount: 0 },
  subscription: null,
};

// ============================================================
//  CART FUNCTIONS
// ============================================================

const Cart = {
  save() { localStorage.setItem('habibi_cart', JSON.stringify(state.cart)); },
  add(p) {
    const e = state.cart.find(i => i.id === p.id);
    if (e) {
      e.qty = Math.min(e.qty + 1, p.stock);
    } else {
      state.cart.push({ ...p, qty: 1 });
    }
    this.save();
    updateCartUI();
    updateCartRewardProgress();
    toast(`✅ ${p.name} added`);
  },
  remove(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    this.save();
    updateCartUI();
    renderCartItems();
    updateCartRewardProgress();
  },
  updateQty(id, d) {
    const i = state.cart.find(x => x.id === id);
    if (!i) return;
    i.qty = Math.max(1, Math.min(i.qty + d, i.stock));
    this.save();
    updateCartUI();
    renderCartItems();
    updateCartRewardProgress();
  },
  total() { return state.cart.reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return state.cart.reduce((s, i) => s + i.qty, 0); },
  clear() {
    state.cart = [];
    this.save();
    updateCartUI();
    renderCartItems();
    updateCartRewardProgress();
  }
};

const Wishlist = {
  save() { localStorage.setItem('habibi_wishlist', JSON.stringify(state.wishlist)); },
  toggle(id) {
    const i = state.wishlist.indexOf(id);
    if (i > -1) { state.wishlist.splice(i, 1); toast('💔 Removed'); }
    else { state.wishlist.push(id); toast('❤️ Added'); }
    this.save();
  },
  has(id) { return state.wishlist.includes(id); }
};

function toast(m, d = 2800) {
  const e = document.getElementById('toast');
  e.textContent = m;
  e.classList.add('show');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove('show'), d);
}

// ============================================================
//  API FUNCTIONS
// ============================================================

async function fetchProducts(cat = 'all', search = '') {
  let u = `${API}/products?`;
  if (cat !== 'all') u += `category=${encodeURIComponent(cat)}&`;
  if (search) u += `search=${encodeURIComponent(search)}&`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API}/categories`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function placeOrder(d) {
  const r = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d)
  });
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
}

async function loginUser(e, p) {
  const r = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: e, password: p })
  });
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
}

async function registerUser(n, e, p) {
  const r = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: n, email: e, password: p })
  });
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
}

async function fetchOrders() {
  const res = await fetch(`${API}/orders`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchUserPoints(email) {
  if (!email) return;
  try {
    const r = await fetch(`${API}/user/points?email=${email}`);
    if (r.ok) {
      const d = await r.json();
      state.points = d.points || 0;
      updatePointsDisplay();
    }
  } catch {}
}

// ============================================================
//  REWARD FUNCTIONS
// ============================================================

async function loadUserRewards() {
  if (!state.user) return;
  try {
    const res = await fetch(`${API}/user/rewards/${state.user._id}`);
    if (res.ok) {
      const data = await res.json();
      state.rewardBalance = data.rewardBalance || 0;
      state.totalRewardsEarned = data.totalRewardsEarned || 0;
      state.tier = data.tier || 'bronze';
      state.streak = data.streak || { count: 0, bonusAmount: 0 };
      state.subscription = data.subscription || null;
      state.rewardProgress = data.progress || null;
      updateRewardUI();
    }
  } catch (e) { /* silent fail */ }
}

async function loadRewardProgress() {
  if (!state.user) return;
  try {
    const res = await fetch(`${API}/user/reward-progress?userId=${state.user._id}`);
    if (res.ok) {
      state.rewardProgress = await res.json();
      updateRewardUI();
    }
  } catch (e) { /* silent fail */ }
}

function updateRewardUI() {
  const btn = document.getElementById('rewards-btn');
  if (btn && state.user) {
    btn.style.display = 'inline-flex';
    btn.innerHTML = `🎁 R${state.rewardBalance.toFixed(2)}`;
    btn.title = `${state.tier.charAt(0).toUpperCase() + state.tier.slice(1)} Tier`;
  }
  const tierBadge = document.getElementById('tier-badge');
  if (tierBadge) {
    const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
    tierBadge.textContent = tierIcons[state.tier] || '🥉';
  }
  updateCartRewardProgress();
}

function getTierIcon(tier) {
  const icons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  return icons[tier] || '🥉';
}

async function redeemRewards() {
  if (!state.user) {
    toast('⚠️ Please sign in to redeem rewards');
    return;
  }
  const amount = Math.min(state.rewardBalance, state.rewardBalance);
  if (amount < 2) {
    toast('⚠️ Need at least R2 to redeem');
    return;
  }
  try {
    const res = await fetch(`${API}/user/redeem-rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.user.email, amount: amount })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    state.rewardBalance = data.remaining;
    toast(`✅ Redeemed R${amount.toFixed(2)}!`);
    updateRewardUI();
    renderCheckout();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

function showRewardsModal() {
  const tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  const tierLabels = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal" onclick="event.stopPropagation()" style="max-width:420px;">
      <div class="modal-header">
        <h3>🎁 My Rewards</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:24px;">
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:48px;">${tierIcons[state.tier] || '🥉'}</div>
          <div style="font-size:32px;font-weight:800;">R${state.rewardBalance.toFixed(2)}</div>
          <div style="color:var(--muted);">${tierLabels[state.tier] || 'Bronze'} Tier</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:16px 0;">
          <div style="background:var(--surface);padding:12px;border-radius:8px;text-align:center;">
            <div style="font-weight:700;font-size:18px;">${state.totalRewardsEarned || 0}</div>
            <div style="font-size:11px;color:var(--muted);">Rewards Earned</div>
          </div>
          <div style="background:var(--surface);padding:12px;border-radius:8px;text-align:center;">
            <div style="font-weight:700;font-size:18px;">${state.streak?.count || 0}</div>
            <div style="font-size:11px;color:var(--muted);">Week Streak</div>
          </div>
          <div style="background:var(--surface);padding:12px;border-radius:8px;text-align:center;">
            <div style="font-weight:700;font-size:18px;">${state.subscription?.active ? '✅' : '❌'}</div>
            <div style="font-size:11px;color:var(--muted);">Subscription</div>
          </div>
        </div>
        <div style="background:var(--surface);padding:16px;border-radius:8px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:4px;">
            <span>Next Reward</span>
            <span>${state.rewardProgress?.itemsNeededForNext || '0'} items needed</span>
          </div>
          <div style="background:var(--border);height:6px;border-radius:99px;overflow:hidden;">
            <div style="background:var(--black);height:100%;width:${100 - (state.rewardProgress?.itemsNeededForNext / 10 * 100) || 0}%;border-radius:99px;"></div>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">
            ${state.rewardProgress?.eligibleItems || 0} eligible items purchased
          </div>
        </div>
        <div style="background:var(--surface);padding:16px;border-radius:8px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;">⭐ Subscription</div>
              <div style="font-size:12px;color:var(--muted);">
                ${state.subscription?.active ? `Active: ${state.subscription.tier}` : 'Not subscribed'}
              </div>
            </div>
            <button class="btn btn-sm ${state.subscription?.active ? 'btn-outline' : 'btn-primary'}"
                    onclick="closeModal();${state.subscription?.active ? 'showUnsubscribeModal()' : 'showSubscribeModal()'}">
              ${state.subscription?.active ? 'Manage' : 'Subscribe'}
            </button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${state.rewardBalance >= 2 ? `
            <button class="btn btn-primary btn-sm" onclick="closeModal();redeemRewards()">
              Redeem R${Math.min(state.rewardBalance, state.rewardBalance).toFixed(2)}
            </button>
          ` : `
            <button class="btn btn-outline btn-sm" disabled style="opacity:0.5;">
              Need R2 to redeem
            </button>
          `}
          <button class="btn btn-outline btn-sm" onclick="closeModal();loadRewardProgress();">
            🔄 Refresh
          </button>
        </div>
        <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:16px;">
          💡 Every 10 items (R10+) = R2 reward
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

function showSubscribeModal() {
  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal" onclick="event.stopPropagation()" style="max-width:400px;">
      <div class="modal-header">
        <h3>⭐ Subscribe & Save</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body" style="padding:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="border:2px solid var(--border);border-radius:12px;padding:16px;text-align:center;cursor:pointer;"
               onclick="subscribeToTier('basic')">
            <div style="font-size:24px;">📦</div>
            <div style="font-weight:700;">Basic</div>
            <div style="font-size:20px;font-weight:800;">R50<span style="font-size:14px;font-weight:400;color:var(--muted);">/mo</span></div>
            <ul style="text-align:left;font-size:12px;color:var(--muted);list-style:none;padding:0;margin:8px 0;">
              <li>✅ R2 monthly bonus</li>
              <li>✅ Free delivery</li>
              <li>✅ 5% off all orders</li>
            </ul>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();subscribeToTier('basic')">Subscribe</button>
          </div>
          <div style="border:2px solid var(--black);border-radius:12px;padding:16px;text-align:center;cursor:pointer;position:relative;"
               onclick="subscribeToTier('premium')">
            <span style="position:absolute;top:-8px;right:8px;background:var(--black);color:white;font-size:10px;padding:2px 10px;border-radius:99px;">BEST</span>
            <div style="font-size:24px;">💎</div>
            <div style="font-weight:700;">Premium</div>
            <div style="font-size:20px;font-weight:800;">R100<span style="font-size:14px;font-weight:400;color:var(--muted);">/mo</span></div>
            <ul style="text-align:left;font-size:12px;color:var(--muted);list-style:none;padding:0;margin:8px 0;">
              <li>✅ R5 monthly bonus</li>
              <li>✅ Free delivery</li>
              <li>✅ 10% off all orders</li>
              <li>✅ Free item monthly</li>
            </ul>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();subscribeToTier('premium')">Subscribe</button>
          </div>
        </div>
        <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:12px;">
          Cancel anytime. No commitment.
        </p>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

async function subscribeToTier(tier) {
  if (!state.user) {
    toast('⚠️ Please sign in first');
    return;
  }
  try {
    const res = await fetch(`${API}/user/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: state.user._id, tier: tier })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    toast(`✅ ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier activated!`);
    closeModal();
    await loadUserRewards();
    updateRewardUI();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

function showUnsubscribeModal() {
  document.getElementById('confirm-title').textContent = 'Cancel Subscription?';
  document.getElementById('confirm-msg').textContent = 'You will lose all subscription benefits immediately.';
  document.getElementById('confirm-ok').textContent = 'Cancel';
  document.getElementById('confirm-ok').className = 'btn btn-danger';
  document.getElementById('confirm-ok').onclick = async () => {
    closeConfirm();
    try {
      const res = await fetch(`${API}/user/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user._id })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast('✅ Subscription cancelled');
      await loadUserRewards();
      updateRewardUI();
    } catch (err) {
      toast('❌ ' + err.message);
    }
  };
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirm() { document.getElementById('confirm-overlay').classList.remove('open'); }

// ============================================================
//  STARS HTML
// ============================================================

function starsHTML(rating) {
  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 0) return '☆☆☆☆☆';
  if (numRating > 5) return '★★★★★';
  const full = Math.round(numRating);
  const empty = Math.max(0, 5 - full);
  return '★'.repeat(full) + '☆'.repeat(empty);
}

// ============================================================
//  PRODUCTS & CATEGORIES
// ============================================================

async function loadProducts() {
  const g = document.getElementById('products-grid');
  if (g) g.innerHTML = '<div style="text-align:center;padding:60px;">Loading products…</div>';

  try {
    let url = `${API}/products?`;
    if (state.currentCategory && state.currentCategory !== 'all') {
      url += `category=${encodeURIComponent(state.currentCategory)}&`;
    }
    if (state.searchQuery && state.searchQuery.trim()) {
      url += `search=${encodeURIComponent(state.searchQuery.trim())}&`;
    }
    url = url.replace(/[?&]$/, '');

    console.log('📦 Fetching products from:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const p = await response.json();
    console.log('📦 Products response:', p);
    
    if (!p || !Array.isArray(p)) {
      console.warn('⚠️ Products response is not an array:', p);
      state.products = [];
      renderProducts([]);
      return;
    }
    
    console.log('📦 Products loaded:', p.length, 'for category:', state.currentCategory);
    state.products = p;
    renderProducts(p);
    
  } catch (err) {
    console.error('❌ Failed to load products:', err);
    if (g) {
      g.innerHTML = `
        <div class="no-results">
          <div style="font-size:48px">⚠️</div>
          <h3>Could not load products</h3>
          <p style="color:var(--muted);font-size:14px;">${err.message || 'Please check your connection'}</p>
          <button class="btn btn-outline btn-sm" onclick="loadProducts()" style="margin-top:12px;">🔄 Retry</button>
        </div>
      `;
    }
    state.products = [];
  }
}

function renderProducts(products) {
  const g = document.getElementById('products-grid');
  const ce = document.getElementById('results-count');
  if (!g) {
    console.warn('⚠️ products-grid element not found');
    return;
  }

  if (!products || !Array.isArray(products)) {
    console.warn('⚠️ products is not an array:', products);
    products = [];
  }

  console.log('🎨 Rendering', products.length, 'products');

  if (products.length === 0) {
    g.innerHTML = `
      <div class="no-results">
        <div style="font-size:48px">🔍</div>
        <h3>No products found</h3>
        <p style="color:var(--muted);font-size:14px;">
          ${state.currentCategory !== 'all' ? `No products in "${state.currentCategory}" category` : 'Try adjusting your search'}
        </p>
      </div>
    `;
    if (ce) ce.textContent = '0 items';
    return;
  }

  let s = [...products];
  if (state.sortBy === 'price-asc') s.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (state.sortBy === 'price-desc') s.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (state.sortBy === 'rating') s.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (state.sortBy === 'newest') s.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (ce) ce.textContent = `${s.length} item${s.length !== 1 ? 's' : ''}`;

  g.className = 'products-grid stagger';
  
  let html = '';
  s.forEach((p, index) => {
    const productId = p._id || p.id || `prod-${index}`;
    const imageUrl = p.image || 'https://via.placeholder.com/320x320?text=📦';
    const stock = p.stock !== undefined ? p.stock : 0;
    const isOutOfStock = stock === 0;
    const lowStock = stock > 0 && stock <= 5;
    const rating = p.rating || 0;
    const reviews = p.reviews || 0;
    const price = p.price || 0;
    const name = p.name || 'Unnamed Product';
    const category = p.category || 'Other';
    const description = p.description || '';

    html += `
      <div class="product-card" onclick="openProductModal('${productId}')">
        <div class="product-img-wrap">
          <img src="${imageUrl}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x320?text=📦'">
          ${lowStock && !isOutOfStock ? `<span class="product-badge badge badge-warn">Only ${stock} left</span>` : ''}
          ${isOutOfStock ? `<span class="product-badge badge" style="background:#f1f1f1">Out of stock</span>` : ''}
          <button class="product-wishlist" onclick="event.stopPropagation();toggleWishlist('${productId}',this)">
            ${Wishlist.has(productId) ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-body">
          <div class="product-cat">${category}</div>
          <div class="product-name">${name}</div>
          ${description ? `<div class="product-desc">${description}</div>` : ''}
          <div class="product-rating">
            <span class="stars">${starsHTML(rating)}</span>
            <span>${Number(rating).toFixed(1)} (${reviews || 0})</span>
          </div>
          <div class="product-footer">
            <div class="product-price">R${Number(price).toFixed(2)}</div>
            <button class="add-to-cart ${isOutOfStock ? 'out-of-stock' : ''}"
                    onclick="event.stopPropagation();addToCartById('${productId}')"
                    ${isOutOfStock ? 'disabled' : ''}>
              +
            </button>
          </div>
        </div>
      </div>
    `;
  });

  g.innerHTML = html;
  console.log('🎨 Products rendered:', s.length);
}

async function renderCategories() {
  try {
    console.log('🏷️ Fetching categories...');
    const response = await fetch(`${API}/categories`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const cats = await response.json();
    console.log('🏷️ Categories loaded:', cats.length);
    state.categories = cats;

    const g = document.getElementById('categories-grid');
    if (!g) return;

    if (!cats || cats.length === 0) {
      g.innerHTML = `
        <div class="cat-card" style="grid-column:1/-1;cursor:default;border-color:var(--gray-200);">
          No categories found. Add some in the admin panel.
        </div>
      `;
      return;
    }

    let html = `
      <div class="cat-card active" data-cat="all" onclick="filterCategory('all',this)">
        <span style="font-size:20px;">📋</span>
        All
      </div>
    `;

    cats.forEach(c => {
      const icon = c.icon || '🏷️';
      const label = c.label || c.id;
      const catId = c.id;
      
      html += `
        <div class="cat-card" data-cat="${catId}" onclick="filterCategory('${catId}',this)">
          <span style="font-size:20px;">${icon}</span>
          ${label}
        </div>
      `;
    });

    g.innerHTML = html;
    console.log('🏷️ Categories rendered:', cats.length + 1, 'including "All"');
    
  } catch (err) {
    console.error('❌ Failed to load categories:', err);
    const g = document.getElementById('categories-grid');
    if (g) {
      g.innerHTML = `
        <div class="cat-card" style="grid-column:1/-1;cursor:default;border-color:var(--gray-200);">
          ⚠️ Could not load categories
        </div>
      `;
    }
  }
}

function filterCategory(cat, el) {
  console.log('🔍 Filtering by category:', cat);
  state.currentCategory = cat;
  state.searchQuery = '';
  
  const si = document.getElementById('search-input');
  if (si) si.value = '';
  
  document.querySelectorAll('.cat-card').forEach(c => {
    c.classList.remove('active');
  });
  
  if (el) {
    el.classList.add('active');
  }
  
  loadProducts();
  
  const shopSection = document.getElementById('shop-section');
  if (shopSection) {
    setTimeout(() => {
      shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }
}

function addToCartById(id) {
  console.log('🛒 Adding to cart by ID:', id);
  const p = state.products.find(p => {
    return p._id === id || 
           p.id === id || 
           String(p._id) === String(id) ||
           String(p.id) === String(id);
  });
  
  if (p) {
    console.log('🛒 Found product:', p.name);
    Cart.add(p);
  } else {
    console.warn('⚠️ Product not found with ID:', id);
    toast('⚠️ Product not found');
  }
}

// ============================================================
//  PRODUCT MODAL
// ============================================================

function openProductModal(id) {
  console.log('🔍 Opening product modal for ID:', id);
  
  const p = state.products.find(x => {
    return x._id === id || 
           x.id === id || 
           String(x._id) === String(id) ||
           String(x.id) === String(id);
  });
  
  if (!p) {
    console.warn('⚠️ Product not found for modal:', id);
    toast('⚠️ Product not found');
    return;
  }

  console.log('🔍 Product found:', p.name);

  const imageUrl = p.image || 'https://via.placeholder.com/560x560?text=No+Image';
  const price = p.price || 0;
  const rating = p.rating || 0;
  const reviews = p.reviews || 0;
  const stock = p.stock || 0;
  const productId = p._id || p.id;

  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="badge badge-brand">${p.category || 'Other'}</span>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <img class="modal-img" src="${imageUrl}" onerror="this.src='https://via.placeholder.com/560x560?text=📦'">
        <div class="modal-product-name">${p.name || 'Unnamed Product'}</div>
        <div class="product-rating">
          <span class="stars">${starsHTML(rating)}</span>
          <span>${Number(rating).toFixed(1)} (${reviews || 0})</span>
        </div>
        <div class="modal-product-desc">${p.description || ''}</div>
        <div class="modal-product-price">R${Number(price).toFixed(2)}</div>
        ${stock === 0 ? '<div style="color:red;font-weight:600;margin-bottom:16px;">Out of Stock</div>' : ''}
        <div class="modal-actions">
          <button class="btn btn-primary" style="flex:1" onclick="addToCartAndClose('${productId}')" ${stock === 0 ? 'disabled' : ''}>
            🛒 Add to Cart
          </button>
          <button class="btn btn-outline" onclick="toggleWishlistModal('${productId}',this)">
            ${Wishlist.has(productId) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function addToCartAndClose(id) {
  const p = state.products.find(x => {
    return x._id === id || 
           x.id === id || 
           String(x._id) === String(id) ||
           String(x.id) === String(id);
  });
  if (p) {
    Cart.add(p);
    closeModal();
  } else {
    toast('⚠️ Product not found');
  }
}

function toggleWishlistModal(id, b) {
  Wishlist.toggle(id);
  b.textContent = Wishlist.has(id) ? '❤️' : '🤍';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
//  SLIDESHOW
// ============================================================

let slideInterval = null;

async function loadHeroSlideshow() {
  const w = document.getElementById('slideshow-wrapper');
  const d = document.getElementById('slideshow-dots');

  if (!w || !d) {
    console.warn('⚠️ Slideshow elements not found');
    return;
  }

  w.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-500);">Loading slides...</div>';
  d.innerHTML = '';

  try {
    console.log('🖼️ Fetching slides...');
    const response = await fetch(`${API}/slides`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const slides = await response.json();
    console.log('🖼️ Slides loaded:', slides.length);

    if (!slides || slides.length === 0) {
      w.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#999;font-size:18px;">
          📸 No slides available
        </div>
      `;
      return;
    }

    w.innerHTML = slides.map((slide, index) => {
      const isActive = index === 0 ? 'active' : '';
      const imageUrl = slide.image || 'https://via.placeholder.com/1920x300?text=Slide';
      return `
        <img class="slideshow-slide ${isActive}"
             src="${imageUrl}"
             alt="${slide.caption || 'Slide'}"
             ${slide.link ? `onclick="window.open('${slide.link}','_blank')" style="cursor:pointer;"` : ''}>
        ${slide.caption ? `<div class="slideshow-caption ${isActive}">${slide.caption}</div>` : ''}
      `;
    }).join('');

    d.innerHTML = slides.map((_, index) => {
      const isActive = index === 0 ? 'active' : '';
      return `<div class="slideshow-dot ${isActive}" onclick="goToSlide(${index})"></div>`;
    }).join('');

    if (slideInterval) clearInterval(slideInterval);
    let currentSlide = 0;

    slideInterval = setInterval(() => {
      const totalSlides = slides.length;
      if (totalSlides === 0) return;
      currentSlide = (currentSlide + 1) % totalSlides;
      goToSlide(currentSlide);
    }, 5000);

  } catch (err) {
    console.error('❌ Failed to load slides:', err);
    w.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#999;font-size:18px;">
        📸 Could not load slides
      </div>
    `;
  }
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.slideshow-slide');
  const captions = document.querySelectorAll('.slideshow-caption');
  const dots = document.querySelectorAll('.slideshow-dot');

  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  captions.forEach((c, i) => c.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

// ============================================================
//  CART UI
// ============================================================

function updateCartUI() {
  const c = Cart.count();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = c;
    el.style.display = c > 0 ? 'flex' : 'none';
  });
  const drawer = document.getElementById('cart-drawer');
  if (drawer && drawer.classList.contains('open')) {
    updateCartRewardProgress();
  }
}

function updateCartRewardProgress() {
  const progressContainer = document.getElementById('reward-progress-container');
  if (!progressContainer) return;

  const eligibleItems = state.cart.filter(item => item.price >= 10);
  const eligibleCount = eligibleItems.length;
  const sets = Math.floor(eligibleCount / 10);
  const remaining = eligibleCount % 10;
  const progress = Math.round((remaining / 10) * 100);

  let streakBonus = 0;
  if (state.streak && state.streak.count >= 3) {
    streakBonus = state.streak.bonusAmount || 5;
  }

  progressContainer.innerHTML = `
    <div class="reward-progress-card">
      <div class="reward-progress-header">
        <div class="reward-progress-title">
          <span>🎁 Rewards</span>
          <span class="reward-balance">R${state.rewardBalance.toFixed(2)}</span>
        </div>
        <div class="reward-tier-badge" id="tier-badge">
          ${getTierIcon(state.tier)}
        </div>
      </div>

      ${state.cart.length > 0 ? `
        <div class="reward-progress-body">
          <div class="reward-progress-info">
            <span>${eligibleCount}/10 items for R2</span>
            <span>${sets} rewards earned</span>
          </div>
          <div class="reward-progress-track">
            <div class="reward-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="reward-progress-helper">
            ${remaining === 0 ? '✅ Ready for reward!' : `Add ${10 - remaining} more items for R2`}
          </div>
          ${streakBonus > 0 ? `<div class="reward-streak-bonus">🔥 ${state.streak.count} week streak! +R${streakBonus.toFixed(2)} bonus</div>` : ''}
          ${state.subscription?.active ? `<div class="reward-subscription-badge">⭐ ${state.subscription.tier} subscriber</div>` : ''}
        </div>
      ` : `
        <div class="reward-progress-empty">
          Add items to your cart to earn rewards!
        </div>
      `}

      ${state.rewardBalance >= 2 ? `
        <button class="btn btn-sm btn-primary" onclick="redeemRewards()" style="margin-top:8px;width:100%;">
          Redeem R${Math.min(state.rewardBalance, state.rewardBalance).toFixed(2)}
        </button>
      ` : ''}
    </div>
  `;
}

function renderCartItems() {
  const c = document.getElementById('cart-items');
  if (!c) return;

  if (state.cart.length === 0) {
    c.innerHTML = `
      <div class="cart-empty">
        <div style="font-size:48px">🛒</div>
        <p>Your cart is empty.</p>
      </div>
    `;
    return;
  }

  c.innerHTML = state.cart.map(i => `
    <div class="cart-item">
      <img class="cart-item-img" src="${i.image}" onerror="this.src='https://via.placeholder.com/70x70'">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">R${i.price.toFixed(2)} each</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="Cart.updateQty(${i.id},-1)">−</button>
          <span class="qty-num">${i.qty}</span>
          <button class="qty-btn" onclick="Cart.updateQty(${i.id},1)">+</button>
          <button class="remove-item" onclick="Cart.remove(${i.id})">🗑</button>
        </div>
      </div>
    </div>
  `).join('');

  const t = Cart.total();
  document.getElementById('cart-subtotal').textContent = `R${t.toFixed(2)}`;
  document.getElementById('cart-delivery').textContent = 'Free';

  const discount = state.discountAmount || 0;
  const finalTotal = Math.max(0, t - discount);
  document.getElementById('cart-total').textContent = `R${finalTotal.toFixed(2)}`;
}

function openCart() {
  renderCartItems();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';

  if (state.user) {
    loadRewardProgress();
  }

  const footer = document.querySelector('.cart-footer');
  if (footer && !document.getElementById('reward-progress-container')) {
    const container = document.createElement('div');
    container.id = 'reward-progress-container';
    container.style.marginBottom = '12px';
    footer.parentNode.insertBefore(container, footer);
    updateCartRewardProgress();
  }
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
//  FILE TO BASE64 HELPER
// ============================================================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
//  PAYMENT METHODS & CHECKOUT (UPDATED)
// ============================================================

function renderCheckout() {
  const s = document.getElementById('checkout-section');
  if (!s) return;

  const subtotal = Cart.total();
  const discount = state.discountAmount || 0;
  const rewardDiscount = Math.min(state.rewardBalance, subtotal);
  const total = Math.max(0, subtotal - discount - rewardDiscount);

  // Check if cash is allowed (max R80 for items only)
  const cashAllowed = subtotal <= 80;
  
  let subscriptionDiscount = 0;
  let subscriptionPercent = 0;
  if (state.subscription?.active && state.subscription.config?.discountPercent) {
    subscriptionPercent = state.subscription.config.discountPercent;
    subscriptionDiscount = (subtotal * subscriptionPercent) / 100;
  }

  s.innerHTML = `
    <div class="container">
      <h1>Checkout</h1>
      ${state.cart.length === 0 ? '<div style="text-align:center;padding:80px;"><h3>Cart empty</h3></div>' : `
        <div class="checkout-grid">
          <div>
            <div class="checkout-card">
              <h3>📱 Delivery Details</h3>
              <div class="form-group"><label>WhatsApp *</label><input class="form-input" id="co-phone" type="tel" value="${state.user?.phone||''}"></div>
              <div class="form-group"><label>Address *</label><textarea class="form-input" id="co-address">${state.user?.address||''}</textarea><button id="location-btn" class="btn btn-outline btn-sm" onclick="shareLocation()">📍 Share My Location</button><input type="hidden" id="co-coordinates"></div>
              <div class="form-group"><label>Notes</label><textarea class="form-input" id="co-notes"></textarea></div>
            </div>

            <!-- Payment Method Selection -->
            <div class="checkout-card">
              <h3>💳 Payment Method</h3>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <!-- Cash Option -->
                <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid ${cashAllowed ? 'var(--gray-200)' : '#ffcccc'};border-radius:8px;${cashAllowed ? 'cursor:pointer;' : 'opacity:0.5;'}">
                  <input type="radio" id="payment-cash" name="payment-method" value="cash" ${cashAllowed ? 'checked' : 'disabled'} onchange="togglePaymentMethod('cash')">
                  <label for="payment-cash" style="cursor:${cashAllowed ? 'pointer' : 'not-allowed'};flex:1;">
                    <div style="font-weight:600;">💵 Cash on Delivery</div>
                    <div style="font-size:13px;color:var(--muted);">Pay when your order arrives</div>
                    ${!cashAllowed ? `<div style="color:#DC2626;font-size:12px;font-weight:600;margin-top:4px;">⚠️ Cash only available for orders under R80. Current cart: R${subtotal.toFixed(2)}</div>` : ''}
                  </label>
                </div>

                <!-- Payshap / Instant EFT Option -->
                <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid var(--gray-200);border-radius:8px;cursor:pointer;">
                  <input type="radio" id="payment-payshap" name="payment-method" value="payshap" onchange="togglePaymentMethod('payshap')">
                  <label for="payment-payshap" style="cursor:pointer;flex:1;">
                    <div style="font-weight:600;">💳 Payshap / Instant EFT</div>
                    <div style="font-size:13px;color:var(--muted);">Pay instantly via Standard Bank Instant EFT</div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Payshap Payment Details (shown when selected) -->
            <div id="payshap-details" style="display:none;">
              <div class="checkout-card" style="border:2px solid #ff4444;">
                <h3 style="color:#DC2626;">⚠️ Important: Instant EFT Payment</h3>
                <div style="background:#fff5f5;padding:16px;border-radius:8px;margin-bottom:16px;">
                  <p style="font-weight:600;color:#DC2626;">Please make your payment immediately and upload proof of payment below.</p>
                  <p style="font-size:13px;color:var(--muted);">Use your <strong>Order Reference</strong> as the payment reference.</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div><strong>Bank:</strong> Standard Bank</div>
                  <div><strong>Account Number:</strong> 10217451673</div>
                  <div><strong>Account Type:</strong> Current Account</div>
                  <div><strong>Reference:</strong> <span id="order-ref-display" style="background:var(--gray-100);padding:2px 8px;border-radius:4px;font-weight:700;">ORD-XXXXXXXX</span></div>
                </div>
                <div class="form-group" style="margin-top:16px;">
                  <label>Upload Proof of Payment (POP) *</label>
                  <input type="file" id="co-pop" accept="image/*,application/pdf" style="width:100%;padding:8px;">
                  <small style="color:var(--muted);">Upload a screenshot or photo of your payment confirmation.</small>
                </div>
              </div>
            </div>

            <!-- Rewards Section -->
            <div class="checkout-card">
              <h3>🎁 Rewards & Savings</h3>
              ${state.user ? `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
                  <span>Reward Balance</span>
                  <span><strong>R${state.rewardBalance.toFixed(2)}</strong></span>
                </div>
                ${state.rewardBalance >= 2 ? `
                  <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="btn btn-primary btn-sm" onclick="redeemRewards()" style="flex:1;">
                      Apply R${Math.min(state.rewardBalance, subtotal).toFixed(2)} off
                    </button>
                  </div>
                ` : '<p style="font-size:12px;color:var(--muted);">Earn R2 for every 10 items</p>'}
              ` : '<p style="font-size:12px;color:var(--muted);">Sign in to use rewards</p>'}
            </div>
          </div>

          <div class="order-summary-card">
            <h3>Order Summary</h3>
            ${state.cart.map(i => `<div class="order-line"><span>${i.name} × ${i.qty}</span><span>R${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
            ${subscriptionDiscount > 0 ? `<div class="order-line" style="color:green;"><span>${state.subscription.tier} Discount (${subscriptionPercent}%)</span><span>-R${subscriptionDiscount.toFixed(2)}</span></div>` : ''}
            ${discount > 0 ? `<div class="order-line" style="color:green;"><span>Points Discount</span><span>-R${discount.toFixed(2)}</span></div>` : ''}
            ${rewardDiscount > 0 ? `<div class="order-line" style="color:green;"><span>🎁 Reward Discount</span><span>-R${rewardDiscount.toFixed(2)}</span></div>` : ''}
            <div class="order-line" style="font-weight:600;border-top:2px solid var(--gray-300);padding-top:12px;margin-top:12px;">
              <span>Subtotal (Items Only)</span>
              <span>R${subtotal.toFixed(2)}</span>
            </div>
            <div class="order-line" style="color:var(--muted);">
              <span>Delivery Fee</span>
              <span>Free</span>
            </div>
            <div class="order-line total"><span>Total</span><span>R${total.toFixed(2)}</span></div>
            <p>🚚 Free Delivery</p>
            
            <!-- Payment method indicator -->
            <div style="margin:12px 0;padding:8px 12px;background:var(--gray-100);border-radius:4px;font-size:13px;">
              💳 Payment: <span id="selected-payment-label">Cash on Delivery</span>
            </div>
            
            <button class="btn btn-primary btn-full" id="place-order-btn" onclick="submitOrder()">Place Order</button>
            <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">You'll see your order summary after placing.</p>
          </div>
        </div>
      `}
    </div>`;

  // Auto-select default payment method
  if (cashAllowed) {
    document.getElementById('payment-cash').checked = true;
    document.getElementById('selected-payment-label').textContent = 'Cash on Delivery';
  } else {
    document.getElementById('payment-payshap').checked = true;
    document.getElementById('selected-payment-label').textContent = 'Payshap / Instant EFT';
    togglePaymentMethod('payshap');
  }
}

function togglePaymentMethod(method) {
  const payshapDetails = document.getElementById('payshap-details');
  const label = document.getElementById('selected-payment-label');
  
  if (method === 'payshap') {
    payshapDetails.style.display = 'block';
    label.textContent = 'Payshap / Instant EFT';
  } else {
    payshapDetails.style.display = 'none';
    label.textContent = 'Cash on Delivery';
  }
}

// ============================================================
//  SUBMIT ORDER (UPDATED)
// ============================================================

async function submitOrder() {
  const p = document.getElementById('co-phone')?.value.trim();
  const a = document.getElementById('co-address')?.value.trim();
  const c = document.getElementById('co-coordinates')?.value.trim();
  const n = document.getElementById('co-notes')?.value.trim();
  const btn = document.getElementById('place-order-btn');

  // Get payment method
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';
  
  // Get POP file if Payshap
  let popBase64 = null;
  if (paymentMethod === 'payshap') {
    const popInput = document.getElementById('co-pop');
    if (popInput && popInput.files && popInput.files.length > 0) {
      popBase64 = await fileToBase64(popInput.files[0]);
    } else {
      toast('⚠️ Please upload proof of payment for Payshap orders');
      return;
    }
  }

  if (!p || !a) { toast('⚠️ Fill required fields'); return; }

  // Check cash limit
  const subtotal = Cart.total();
  if (paymentMethod === 'cash' && subtotal > 80) {
    toast('⚠️ Cash orders cannot exceed R80. Please use Payshap or remove items.');
    return;
  }

  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.textContent = 'Placing Order…';

  const discount = state.discountAmount || 0;
  const rewardDiscount = Math.min(state.rewardBalance || 0, subtotal);
  const total = Math.max(0, subtotal - discount - rewardDiscount);

  try {
    const orderData = {
      customer: { 
        name: state.user?.name || 'Guest', 
        email: state.user?.email || '', 
        phone: p, 
        address: a, 
        coordinates: c, 
        notes: n 
      },
      items: state.cart,
      total: total,
      subtotal: subtotal,
      discount: discount,
      rewardDiscount: rewardDiscount,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending_payment',
      userId: state.user?._id || null
    };

    // Add POP if Payshap
    if (paymentMethod === 'payshap' && popBase64) {
      orderData.proofOfPayment = popBase64;
    }

    const o = await placeOrder(orderData);
    
    Cart.clear();
    state.discountAmount = 0;
    state.rewardBalance = Math.max(0, state.rewardBalance - rewardDiscount);
    
    showOrderSuccessSummary(o, total, paymentMethod);
    fetchUserPoints(state.user?.email);
    updateRewardUI();
    
  } catch (err) {
    toast('❌ Failed to place order: ' + err.message);
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = 'Place Order';
  }
}

// ============================================================
//  ORDER SUCCESS SUMMARY (UPDATED)
// ============================================================

function showOrderSuccessSummary(o, total, paymentMethod) {
  const s = document.getElementById('checkout-section');
  
  const paymentMessage = paymentMethod === 'cash' 
    ? 'Pay on delivery. Our driver will contact you.'
    : 'Payment verified. We\'ll start preparing your order.';
  
  const paymentStatus = paymentMethod === 'cash' 
    ? '<span class="badge badge-warn">Pending (Cash)</span>'
    : '<span class="badge badge-warn">Awaiting POP Verification</span>';

  s.innerHTML = `
    <div class="container">
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:56px;margin-bottom:16px;">✅</div>
        <h1 style="font-family:var(--font-head);font-size:28px;margin-bottom:8px;">Order Placed Successfully!</h1>
        <p style="color:var(--muted);margin-bottom:32px;">${paymentMessage}</p>
        <div class="card" style="max-width:500px;margin:0 auto;text-align:left;">
          <div class="card-body">
            <h3 style="margin-bottom:16px;">📋 Order Summary</h3>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-200);">
              <span style="font-weight:600;">Order ID</span>
              <span style="font-family:monospace;font-weight:700;">${o.id}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-200);">
              <span style="font-weight:600;">Status</span>
              ${paymentStatus}
            </div>
            ${paymentMethod === 'payshap' ? `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-200);">
              <span style="font-weight:600;">Payment Method</span>
              <span>💳 Payshap / Instant EFT</span>
            </div>
            <div style="background:#fff5f5;padding:12px;border-radius:8px;margin:8px 0;border:1px solid #ffcccc;">
              <p style="font-size:13px;color:#DC2626;font-weight:600;">📌 Use this reference for your payment:</p>
              <p style="font-size:20px;font-weight:800;text-align:center;font-family:monospace;">${o.id}</p>
              <p style="font-size:12px;color:var(--muted);text-align:center;">Standard Bank: 10217451673</p>
            </div>
            ` : `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-200);">
              <span style="font-weight:600;">Payment Method</span>
              <span>💵 Cash on Delivery</span>
            </div>
            `}
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-200);">
              <span style="font-weight:600;">WhatsApp</span>
              <span>${o.customer?.phone}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-200);">
              <span style="font-weight:600;">Address</span>
              <span>${o.customer?.address}</span>
            </div>
            <div style="margin-top:16px;">
              <h4 style="margin-bottom:8px;">🛒 Items</h4>
              ${(o.items||[]).map(i => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
                  <span>${i.name} × ${i.qty}</span>
                  <span>R${(i.price*i.qty).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--gray-300);margin-top:12px;font-weight:800;font-size:18px;">
              <span>Total</span>
              <span>R${total.toFixed(2)}</span>
            </div>
            ${paymentMethod === 'payshap' ? `
              <p style="font-size:12px;color:#DC2626;margin-top:8px;text-align:center;font-weight:600;">
                ⚠️ Your order will be processed once POP is verified.
              </p>
            ` : `
              <p style="font-size:12px;color:var(--muted);margin-top:8px;">🎁 Points will be awarded when your order is marked as paid.</p>
            `}
          </div>
        </div>
        <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="navigateTo('home')">🏠 Continue Shopping</button>
          <button class="btn btn-outline" onclick="navigateTo('orders')">📋 My Orders</button>
        </div>
      </div>
    </div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  ORDERS
// ============================================================

async function renderOrdersPage() {
  const s = document.getElementById('orders-section');
  if (!s) return;
  if (!state.user) { s.innerHTML = '<div class="container"><div style="text-align:center;padding:80px;">🔒 Please sign in</div></div>'; return; }
  s.innerHTML = '<div class="container"><div style="text-align:center;padding:60px;">Loading…</div></div>';
  try {
    const orders = await fetchOrders();
    const myOrders = orders.filter(x => x.userId === state.user.id || x.userId === state.user._id || x.customer?.email === state.user?.email);
    s.innerHTML = `
      <div class="container">
        <h1>My Orders</h1>
        ${myOrders.length === 0 ? '<div style="text-align:center;padding:80px;">📦 No orders</div>' : `
          <table class="orders-table">
            <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${myOrders.reverse().map(o => {
                const canCancel = o.status === 'pending' || o.status === 'paid' || o.status === 'pending_payment';
                const showInvoice = o.status === 'paid' || o.status === 'completed';
                const paymentLabel = o.paymentMethod === 'cash' ? '💵 Cash' : '💳 Payshap';
                return `<tr>
                  <td style="font-weight:700;font-size:12px;">${o.id}</td>
                  <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>${o.items?.length||0}</td>
                  <td><strong>R${o.total?.toFixed(2)}</strong></td>
                  <td><span class="badge ${o.paymentMethod === 'cash' ? 'badge-success' : 'badge-info'}">${paymentLabel}</span></td>
                  <td><span class="badge ${o.status==='pending'?'badge-warn':o.status==='pending_payment'?'badge-warn':o.status==='paid'?'badge-info':o.status==='completed'?'badge-success':'badge-danger'}">${o.status === 'pending_payment' ? '⏳ Pending Pay' : o.status}</span></td>
                  <td><div style="display:flex;gap:6px;">
                    ${showInvoice ? `<button class="btn btn-outline btn-sm" onclick="viewInvoice(${JSON.stringify(o).replace(/"/g,'&quot;')})">📄</button><button class="btn btn-outline btn-sm" onclick="downloadPDF(${JSON.stringify(o).replace(/"/g,'&quot;')})">📥</button>` : '<span style="font-size:11px;color:var(--muted);">Invoice after payment</span>'}
                    ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="cancelOrder('${o.id}')">✕ Cancel</button>` : ''}
                  </div></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`}
      </div>`;
  } catch { s.innerHTML = '<div class="container"><p>Could not load orders.</p></div>'; }
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) { const err = await res.json(); toast('❌ ' + err.error); return; }
    toast('🗑 Order cancelled');
    renderOrdersPage();
  } catch { toast('❌ Failed to cancel order'); }
}

function viewInvoice(order) {
  const i = (order.items||[]).map(x => `<tr><td>${x.name}</td><td>R${x.price.toFixed(2)}</td></tr>`).join('');
  const d = new Date(order.createdAt);
  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal" style="max-width:440px;">
      <div class="modal-header"><h3>📄 Invoice</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <img src="habibiLogo.png" style="width:50px;"><div style="font-weight:700;">Quick 2 Shop</div>
        <table>${i}</table>
        <p><strong>Total: R${(order.total||0).toFixed(2)}</strong></p>
        <p>${order.customer?.name||'Customer'}</p>
        <p>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p>
        <p>${order.id}</p>
        <button class="btn btn-primary btn-sm" onclick="downloadPDF(${JSON.stringify(order).replace(/"/g,'&quot;')})">📥 Download PDF</button>
      </div>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function downloadPDF(order) {
  const i = (order.items||[]).map(x => `<tr><td>${x.name}</td><td>R${x.price.toFixed(2)}</td></tr>`).join('');
  const d = new Date(order.createdAt);
  const h = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Inter}.invoice{max-width:380px;margin:0 auto;padding:24px}.logo img{width:60px}.store-name{font-size:18px;font-weight:700}table{width:100%}</style></head><body><div class="invoice"><div class="logo"><img src="habibiLogo.png"><div class="store-name">Quick 2 Shop</div></div><table>${i}</table><p><strong>Total: R${(order.total||0).toFixed(2)}</strong></p><p>${order.customer?.name||'Customer'}</p><p>${d.toLocaleDateString()} ${d.toLocaleTimeString()}</p><p>${order.id}</p></div></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(h);
  w.document.close();
  setTimeout(() => { w.print(); toast('📄 Save as PDF') }, 500);
}

// ============================================================
//  AUTH FUNCTIONS
// ============================================================

function openAuthModal() {
  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>Welcome 🛒</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <div class="auth-tabs">
          <button class="auth-tab active" onclick="switchAuthTab('login',this)">Sign In</button>
          <button class="auth-tab" onclick="switchAuthTab('register',this)">Register</button>
        </div>
        <div id="auth-form-wrap">${loginForm()}</div>
      </div>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function loginForm() {
  return `<form onsubmit="event.preventDefault();submitLogin();"><div id="auth-error" class="form-error" style="display:none;"></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="auth-email" type="email" required></div><div class="form-group"><label class="form-label">Password</label><input class="form-input" id="auth-password" type="password" required></div><button type="submit" class="btn btn-primary btn-full" id="auth-submit-btn">Sign In</button><p style="text-align:right;margin-top:8px;"><a href="#" onclick="showForgotPasswordForm()" style="font-size:12px;">Forgot Password?</a></p></form>`;
}

function registerForm() {
  return `<form onsubmit="event.preventDefault();submitRegister();"><div id="auth-error" class="form-error" style="display:none;"></div><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="auth-name" required></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="auth-email" type="email" required></div><div class="form-group"><label class="form-label">Password</label><input class="form-input" id="auth-password" type="password" required></div><div class="form-group"><label class="form-label">Confirm Password</label><input class="form-input" id="auth-password-confirm" type="password" required></div><button type="submit" class="btn btn-primary btn-full" id="auth-submit-btn">Create Account</button></form>`;
}

function switchAuthTab(t, el) {
  document.querySelectorAll('.auth-tab').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('auth-form-wrap').innerHTML = t === 'login' ? loginForm() : registerForm();
}

function showForgotPasswordForm() {
  document.getElementById('auth-form-wrap').innerHTML = `
    <form onsubmit="event.preventDefault();requestOTP();">
      <div id="auth-error" class="form-error" style="display:none;"></div>
      <div id="auth-success" class="form-error" style="display:none;color:green;"></div>
      <p>Enter your email for an OTP.</p>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="reset-email" type="email" required></div>
      <div id="otp-fields" style="display:none;">
        <div class="form-group"><label class="form-label">OTP</label><input class="form-input" id="reset-otp" maxlength="6"></div>
        <div class="form-group"><label class="form-label">New Password</label><input class="form-input" id="reset-new-password" type="password"></div>
        <div class="form-group"><label class="form-label">Confirm</label><input class="form-input" id="reset-confirm-password" type="password"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-full" id="reset-submit-btn">Send OTP</button>
    </form>
    <p style="text-align:center;margin-top:14px;"><a href="#" onclick="switchAuthTab('login',document.querySelector('.auth-tab:first-child'))">← Back</a></p>
  `;
}

let resetEmail = '';

async function requestOTP() {
  const e = document.getElementById('reset-email').value.trim(), err = document.getElementById('auth-error'), ok = document.getElementById('auth-success'), btn = document.getElementById('reset-submit-btn');
  err.style.display = 'none';
  ok.style.display = 'none';
  if (!e) { err.textContent = 'Enter email'; err.style.display = 'block'; return; }
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const r = await fetch(`${API}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    resetEmail = e;
    document.getElementById('otp-fields').style.display = 'block';
    btn.textContent = 'Reset Password';
    btn.setAttribute('onclick', 'event.preventDefault();verifyOTPAndReset()');
    ok.textContent = 'OTP sent!';
    ok.style.display = 'block';
  } catch (x) { err.textContent = x.message; err.style.display = 'block'; } finally { btn.disabled = false; }
}

async function verifyOTPAndReset() {
  const o = document.getElementById('reset-otp').value.trim(),
    np = document.getElementById('reset-new-password').value,
    cp = document.getElementById('reset-confirm-password').value,
    err = document.getElementById('auth-error'),
    ok = document.getElementById('auth-success'),
    btn = document.getElementById('reset-submit-btn');
  if (!o || !np || !cp) { err.textContent = 'All fields required'; err.style.display = 'block'; return; }
  if (np !== cp) { err.textContent = 'Passwords mismatch'; err.style.display = 'block'; return; }
  btn.disabled = true;
  btn.textContent = 'Resetting…';
  try {
    const r = await fetch(`${API}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, otp: o, newPassword: np })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    ok.textContent = 'Password reset!';
    ok.style.display = 'block';
    setTimeout(() => switchAuthTab('login', document.querySelector('.auth-tab:first-child')), 2000);
  } catch (x) { err.textContent = x.message; err.style.display = 'block'; } finally { btn.disabled = false; btn.textContent = 'Reset Password'; }
}

async function submitLogin() {
  const e = document.getElementById('auth-email').value.trim(),
    p = document.getElementById('auth-password').value,
    err = document.getElementById('auth-error'),
    btn = document.getElementById('auth-submit-btn');
  err.style.display = 'none';
  if (!e || !p) { err.textContent = 'Fill all fields'; err.style.display = 'block'; return; }
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const u = await loginUser(e, p);
    state.user = u;
    localStorage.setItem('habibi_user', JSON.stringify(u));
    updateAuthUI();
    closeModal();
    await loadUserRewards();
    toast(`👋 Welcome, ${u.name}!`);
  } catch (x) { err.textContent = x.message; err.style.display = 'block'; } finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

async function submitRegister() {
  const n = document.getElementById('auth-name')?.value?.trim(),
    e = document.getElementById('auth-email')?.value?.trim(),
    p = document.getElementById('auth-password')?.value,
    cp = document.getElementById('auth-password-confirm')?.value,
    err = document.getElementById('auth-error'),
    btn = document.getElementById('auth-submit-btn');
  err.style.display = 'none';
  if (!n || !e || !p || !cp) { err.textContent = 'Fill all fields'; err.style.display = 'block'; return; }
  if (p !== cp) { err.textContent = 'Passwords mismatch'; err.style.display = 'block'; return; }
  btn.disabled = true;
  btn.textContent = 'Creating…';
  try {
    const u = await registerUser(n, e, p);
    state.user = u;
    localStorage.setItem('habibi_user', JSON.stringify(u));
    updateAuthUI();
    closeModal();
    await loadUserRewards();
    toast(`🎉 Welcome, ${u.name}!`);
  } catch (x) { err.textContent = x.message; err.style.display = 'block'; } finally { btn.disabled = false; btn.textContent = 'Create Account'; }
}

function logout() {
  state.user = null;
  state.points = 0;
  state.rewardBalance = 0;
  localStorage.removeItem('habibi_user');
  updateAuthUI();
  toast('👋 Signed out');
  navigateTo('home');
}

function updatePointsDisplay() {
  const btn = document.getElementById('points-btn');
  if (btn && state.user) {
    btn.style.display = 'inline-flex';
    btn.innerHTML = `🎁 ${state.points} Pts`;
  }
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn'), userDisplay = document.getElementById('user-display');
  if (state.user) {
    if (btn) btn.style.display = 'none';
    if (userDisplay) {
      userDisplay.style.display = 'flex';
      userDisplay.innerHTML = `
        <div class="user-info">
          <button id="rewards-btn" class="btn btn-sm btn-outline" onclick="showRewardsModal()" style="margin-right:8px;">
            🎁 R${state.rewardBalance.toFixed(2)}
          </button>
          <div class="user-avatar">${state.user.name[0].toUpperCase()}</div>
          <span>${state.user.name.split(' ')[0]}</span>
          <button class="btn btn-sm btn-outline" onclick="logout()">Sign out</button>
        </div>
      `;
    }
  } else {
    if (btn) btn.style.display = 'flex';
    if (userDisplay) userDisplay.style.display = 'none';
  }
}

// ============================================================
//  POINTS
// ============================================================

function showPointsModal() {
  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal" onclick="event.stopPropagation()" style="max-width:400px;">
      <div class="modal-header"><h3>🎁 My Points</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body" style="text-align:center;padding:24px;">
        <div style="font-size:48px;">🎁</div>
        <div style="font-size:32px;font-weight:800;">${state.points||0} Points</div>
        <p style="color:var(--muted);">= R${(state.points||0).toFixed(2)} discount</p>
        <p style="font-size:13px;color:var(--muted);">Earn <strong>R0.50</strong> for every <strong>R10</strong> spent.</p>
        <p style="font-size:12px;color:var(--muted);">Points are awarded when your order is marked as paid.</p>
        ${(state.points||0)>=10?`<button class="btn btn-primary btn-full" style="margin-top:16px;" onclick="usePointsNow()">Use R${state.points} Off Now</button>`:'<p style="font-size:12px;color:var(--muted);">Earn 10+ points to redeem</p>'}
      </div>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function usePointsNow() { closeModal(); navigateTo('checkout'); setTimeout(() => { if (state.points >= 10) redeemAllPoints(); }, 500); }

function redeemAllPoints() {
  if (state.points < 10) { toast('Need at least 10 points'); return; }
  fetch(`${API}/user/redeem-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: state.user.email, points: state.points })
  }).then(r => r.json()).then(d => {
    if (d.success) { state.discountAmount = state.points; state.points = 0; updatePointsDisplay(); renderCheckout(); toast(`✅ R${d.redeemed.toFixed(2)} off!`); }
    else { toast('❌ ' + d.error); }
  });
}

// ============================================================
//  LOCATION
// ============================================================

async function shareLocation() {
  if (!navigator.geolocation) { toast('⚠️ Not supported'); return; }
  const b = document.getElementById('location-btn');
  b.disabled = true;
  b.textContent = 'Getting…';
  navigator.geolocation.getCurrentPosition(async (p) => {
    const c = `${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}`);
      const d = await r.json();
      document.getElementById('co-address').value = d.display_name || `📍 ${c}`;
      document.getElementById('co-coordinates').value = c;
    } catch {
      document.getElementById('co-address').value = `📍 ${c}`;
      document.getElementById('co-coordinates').value = c;
    }
    b.disabled = false;
    b.textContent = '📍 Share My Location';
  }, () => { b.disabled = false; b.textContent = '📍 Share My Location'; toast('⚠️ Failed') });
}

// ============================================================
//  ABOUT & TERMS
// ============================================================

function showAboutUs() {
  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>About Quick 2 Shop</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <p><strong>Quick 2 Shop</strong> is your community store — fresh food, clothing, electronics & more delivered to your door.</p>
        <p>📞 WhatsApp: <strong>072 405 2868</strong></p>
        <p>📧 habibishoppingsa@gmail.com</p>
      </div>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showTerms() {
  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>Terms & Conditions</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <h4>1. Orders</h4><p>Subject to availability.</p>
        <h4>2. Pricing</h4><p>In ZAR, incl VAT.</p>
        <h4>3. Payment</h4><p>Cash on delivery or Instant EFT.</p>
        <h4>4. Delivery</h4><p>Free in our area.</p>
        <h4>5. Returns</h4><p>Within 24 hours.</p>
        <h4>6. Privacy</h4><p>Never shared.</p>
      </div>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ============================================================
//  ROUTING
// ============================================================

function navigateTo(p) {
  state.currentPage = p;
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  const t = document.getElementById(`page-${p}`);
  if (t) t.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === p));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeCart();
  if (p === 'home') { loadProducts(); loadHeroSlideshow(); }
  if (p === 'checkout') renderCheckout();
  if (p === 'orders') renderOrdersPage();
}

// ============================================================
//  INIT
// ============================================================

async function init() {
  updateCartUI();
  updateAuthUI();

  const u = localStorage.getItem('habibi_user');
  if (u) {
    try {
      state.user = JSON.parse(u);
      await loadUserRewards();
    } catch {
      localStorage.removeItem('habibi_user');
    }
  }

  await renderCategories();
  await loadProducts();
  await loadHeroSlideshow();

  window.addEventListener('scroll', () =>
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20)
  );

  const si = document.getElementById('search-input');
  if (si) {
    let d;
    si.addEventListener('input', e => {
      clearTimeout(d);
      state.searchQuery = e.target.value;
      d = setTimeout(() => loadProducts(), 350);
    });
  }

  const ss = document.getElementById('sort-select');
  if (ss) {
    ss.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderProducts(state.products);
    });
  }

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });
  document.getElementById('hamburger')?.addEventListener('click', () =>
    document.querySelector('.nav-links').classList.toggle('mobile-open')
  );
}

document.addEventListener('DOMContentLoaded', init);