const API = '/api';

// ============================================================
//  DELIVERY CONFIGURATION
// ============================================================

const DELIVERY_FEE = 5; // Flat R5 for Braamfontein
const DELIVERY_AREA = 'Braamfontein';
const DELIVERY_NOTE = '🚚 Deliveries are currently available in Braamfontein only.';

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
//  ANALYTICS TRACKING
// ============================================================

// Track page views and user behavior
async function trackAnalytics(eventType, data = {}) {
  try {
    const sessionId = getSessionId();
    const userId = state.user?._id || null;
    
    const payload = {
      sessionId: sessionId,
      userId: userId,
      eventType: eventType,
      data: data,
      url: window.location.pathname,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for offline tracking
    const offlineEvents = JSON.parse(localStorage.getItem('analytics_offline') || '[]');
    offlineEvents.push(payload);
    localStorage.setItem('analytics_offline', JSON.stringify(offlineEvents));
    
    // Send to server
    const response = await fetch(`${API}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      localStorage.setItem('analytics_offline', '[]');
    }
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
}

function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    sessionStorage.setItem('analytics_session_id', sessionId);
    sessionStorage.setItem('analytics_session_start', Date.now().toString());
  }
  return sessionId;
}

function trackPageView(pageName) {
  const sessionStart = parseInt(sessionStorage.getItem('analytics_session_start') || Date.now());
  const timeOnPage = Date.now() - sessionStart;
  trackAnalytics('page_view', {
    page: pageName || document.title,
    timeOnPage: timeOnPage,
    sessionDuration: timeOnPage
  });
}

function trackProductView(product) {
  trackAnalytics('product_view', {
    productId: product._id || product.id,
    productName: product.name,
    productCategory: product.category,
    productPrice: product.price
  });
}

function trackAddToCart(product, quantity) {
  trackAnalytics('add_to_cart', {
    productId: product._id || product.id,
    productName: product.name,
    quantity: quantity || 1,
    price: product.price,
    cartTotal: Cart.total()
  });
}

function trackCheckoutStart() {
  trackAnalytics('checkout_start', {
    cartItems: state.cart.length,
    cartTotal: Cart.total()
  });
}

function trackPurchase(order) {
  trackAnalytics('purchase', {
    orderId: order.id,
    orderTotal: order.total,
    itemCount: order.items?.length || 0,
    paymentMethod: order.paymentMethod
  });
}

function trackSessionEnd() {
  const sessionStart = parseInt(sessionStorage.getItem('analytics_session_start') || Date.now());
  const sessionDuration = Date.now() - sessionStart;
  trackAnalytics('session_end', {
    sessionDuration: sessionDuration,
    pagesViewed: sessionStorage.getItem('analytics_pages') || '[]'
  });
}

function trackNavigation(from, to) {
  let pagesViewed = JSON.parse(sessionStorage.getItem('analytics_pages') || '[]');
  pagesViewed.push({
    page: to,
    from: from,
    timestamp: new Date().toISOString()
  });
  sessionStorage.setItem('analytics_pages', JSON.stringify(pagesViewed));
}

// ============================================================
//  USER ADDRESS MANAGEMENT
// ============================================================

function saveUserAddress(addressData) {
  if (!state.user) {
    toast('⚠️ Please sign in to save your address');
    return;
  }
  
  const savedAddresses = JSON.parse(localStorage.getItem('habibi_addresses') || '[]');
  const addressId = addressData.id || Date.now().toString();
  const existingIndex = savedAddresses.findIndex(a => 
    a.address === addressData.address && a.userId === state.user._id
  );
  
  if (existingIndex > -1) {
    savedAddresses[existingIndex] = { 
      ...savedAddresses[existingIndex],
      ...addressData, 
      id: savedAddresses[existingIndex].id || addressId,
      userId: state.user._id, 
      updatedAt: new Date().toISOString() 
    };
  } else {
    const newAddress = { 
      ...addressData, 
      id: addressId,
      userId: state.user._id,
      createdAt: new Date().toISOString(),
      isDefault: savedAddresses.length === 0
    };
    savedAddresses.push(newAddress);
  }
  
  localStorage.setItem('habibi_addresses', JSON.stringify(savedAddresses));
  
  if (state.user) {
    state.user.address = addressData.address;
    state.user.phone = addressData.phone || state.user.phone;
    localStorage.setItem('habibi_user', JSON.stringify(state.user));
  }
  
  toast('✅ Address saved!');
  renderCheckout();
}

function getUserAddresses() {
  if (!state.user) return [];
  const savedAddresses = JSON.parse(localStorage.getItem('habibi_addresses') || '[]');
  return savedAddresses.filter(a => a.userId === state.user._id);
}

function getDefaultAddress() {
  const addresses = getUserAddresses();
  return addresses.find(a => a.isDefault) || addresses[0] || null;
}

function deleteSavedAddress(addressId) {
  let addresses = JSON.parse(localStorage.getItem('habibi_addresses') || '[]');
  addresses = addresses.filter(a => a.id !== addressId && a.address !== addressId);
  localStorage.setItem('habibi_addresses', JSON.stringify(addresses));
  renderCheckout();
  toast('🗑️ Address removed');
}

function setDefaultAddress(addressId) {
  let addresses = JSON.parse(localStorage.getItem('habibi_addresses') || '[]');
  addresses = addresses.map(a => ({
    ...a,
    isDefault: a.id === addressId || a.address === addressId
  }));
  localStorage.setItem('habibi_addresses', JSON.stringify(addresses));
  renderCheckout();
  toast('⭐ Default address updated');
}

function loadSavedAddress(address) {
  document.getElementById('co-address').value = address;
  toast('📂 Address loaded');
}

function saveCurrentAddress() {
  const address = document.getElementById('co-address')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  
  if (!address) {
    toast('⚠️ Please enter an address first');
    return;
  }
  
  if (!state.user) {
    toast('⚠️ Please sign in to save addresses');
    return;
  }
  
  saveUserAddress({ address, phone });
}

// ============================================================
//  GENERATE PAYMENT REFERENCE
// ============================================================

let paymentReference = '';

function generatePaymentReference() {
  const prefix = 'PAY';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================
//  SPECIALS HELPERS
// ============================================================

function getProductSpecial(product) {
  if (!product || !product.special) return null;
  const special = product.special;
  if (special.expiresAt && new Date(special.expiresAt) < new Date()) {
    return null;
  }
  return special;
}

function getSpecialPrice(product, quantity) {
  const special = getProductSpecial(product);
  if (!special) return product.price * quantity;
  const sets = Math.floor(quantity / special.quantity);
  const remainder = quantity % special.quantity;
  return (sets * special.price) + (remainder * product.price);
}

function getSpecialLabel(product) {
  const special = getProductSpecial(product);
  if (!special) return null;
  return special.label;
}

function isSpecialActive(product) {
  return getProductSpecial(product) !== null;
}

// ============================================================
//  CART FUNCTIONS
// ============================================================

const Cart = {
  save() { 
    localStorage.setItem('habibi_cart', JSON.stringify(state.cart)); 
  },
  
  add(p) {
    const productId = p._id || p.id;
    const e = state.cart.find(i => (i._id === productId || i.id === productId));
    
    if (e) {
      e.qty = Math.min(e.qty + 1, p.stock || 99);
    } else {
      state.cart.push({ 
        ...p, 
        qty: 1,
        id: productId,
        _id: productId
      });
    }
    this.save();
    updateCartUI();
    updateCartRewardProgress();
    trackAddToCart(p, 1);
    toast(`✅ ${p.name} added`);
  },
  
  remove(id) {
    state.cart = state.cart.filter(i => {
      const itemId = i._id || i.id;
      return String(itemId) !== String(id);
    });
    this.save();
    updateCartUI();
    renderCartItems();
    updateCartRewardProgress();
  },
  
  updateQty(id, d) {
    const i = state.cart.find(x => {
      const itemId = x._id || x.id;
      return String(itemId) === String(id);
    });
    
    if (!i) return;
    
    const newQty = i.qty + d;
    if (newQty < 1) {
      this.remove(id);
      return;
    }
    
    i.qty = Math.min(newQty, i.stock || 99);
    this.save();
    updateCartUI();
    renderCartItems();
    updateCartRewardProgress();
  },
  
  total() { 
    let subtotal = 0;
    state.cart.forEach(item => {
      const product = state.products.find(p => {
        const pId = p._id || p.id;
        const itemId = item._id || item.id;
        return String(pId) === String(itemId);
      });
      const special = getProductSpecial(product);
      if (special && item.qty >= special.quantity) {
        const sets = Math.floor(item.qty / special.quantity);
        const remainder = item.qty % special.quantity;
        subtotal += (sets * special.price) + (remainder * item.price);
      } else {
        subtotal += item.price * item.qty;
      }
    });
    return subtotal;
  },
  
  count() { 
    return state.cart.reduce((s, i) => s + i.qty, 0); 
  },
  
  clear() {
    state.cart = [];
    this.save();
    updateCartUI();
    renderCartItems();
    updateCartRewardProgress();
  },
  
  deliveryFee() {
    return DELIVERY_FEE;
  },
  
  totalWithDelivery() {
    return this.total() + this.deliveryFee();
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
          <div style="font-size:32px;font-weight:800;color:var(--orange);">R${state.rewardBalance.toFixed(2)}</div>
          <div style="color:var(--muted);">${tierLabels[state.tier] || 'Bronze'} Tier</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:16px 0;">
          <div style="background:var(--surface);padding:12px;border-radius:8px;text-align:center;">
            <div style="font-weight:700;font-size:18px;color:var(--orange);">${state.totalRewardsEarned || 0}</div>
            <div style="font-size:11px;color:var(--muted);">Rewards Earned</div>
          </div>
          <div style="background:var(--surface);padding:12px;border-radius:8px;text-align:center;">
            <div style="font-weight:700;font-size:18px;color:var(--orange);">${state.streak?.count || 0}</div>
            <div style="font-size:11px;color:var(--muted);">Week Streak</div>
          </div>
          <div style="background:var(--surface);padding:12px;border-radius:8px;text-align:center;">
            <div style="font-weight:700;font-size:18px;color:var(--orange);">${state.subscription?.active ? '✅' : '❌'}</div>
            <div style="font-size:11px;color:var(--muted);">Subscription</div>
          </div>
        </div>
        <div style="background:var(--surface);padding:16px;border-radius:8px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:4px;">
            <span>Next Reward</span>
            <span>${state.rewardProgress?.itemsNeededForNext || '0'} items needed</span>
          </div>
          <div style="background:var(--gray-200);height:6px;border-radius:99px;overflow:hidden;">
            <div style="background:var(--orange);height:100%;width:${100 - (state.rewardProgress?.itemsNeededForNext / 10 * 100) || 0}%;border-radius:99px;"></div>
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
            <button class="btn btn-sm ${state.subscription?.active ? 'btn-outline' : 'btn-orange'}"
                    onclick="closeModal();${state.subscription?.active ? 'showUnsubscribeModal()' : 'showSubscribeModal()'}">
              ${state.subscription?.active ? 'Manage' : 'Subscribe'}
            </button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${state.rewardBalance >= 2 ? `
            <button class="btn btn-orange btn-sm" onclick="closeModal();redeemRewards()">
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
            <div style="font-size:20px;font-weight:800;color:var(--orange);">R50<span style="font-size:14px;font-weight:400;color:var(--muted);">/mo</span></div>
            <ul style="text-align:left;font-size:12px;color:var(--muted);list-style:none;padding:0;margin:8px 0;">
              <li>✅ R2 monthly bonus</li>
              <li>✅ Free delivery</li>
              <li>✅ 5% off all orders</li>
            </ul>
            <button class="btn btn-orange btn-sm" onclick="event.stopPropagation();subscribeToTier('basic')">Subscribe</button>
          </div>
          <div style="border:2px solid var(--orange);border-radius:12px;padding:16px;text-align:center;cursor:pointer;position:relative;"
               onclick="subscribeToTier('premium')">
            <span style="position:absolute;top:-8px;right:8px;background:var(--orange);color:white;font-size:10px;padding:2px 10px;border-radius:99px;">BEST</span>
            <div style="font-size:24px;">💎</div>
            <div style="font-weight:700;">Premium</div>
            <div style="font-size:20px;font-weight:800;color:var(--orange);">R100<span style="font-size:14px;font-weight:400;color:var(--muted);">/mo</span></div>
            <ul style="text-align:left;font-size:12px;color:var(--muted);list-style:none;padding:0;margin:8px 0;">
              <li>✅ R5 monthly bonus</li>
              <li>✅ Free delivery</li>
              <li>✅ 10% off all orders</li>
              <li>✅ Free item monthly</li>
            </ul>
            <button class="btn btn-orange btn-sm" onclick="event.stopPropagation();subscribeToTier('premium')">Subscribe</button>
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
    renderCategories();
    
    // Track product load
    if (p.length > 0) {
      trackAnalytics('products_loaded', {
        count: p.length,
        category: state.currentCategory
      });
    }
    
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
    
    const special = getProductSpecial(p);
    const isSpecialActive = special !== null;
    const specialLabel = isSpecialActive ? special.label : '';
    
    let specialDisplay = '';
    if (isSpecialActive) {
      specialDisplay = `
        <div class="special-deal">
          🔥 ${specialLabel}
        </div>`;
    }

    html += `
      <div class="product-card" onclick="openProductModal('${productId}')">
        <div class="product-img-wrap">
          <img src="${imageUrl}" loading="lazy" onerror="this.src='https://via.placeholder.com/320x320?text=📦'">
          ${isSpecialActive ? `<span class="product-badge badge-orange">🔥 DEAL</span>` : ''}
          ${lowStock && !isOutOfStock ? `<span class="product-badge badge badge-warn">Only ${stock} left</span>` : ''}
          ${isOutOfStock ? `<span class="product-badge badge" style="background:#f1f1f1">Out of stock</span>` : ''}
          <button class="product-wishlist" onclick="event.stopPropagation();toggleWishlist('${productId}',this)">
            ${Wishlist.has(productId) ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-body">
          <div class="product-cat">${category}</div>
          <div class="product-name">${name}</div>
          ${specialDisplay}
          ${description ? `<div class="product-desc">${description}</div>` : ''}
          <div class="product-rating">
            <span class="stars">${starsHTML(rating)}</span>
            <span>${Number(rating).toFixed(1)} (${reviews || 0})</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              ${isSpecialActive ? 
                `<span class="original">R${Number(price).toFixed(2)}</span>
                 <span class="special-price">R${Number(special.price).toFixed(2)}</span>
                 <span class="special-label">${specialLabel}</span>` :
                `R${Number(price).toFixed(2)}`
              }
            </div>
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

    const activeCategories = cats.filter(c => {
      return state.products.some(p => p.category === c.id);
    });

    console.log('🏷️ Active categories (with products):', activeCategories.length);

    if (activeCategories.length === 0) {
      g.innerHTML = `
        <div class="cat-card" style="grid-column:1/-1;cursor:default;border-color:var(--gray-200);">
          No categories with products yet. Add some products in the admin panel.
        </div>
      `;
      return;
    }

    let html = `
      <div class="cat-card active" data-cat="all" onclick="filterCategory('all',this)">
        <span class="cat-icon">📋</span>
        All
      </div>
    `;

    activeCategories.forEach(c => {
      const icon = c.icon || '🏷️';
      const label = c.label || c.id;
      const catId = c.id;
      
      html += `
        <div class="cat-card" data-cat="${catId}" onclick="filterCategory('${catId}',this)">
          <span class="cat-icon">${icon}</span>
          ${label}
        </div>
      `;
    });

    g.innerHTML = html;
    console.log('🏷️ Categories rendered:', activeCategories.length + 1, 'including "All"');
    
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
    const pId = p._id || p.id;
    return String(pId) === String(id);
  });
  
  if (p) {
    console.log('🛒 Found product:', p.name);
    Cart.add(p);
  } else {
    console.warn('⚠️ Product not found with ID:', id);
    const p2 = state.products.find(p => String(p._id) === String(id));
    if (p2) {
      console.log('🛒 Found product by _id:', p2.name);
      Cart.add(p2);
    } else {
      toast('⚠️ Product not found');
    }
  }
}