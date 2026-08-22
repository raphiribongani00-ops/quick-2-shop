const API = '/api';

// ============================================================
//  DELIVERY CONFIGURATION
// ============================================================

const DELIVERY_FEE = 10;
const DELIVERY_AREA = 'Braamfontein';
const DELIVERY_NOTE = '🚚 Deliveries are currently available in Braamfontein, Doornfontein, Parktown & Auckland Park.';

// ============================================================
//  BRAAMFONTEIN BUILDINGS DATABASE - COMPLETE LIST
// ============================================================

const BRAAMFONTEIN_BUILDINGS = [
  // ===== UNIVERSITY RESIDENCES =====
  { name: "UJ Kingsway Campus Residences", address: "Kingsway Avenue, Braamfontein", area: "braamfontein" },
  { name: "UJ APK Residences", address: "University of Johannesburg, Braamfontein", area: "braamfontein" },
  { name: "UJ Soweto Campus Residences", address: "Soweto, Braamfontein", area: "braamfontein" },
  { name: "UJ Doornfontein Campus Residences", address: "Doornfontein, Braamfontein", area: "doornfontein" },
  { name: "UJ Auckland Park Residences", address: "Auckland Park, Johannesburg", area: "aucklandpark" },
  { name: "Wits Junction", address: "Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "Wits Junction Park", address: "Ennis Road, Braamfontein", area: "braamfontein" },
  { name: "Wits East Campus Residences", address: "Braamfontein", area: "braamfontein" },
  { name: "Wits West Campus Residences", address: "Braamfontein", area: "braamfontein" },
  { name: "Wits Braamfontein Campus", address: "Braamfontein", area: "braamfontein" },
  { name: "Wits Parktown Residences", address: "Parktown, Johannesburg", area: "parktown" },
  
  // ===== SOUTH POINT RESIDENCES =====
  { name: "South Point - 56 Jorissen", address: "56 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 2 De Korte", address: "2 De Korte Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 8 De Korte", address: "8 De Korte Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 22 De Korte", address: "22 De Korte Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 31 Jorissen", address: "31 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 36 Jorissen", address: "36 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 69 Jorissen", address: "69 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 105 Jorissen", address: "105 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 114 Jorissen", address: "114 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 120 Jorissen", address: "120 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 128 Jorissen", address: "128 Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "South Point - 134 Jorissen", address: "134 Jorissen Street, Braamfontein", area: "braamfontein" },
  
  // ===== OTHER STUDENT ACCOMMODATION =====
  { name: "The Lab Res", address: "Braamfontein", area: "braamfontein" },
  { name: "The Lofts", address: "Biccard Street, Braamfontein", area: "braamfontein" },
  { name: "Campus Village", address: "Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "Braamfontein Student Village", address: "Jorissen Street, Braamfontein", area: "braamfontein" },
  { name: "Wits 1952", address: "Braamfontein", area: "braamfontein" },
  { name: "The Edge", address: "D streets, Braamfontein", area: "braamfontein" },
  { name: "The Square", address: "Braamfontein", area: "braamfontein" },
  
  // ===== DOORNFONTEIN =====
  { name: "Doornfontein Towers", address: "Doornfontein, Johannesburg", area: "doornfontein" },
  { name: "Bezuidenhout Street Apartments", address: "Bezuidenhout Street, Doornfontein", area: "doornfontein" },
  { name: "Twist Street Residences", address: "Twist Street, Doornfontein", area: "doornfontein" },
  { name: "De Villiers Court", address: "De Villiers Street, Doornfontein", area: "doornfontein" },
  { name: "Goud Street Student Accommodation", address: "Goud Street, Doornfontein", area: "doornfontein" },
  { name: "Doornfontein Student Village", address: "Doornfontein, Johannesburg", area: "doornfontein" },
  
  // ===== PARKTOWN =====
  { name: "Parktown Heights", address: "Parktown, Johannesburg", area: "parktown" },
  { name: "York Road Apartments", address: "York Road, Parktown", area: "parktown" },
  { name: "Jan Smuts Avenue Residences", address: "Jan Smuts Avenue, Parktown", area: "parktown" },
  { name: "Riviera Court", address: "Riviera, Parktown", area: "parktown" },
  { name: "Oxford Street Apartments", address: "Oxford Street, Parktown", area: "parktown" },
  { name: "Parktown Student Village", address: "Parktown, Johannesburg", area: "parktown" },
  
  // ===== AUCKLAND PARK =====
  { name: "Auckland Park Heights", address: "Auckland Park, Johannesburg", area: "aucklandpark" },
  { name: "Greenhill Apartments", address: "Greenhill, Auckland Park", area: "aucklandpark" },
  { name: "Greenwood Court", address: "Greenwood, Auckland Park", area: "aucklandpark" },
  { name: "Marthin Street Residences", address: "Marthin Street, Auckland Park", area: "aucklandpark" },
  { name: "University View Apartments", address: "University View, Auckland Park", area: "aucklandpark" },
  { name: "Auckland Park Student Village", address: "Auckland Park, Johannesburg", area: "aucklandpark" },
  
  // ===== APARTMENTS & BUILDINGS =====
  { name: "Auckland House", address: "Kingsway Avenue, Braamfontein", area: "braamfontein" },
  { name: "Braamfontein Towers", address: "Biccard Street, Braamfontein", area: "braamfontein" },
  { name: "Metropolitan Tower", address: "Kingsway Avenue, Braamfontein", area: "braamfontein" },
  { name: "Braamfontein Centre", address: "Melle Street, Braamfontein", area: "braamfontein" },
  { name: "The Annex", address: "Ennis Road, Braamfontein", area: "braamfontein" },
  { name: "City Lights", address: "Empire Road, Braamfontein", area: "braamfontein" },
  { name: "Braamfontein Gateway", address: "Braamfontein", area: "braamfontein" },
  
  // ===== MANUAL ENTRY =====
  { name: "Other (Manual Entry)", address: "", area: "braamfontein" }
];

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

async function registerUser(n, e, p, w, a) {
  const r = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: n, email: e, password: p, whatsapp: w, address: a })
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
}

function getTierIcon(tier) {
  const icons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  return icons[tier] || '🥉';
}

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
      state.user.isStudent = data.isStudent || false;
      state.user.studentVerified = data.studentVerified || false;
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
//  PRODUCTS & CATEGORIES - FIXED
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
    
    // Call renderCategories AFTER products are loaded
    await renderCategories();
    
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
    renderCategories();
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

    // If no products are loaded yet, try to load them first
    if (state.products.length === 0) {
      await loadProducts();
      return;
    }

    const activeCategories = cats.filter(c => {
      return state.products.some(p => p.category === c.id);
    });

    console.log('🏷️ Active categories (with products):', activeCategories.length);

    // If no active categories, show "All" and a message
    let html = '';
    
    if (activeCategories.length === 0) {
      html = `
        <div class="cat-card active" data-cat="all" onclick="filterCategory('all',this)">
          <span class="cat-icon">📋</span>
          All
        </div>
        <div class="cat-card" style="grid-column:1/-1;cursor:default;border-color:var(--gray-200);color:var(--muted);">
          No products found. Add some in the admin panel.
        </div>
      `;
      g.innerHTML = html;
      return;
    }

    html = `
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
  
  const special = getProductSpecial(p);
  const isSpecialActive = special !== null;
  const specialDisplay = isSpecialActive ? 
    `<div class="modal-special-banner">
      🔥 ${special.label} — SAVE R${((price * special.quantity) - special.price).toFixed(2)}
      ${special.expiresAt ? `<div class="expiry">Expires: ${new Date(special.expiresAt).toLocaleDateString()}</div>` : ''}
    </div>` : '';

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
        ${specialDisplay}
        <div class="modal-product-desc">${p.description || ''}</div>
        <div class="modal-product-price">
          ${isSpecialActive ? 
            `<span class="original">R${Number(price).toFixed(2)}</span>
             <span class="special">R${Number(special.price).toFixed(2)}</span>
             <div style="font-size:14px;color:var(--muted);">${special.label}</div>` :
            `R${Number(price).toFixed(2)}`
          }
        </div>
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
  }
}

// ============================================================
//  RENDER CART ITEMS
// ============================================================

function renderCartItems() {
  const c = document.getElementById('cart-items');
  if (!c) return;

  if (state.cart.length === 0) {
    c.innerHTML = `
      <div class="cart-empty">
        <div style="font-size:48px">🛒</div>
        <p>Your cart is empty.</p>
        <button class="btn btn-primary" onclick="closeCart()" style="margin-top:12px;">Start Shopping</button>
      </div>
    `;
    document.getElementById('cart-subtotal').textContent = 'R0.00';
    document.getElementById('cart-delivery').textContent = 'R10.00';
    document.getElementById('cart-total').textContent = 'R0.00';
    return;
  }

  c.innerHTML = state.cart.map(item => {
    const itemId = item._id || item.id;
    
    const product = state.products.find(p => {
      const pId = p._id || p.id;
      return String(pId) === String(itemId);
    });
    
    const special = getProductSpecial(product);
    const isSpecialActive = special !== null;
    
    let displayTotal = item.price * item.qty;
    let specialLabel = '';
    if (isSpecialActive && item.qty >= special.quantity) {
      const sets = Math.floor(item.qty / special.quantity);
      const remainder = item.qty % special.quantity;
      displayTotal = (sets * special.price) + (remainder * item.price);
      specialLabel = `🔥 ${special.label} applied!`;
    }
    
    const imageUrl = item.image || 'https://via.placeholder.com/70x70?text=📦';
    
    return `
      <div class="cart-item" data-id="${itemId}">
        <img class="cart-item-img" src="${imageUrl}" onerror="this.src='https://via.placeholder.com/70x70?text=📦'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name || 'Product'}</div>
          <div class="cart-item-price">R${(item.price || 0).toFixed(2)} each</div>
          ${specialLabel ? `<div class="cart-item-special">${specialLabel}</div>` : ''}
          <div class="cart-item-controls">
            <button class="qty-btn" data-id="${itemId}" data-change="-1" aria-label="Decrease quantity">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-id="${itemId}" data-change="1" aria-label="Increase quantity">+</button>
            <button class="remove-item" data-id="${itemId}" aria-label="Remove item">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  c.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const change = parseInt(this.dataset.change);
      if (id && change) {
        Cart.updateQty(id, change);
      }
    });
  });

  c.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      if (id) {
        Cart.remove(id);
      }
    });
  });

  const subtotal = Cart.total();
  const deliveryFee = Cart.deliveryFee();
  const total = subtotal + deliveryFee;
  
  const deliveryDisplay = `R${deliveryFee.toFixed(2)}`;
  const deliveryNote = '🚚 Deliveries are currently available in Braamfontein, Doornfontein, Parktown & Auckland Park.';
  
  document.getElementById('cart-subtotal').textContent = `R${subtotal.toFixed(2)}`;
  document.getElementById('cart-delivery').textContent = deliveryDisplay;
  document.getElementById('cart-total').textContent = `R${total.toFixed(2)}`;
  
  const deliveryNoteEl = document.getElementById('cart-delivery-note');
  if (deliveryNoteEl) {
    deliveryNoteEl.textContent = deliveryNote;
    deliveryNoteEl.style.display = 'block';
  }
  
  updateCartUI();
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
//  BUILDING SEARCH
// ============================================================

let allBuildings = [];

async function loadBuildings() {
  try {
    const response = await fetch('/api/buildings');
    if (response.ok) {
      allBuildings = await response.json();
    }
  } catch (err) {
    console.error('Failed to load buildings:', err);
  }
}

function searchBuildings(query) {
  const resultsContainer = document.getElementById('building-results');
  if (!resultsContainer) return;

  if (!query || query.length < 2) {
    resultsContainer.style.display = 'none';
    return;
  }

  const filtered = allBuildings.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<div style="padding:8px;color:var(--muted);">No buildings found. Please enter address manually.</div>';
    resultsContainer.style.display = 'block';
    return;
  }

  resultsContainer.innerHTML = filtered.map(b => `
    <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);hover:background:var(--orange-light);"
         onclick="selectBuilding('${b.name}', '${b.area || 'braamfontein'}')">
      <strong>${b.name}</strong>
      <span style="font-size:11px;color:var(--muted);">${b.area || ''}</span>
    </div>
  `).join('');
  resultsContainer.style.display = 'block';
}

function selectBuilding(name, area) {
  const addressInput = document.getElementById('co-address');
  const streetInput = document.getElementById('co-street');
  
  const building = allBuildings.find(b => b.name === name);
  if (building) {
    streetInput.value = building.address || name;
    addressInput.value = building.address || name;
  } else {
    streetInput.value = name;
    addressInput.value = name;
  }
  
  document.getElementById('building-results').style.display = 'none';
  document.getElementById('building-search').value = name;
  
  detectAddressAndFee();
  toast(`✅ ${name} selected`);
}

// ============================================================
//  DELIVERY FEE DETECTION
// ============================================================

async function detectAddressAndFee() {
  const address = document.getElementById('co-address')?.value || '';
  const street = document.getElementById('co-street')?.value || '';
  const fullAddress = address || street;
  
  if (!fullAddress || fullAddress.length < 3) {
    localStorage.removeItem('delivery_fee');
    localStorage.removeItem('delivery_area');
    return;
  }

  try {
    const response = await fetch(`/api/delivery/fee?address=${encodeURIComponent(fullAddress)}`);
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('delivery_fee', data.fee);
      localStorage.setItem('delivery_area', data.label);
      
      // Update the delivery fee display
      const deliveryDisplay = document.querySelector('.order-line .delivery-fee');
      if (deliveryDisplay) {
        deliveryDisplay.textContent = `R${data.fee.toFixed(2)}`;
      }
    }
  } catch (err) {
    console.error('Failed to detect delivery fee:', err);
  }
}

// ============================================================
//  STUDENT VERIFICATION
// ============================================================

async function uploadStudentProof() {
  const fileInput = document.getElementById('student-proof-input');
  const file = fileInput?.files?.[0];
  
  if (!file) {
    toast('⚠️ Please select a file');
    return;
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    toast('⚠️ File too large. Maximum 5MB');
    return;
  }

  // Check file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast('⚠️ Please upload PDF, JPG, PNG, or WebP');
    return;
  }

  if (!state.user) {
    toast('⚠️ Please sign in first');
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const base64 = e.target.result;
      
      const response = await fetch('/api/user/verify-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.user._id,
          proofBase64: base64
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast('✅ Proof submitted! Pending verification.');
        setTimeout(() => loadUserData(), 1000);
      } else {
        toast('❌ ' + data.error);
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    toast('❌ Upload failed: ' + err.message);
  }
}

// ============================================================
//  PROFILE PICTURE UPLOAD
// ============================================================

async function uploadProfilePicture() {
  const fileInput = document.getElementById('profile-pic-input');
  const file = fileInput?.files?.[0];
  
  if (!file) {
    toast('⚠️ Please select a picture');
    return;
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    toast('⚠️ File too large. Maximum 5MB');
    return;
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast('⚠️ Please upload JPG, PNG, or WebP');
    return;
  }

  if (!state.user) {
    toast('⚠️ Please sign in first');
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const base64 = e.target.result;
      
      const response = await fetch(`/api/user/${state.user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profilePicture: base64
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        state.user = data;
        localStorage.setItem('habibi_user', JSON.stringify(data));
        toast('✅ Profile picture updated!');
        updateAuthUI();
        renderProfilePage();
      } else {
        toast('❌ ' + data.error);
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    toast('❌ Upload failed: ' + err.message);
  }
}

// ============================================================
//  PROFILE PAGE - FIXED
// ============================================================

function renderProfilePage() {
  const s = document.getElementById('profile-section');
  if (!s) {
    const container = document.createElement('section');
    container.id = 'profile-section';
    container.className = 'profile-section';
    container.style.padding = 'calc(var(--nav-h) + 20px) 0 60px';
    container.style.minHeight = '100vh';
    document.body.appendChild(container);
  }
  
  const section = document.getElementById('profile-section');
  if (!section) return;
  
  if (!state.user) {
    section.innerHTML = '<div class="container"><div style="text-align:center;padding:80px;">🔒 Please sign in</div></div>';
    return;
  }

  const isStudent = state.user.isStudent || false;
  const studentVerified = state.user.studentVerified || false;
  const studentProof = state.user.studentProof || null;
  const discountActive = isStudent && new Date() < new Date('2026-09-30');
  const profilePic = state.user.profilePicture || '';

  section.innerHTML = `
    <div class="container">
      <h1 style="font-size:24px;font-weight:800;margin-bottom:20px;">👤 My Profile</h1>
      
      <div class="checkout-card">
        <h3>Profile Picture</h3>
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <div style="width:100px;height:100px;border-radius:50%;background:var(--surface);border:3px solid var(--orange);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${profilePic ? 
              `<img src="${profilePic}" style="width:100%;height:100%;object-fit:cover;">` :
              `<span style="font-size:40px;font-weight:700;color:var(--gray-500);">${state.user.name[0].toUpperCase()}</span>`
            }
          </div>
          <div>
            <input type="file" id="profile-pic-input" accept="image/jpeg,image/png,image/webp" style="margin-bottom:8px;">
            <button class="btn btn-primary btn-sm" id="upload-pic-btn">📷 Upload Picture</button>
            <p style="font-size:11px;color:var(--muted);margin-top:4px;">JPG, PNG, WebP • Max 5MB</p>
          </div>
        </div>
      </div>

      <div class="checkout-card">
        <h3>Personal Information</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><strong>Name:</strong> ${state.user.name}</div>
          <div><strong>Email:</strong> ${state.user.email}</div>
          <div><strong>WhatsApp:</strong> ${state.user.whatsapp || 'Not set'}</div>
          <div><strong>Address:</strong> ${state.user.address || 'Not set'}</div>
          <div><strong>Member Since:</strong> ${new Date(state.user.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-outline btn-sm" onclick="editWhatsApp()">✏️ Update WhatsApp</button>
          <button class="btn btn-outline btn-sm" onclick="editAddress()">✏️ Update Address</button>
        </div>
      </div>

      <div class="checkout-card">
        <h3>🎓 Student Status</h3>
        ${studentVerified ? `
          <div style="background:#E8F5E9;padding:16px;border-radius:8px;border-left:4px solid #4CAF50;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:24px;">✅</span>
              <div>
                <strong style="color:#2E7D32;">Verified Student</strong>
                <p style="font-size:13px;color:#2E7D32;margin:0;">
                  ${discountActive ? 
                    `🎉 20% off delivery fee • Valid until ${new Date('2026-09-30').toLocaleDateString()}` :
                    '⚠️ Discount has expired. Please re-verify.'
                  }
                </p>
              </div>
            </div>
          </div>
        ` : studentProof ? `
          <div style="background:#FFF8E1;padding:16px;border-radius:8px;border-left:4px solid #FFA726;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:24px;">⏳</span>
              <div>
                <strong style="color:#E65100;">Pending Verification</strong>
                <p style="font-size:13px;color:#E65100;margin:0;">Your proof is being reviewed. You'll be notified once approved.</p>
              </div>
            </div>
          </div>
        ` : `
          <div style="background:#FFF3E0;padding:16px;border-radius:8px;border-left:4px solid #FF9800;margin-bottom:12px;">
            <p style="margin-bottom:8px;"><strong>Become a verified student and get 20% off delivery fees!</strong></p>
            <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">
              Upload your proof of registration (PDF or image) to verify your student status.
              Discount valid until 30 September 2026.
            </p>
            <input type="file" id="student-proof-input" accept="application/pdf,image/jpeg,image/png,image/webp">
            <button class="btn btn-orange btn-sm" id="upload-proof-btn" style="margin-top:8px;">📤 Upload Proof</button>
            <p style="font-size:11px;color:var(--muted);margin-top:4px;">PDF, JPG, PNG, WebP • Max 5MB</p>
          </div>
        `}
      </div>
    </div>
  `;

  // Add event listeners AFTER rendering
  const uploadPicBtn = document.getElementById('upload-pic-btn');
  if (uploadPicBtn) {
    uploadPicBtn.addEventListener('click', function() {
      const fileInput = document.getElementById('profile-pic-input');
      if (fileInput) {
        fileInput.click();
      }
    });
    // Also handle file selection
    const fileInput = document.getElementById('profile-pic-input');
    if (fileInput) {
      fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
          uploadProfilePicture();
        }
      });
    }
  }

  const uploadProofBtn = document.getElementById('upload-proof-btn');
  if (uploadProofBtn) {
    uploadProofBtn.addEventListener('click', function() {
      const fileInput = document.getElementById('student-proof-input');
      if (fileInput) {
        fileInput.click();
      }
    });
    const proofInput = document.getElementById('student-proof-input');
    if (proofInput) {
      proofInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
          uploadStudentProof();
        }
      });
    }
  }
}

// ============================================================
//  EDIT WHATSAPP & ADDRESS
// ============================================================

function editWhatsApp() {
  const current = state.user?.whatsapp || '';
  const newNumber = prompt('Enter your WhatsApp number:', current);
  if (newNumber && newNumber !== current) {
    updateUserField('whatsapp', newNumber);
  }
}

function editAddress() {
  const current = state.user?.address || '';
  const newAddress = prompt('Enter your delivery address:', current);
  if (newAddress && newAddress !== current) {
    updateUserField('address', newAddress);
  }
}

async function updateUserField(field, value) {
  if (!state.user) return;
  try {
    const response = await fetch(`/api/user/${state.user._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    const data = await response.json();
    if (response.ok) {
      state.user = data;
      localStorage.setItem('habibi_user', JSON.stringify(data));
      toast(`✅ ${field} updated!`);
      renderProfilePage();
      updateAuthUI();
    } else {
      toast('❌ ' + data.error);
    }
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

// ============================================================
//  PAYMENT METHODS & CHECKOUT
// ============================================================

function getBuildingOptions() {
  let options = '';
  BRAAMFONTEIN_BUILDINGS.forEach(building => {
    options += `<option value="${building.name}|${building.address}" data-area="${building.area}">${building.name}</option>`;
  });
  return options;
}

function renderCheckout() {
  const s = document.getElementById('checkout-section');
  if (!s) return;

  if (!paymentReference) {
    paymentReference = generatePaymentReference();
  }

  const subtotal = Cart.total();
  
  // Use saved user data
  const userWhatsapp = state.user?.whatsapp || '';
  const userAddress = state.user?.address || '';
  
  // Get delivery fee based on address
  let deliveryFee = 15;
  let deliveryArea = 'Braamfontein';
  const savedFee = localStorage.getItem('delivery_fee');
  const savedArea = localStorage.getItem('delivery_area');
  if (savedFee && savedArea) {
    deliveryFee = parseInt(savedFee);
    deliveryArea = savedArea;
  }
  
  const discount = state.discountAmount || 0;
  const rewardDiscount = Math.min(state.rewardBalance, subtotal);
  
  const isStudent = state.user?.isStudent || false;
  const studentVerified = state.user?.studentVerified || false;
  const studentDiscountActive = isStudent && studentVerified && new Date() < new Date('2026-09-30');
  const studentDiscount = studentDiscountActive ? deliveryFee * 0.2 : 0;
  const finalDeliveryFee = deliveryFee - studentDiscount;
  
  const total = Math.max(0, subtotal - discount - rewardDiscount + finalDeliveryFee);
  
  let subscriptionDiscount = 0;
  let subscriptionPercent = 0;
  if (state.subscription?.active && state.subscription.config?.discountPercent) {
    subscriptionPercent = state.subscription.config.discountPercent;
    subscriptionDiscount = (subtotal * subscriptionPercent) / 100;
  }
  
  const deliveryDisplay = `R${finalDeliveryFee.toFixed(2)}`;
  const deliveryNote = '🚚 Deliveries are currently available in Braamfontein, Doornfontein, Parktown & Auckland Park.';
  const deliveryAreaDisplay = `📍 ${deliveryArea}`;
  
  // Get saved addresses for dropdown
  const savedAddresses = getUserAddresses();
  const defaultAddress = getDefaultAddress();
  
  let addressSelectorHTML = '';
  if (savedAddresses.length > 0) {
    addressSelectorHTML = `
      <div class="form-group">
        <label>Saved Addresses</label>
        <select class="form-input" id="saved-address-select" onchange="loadSelectedAddress(this.value)">
          <option value="">-- Select a saved address --</option>
          ${savedAddresses.map(addr => `
            <option value="${addr.id}" ${addr.isDefault ? 'selected' : ''}>
              ${addr.address} ${addr.isDefault ? '⭐' : ''}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  s.innerHTML = `
    <div class="container">
      <h1 style="font-size:24px;font-weight:800;margin-bottom:20px;">Checkout</h1>
      ${state.cart.length === 0 ? '<div style="text-align:center;padding:80px;"><h3>Cart empty</h3></div>' : `
        <div class="checkout-grid">
          <div>
            <div class="checkout-card">
              <h3>📱 Delivery Details</h3>
              <div style="background:#FFF8E1;padding:12px;border-radius:8px;margin-bottom:16px;border-left:4px solid var(--orange);">
                <p style="font-size:13px;color:var(--orange-dark);font-weight:600;">${deliveryNote}</p>
                <p style="font-size:12px;color:var(--muted);">${deliveryAreaDisplay}</p>
              </div>
              
              <div class="form-group">
                <label>WhatsApp Number</label>
                <input class="form-input" id="co-phone" type="tel" value="${userWhatsapp}" placeholder="072 405 2868">
                <small style="color:var(--muted);">Update if different from your saved number</small>
              </div>
              
              ${addressSelectorHTML}
              
              <div class="form-group" style="position:relative;">
                <label>Search & Select Your Building/Residence</label>
                <input type="text" class="form-input" id="building-search" placeholder="Type to search buildings..." value="${defaultAddress?.street || ''}" oninput="searchBuildings(this.value)">
                <div id="building-results" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);display:none;margin-top:4px;background:var(--white);position:absolute;z-index:100;width:100%;"></div>
              </div>
              
              <div class="form-group">
                <label>Full Address</label>
                <textarea class="form-input" id="co-address" rows="3" placeholder="Your delivery address" oninput="detectAddressAndFee()">${userAddress || defaultAddress?.address || ''}</textarea>
                <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                  <button class="btn btn-outline btn-sm" onclick="updateFullAddress()">📝 Update Address</button>
                  <button id="location-btn" class="btn btn-outline btn-sm" onclick="shareLocation()">📍 Share My Location</button>
                  ${state.user ? `<button class="btn btn-outline btn-sm" onclick="saveCurrentAddress()">💾 Save Address</button>` : ''}
                </div>
                <small style="color:var(--muted);">Update your address if different from saved</small>
              </div>
              <input type="hidden" id="co-coordinates">
              
              <div class="form-group">
                <label>Delivery Notes (Optional)</label>
                <textarea class="form-input" id="co-notes" placeholder="Gate code, landmark, special instructions..."></textarea>
              </div>
            </div>

            <div class="checkout-card" style="border:2px solid var(--orange);">
              <h3 style="color:var(--orange-dark);">💳 Payment via Instant EFT (Payshap)</h3>
              
              <div style="background:#FFF8E1;padding:16px;border-radius:8px;margin-bottom:16px;border-left:4px solid #DC2626;">
                <p style="font-weight:600;color:#DC2626;">⚠️ Important: Immediate Payment Required</p>
                <p style="font-size:13px;color:var(--muted);">
                  Please make your <strong>Instant EFT</strong> payment <strong>immediately</strong> after placing your order.
                  The funds will clear in our account instantly. Use the reference below as your <strong>Beneficiary Reference</strong>.
                </p>
              </div>
              
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--surface);padding:16px;border-radius:8px;margin-bottom:16px;">
                <div><strong>Beneficiary Name:</strong> <span style="font-weight:700;">Quick 2 Shop</span></div>
                <div><strong>Bank:</strong> Standard Bank</div>
                <div><strong>Account Number:</strong> 10217451673</div>
                <div><strong>Account Type:</strong> Current Account</div>
                <div style="grid-column:1/-1;">
                  <strong>Beneficiary Reference:</strong> 
                  <span style="background:var(--gray-100);padding:8px 16px;border-radius:4px;font-weight:700;font-family:monospace;font-size:20px;color:#DC2626;display:inline-block;border:2px solid #DC2626;">
                    ${paymentReference}
                  </span>
                  <button class="btn btn-sm btn-outline" onclick="copyReference()" style="margin-left:8px;">📋 Copy</button>
                </div>
              </div>
              
              <div class="form-group">
                <label>Upload Proof of Payment (POP) *</label>
                <input type="file" id="co-pop" accept="image/*,application/pdf" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--radius-sm);">
                <small style="color:var(--muted);">Upload a screenshot or photo of your Instant EFT confirmation.</small>
              </div>
              
              <div style="background:#E8F5E9;padding:12px;border-radius:8px;font-size:13px;color:#2E7D32;margin-top:8px;">
                ✅ Your order will be processed immediately once payment is confirmed.
              </div>
            </div>

            <div class="checkout-card">
              <h3>🎁 Rewards & Savings</h3>
              ${state.user ? `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
                  <span>Reward Balance</span>
                  <span><strong style="color:var(--orange);">R${state.rewardBalance.toFixed(2)}</strong></span>
                </div>
                ${studentDiscountActive ? `
                  <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
                    <span>🎓 Student Discount (20% off delivery)</span>
                    <span style="color:#2E7D32;font-weight:700;">-R${studentDiscount.toFixed(2)}</span>
                  </div>
                ` : ''}
                ${state.rewardBalance >= 2 ? `
                  <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="btn btn-orange btn-sm" onclick="redeemRewards()" style="flex:1;">
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
            <div class="order-line" style="color:var(--orange);font-weight:600;">
              <span>🚚 Delivery Fee</span>
              <span class="delivery-fee">${deliveryDisplay}</span>
            </div>
            ${studentDiscountActive ? `
              <div class="order-line" style="color:#2E7D32;font-weight:600;">
                <span>🎓 Student Discount (20%)</span>
                <span>-R${studentDiscount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="font-size:12px;color:var(--orange);text-align:center;margin:4px 0;">${deliveryNote}</div>
            <div class="order-line total"><span>Total</span><span class="amount">R${total.toFixed(2)}</span></div>
            
            <div style="margin:12px 0;padding:8px 12px;background:var(--gray-100);border-radius:4px;font-size:13px;">
              💳 Payment: <strong>Instant EFT (Payshap)</strong>
            </div>
            
            <button class="btn btn-orange btn-full" id="place-order-btn" onclick="submitOrder()">
              Pay & Place Order — R${total.toFixed(2)}
            </button>
            <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
              You'll be prompted to upload proof of payment.
            </p>
          </div>
        </div>
      `}
    </div>`;

  loadBuildings();
  detectAddressAndFee();
}

function updateFullAddress() {
  const street = document.getElementById('co-street').value.trim();
  const address = document.getElementById('co-address');
  address.value = street;
  detectAddressAndFee();
}

function loadSelectedAddress(addressId) {
  const addresses = getUserAddresses();
  const addr = addresses.find(a => a.id === addressId);
  if (addr) {
    document.getElementById('co-address').value = addr.address;
    document.getElementById('co-phone').value = addr.phone || document.getElementById('co-phone').value;
    document.getElementById('co-street').value = addr.address;
    toast('📂 Address loaded');
    detectAddressAndFee();
  }
}

function saveCurrentAddress() {
  const address = document.getElementById('co-address')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  const street = document.getElementById('co-street')?.value.trim();
  
  if (!address) {
    toast('⚠️ Please enter an address first');
    return;
  }
  
  if (!state.user) {
    toast('⚠️ Please sign in to save addresses');
    return;
  }
  
  saveUserAddress({ address, phone, street });
}

function copyReference() {
  const ref = paymentReference;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(ref).then(() => {
      toast('📋 Reference copied!');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = ref;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast('📋 Reference copied!');
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = ref;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast('📋 Reference copied!');
  }
}

// ============================================================
//  SUBMIT ORDER
// ============================================================

async function submitOrder() {
  const p = document.getElementById('co-phone')?.value.trim();
  const a = document.getElementById('co-address')?.value.trim();
  const s = document.getElementById('co-street')?.value.trim();
  const c = document.getElementById('co-coordinates')?.value.trim();
  const n = document.getElementById('co-notes')?.value.trim();
  const btn = document.getElementById('place-order-btn');

  const paymentMethod = 'payshap';
  
  const popInput = document.getElementById('co-pop');
  let popBase64 = null;
  if (popInput && popInput.files && popInput.files.length > 0) {
    popBase64 = await fileToBase64(popInput.files[0]);
  } else {
    toast('⚠️ Please upload proof of payment');
    return;
  }

  if (!p || !a) { toast('⚠️ Fill required fields (WhatsApp and Address)'); return; }

  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.textContent = 'Placing Order…';

  const subtotal = Cart.total();
  const discount = state.discountAmount || 0;
  const rewardDiscount = Math.min(state.rewardBalance || 0, subtotal);
  
  // Get delivery fee
  const savedFee = localStorage.getItem('delivery_fee');
  let deliveryFee = savedFee ? parseInt(savedFee) : 15;
  
  // Apply student discount
  const isStudent = state.user?.isStudent || false;
  const studentVerified = state.user?.studentVerified || false;
  const studentDiscountActive = isStudent && studentVerified && new Date() < new Date('2026-09-30');
  const studentDiscount = studentDiscountActive ? deliveryFee * 0.2 : 0;
  const finalDeliveryFee = deliveryFee - studentDiscount;
  
  const total = Math.max(0, subtotal - discount - rewardDiscount + finalDeliveryFee);

  try {
    const orderData = {
      customer: { 
        name: state.user?.name || 'Guest', 
        email: state.user?.email || '', 
        phone: p, 
        address: a,
        street: s,
        coordinates: c, 
        notes: n 
      },
      items: state.cart,
      total: total,
      subtotal: subtotal,
      deliveryFee: finalDeliveryFee,
      originalDeliveryFee: deliveryFee,
      studentDiscount: studentDiscount,
      discount: discount,
      rewardDiscount: rewardDiscount,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending_payment',
      userId: state.user?._id || null,
      paymentReference: paymentReference,
      proofOfPayment: popBase64,
      isStudent: studentDiscountActive
    };

    const o = await placeOrder(orderData);
    
    const ref = paymentReference;
    paymentReference = '';
    
    Cart.clear();
    state.discountAmount = 0;
    state.rewardBalance = Math.max(0, state.rewardBalance - rewardDiscount);
    
    showOrderSuccessSummary(o, total, paymentMethod, finalDeliveryFee, ref, studentDiscount);
    fetchUserPoints(state.user?.email);
    updateRewardUI();
    
  } catch (err) {
    toast('❌ Failed to place order: ' + err.message);
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = 'Pay & Place Order';
  }
}

// ============================================================
//  ORDER SUCCESS SUMMARY
// ============================================================

function showOrderSuccessSummary(o, total, paymentMethod, deliveryFee, reference, studentDiscount) {
  const s = document.getElementById('checkout-section');
  
  const deliveryDisplay = `R${(deliveryFee || 15).toFixed(2)}`;
  const deliveryNote = '🚚 Deliveries are currently available in Braamfontein, Doornfontein, Parktown & Auckland Park.';
  
  const orderDate = new Date(o.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-ZA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  s.innerHTML = `
    <div class="container">
      <div style="max-width:600px;margin:0 auto;background:var(--white);border:2px solid var(--border);border-radius:var(--radius-lg);padding:32px 24px;box-shadow:var(--shadow-lg);">
        
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--orange);padding-bottom:16px;margin-bottom:20px;">
          <div>
            <div style="font-size:22px;font-weight:800;color:var(--black);">Quick 2 Shop</div>
            <div style="font-size:12px;color:var(--muted);">Braamfontein, Johannesburg</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:var(--muted);">Order Confirmed</div>
            <div style="font-size:11px;color:var(--muted);">${formattedDate}</div>
          </div>
        </div>

        <!-- Order Info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;background:var(--surface);border-radius:var(--radius-sm);padding:12px 16px;">
          <div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">Order ID</div>
            <div style="font-weight:700;font-size:14px;">${o.id}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">Status</div>
            <div style="font-weight:700;font-size:14px;color:var(--orange);">Awaiting Payment</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">Payment Method</div>
            <div style="font-weight:700;font-size:14px;">💳 Instant EFT</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">Payment Reference</div>
            <div style="font-weight:700;font-size:14px;font-family:monospace;color:#DC2626;">${reference || o.paymentReference || 'N/A'}</div>
          </div>
        </div>

        <!-- Customer Info -->
        <div style="margin-bottom:20px;background:var(--surface);border-radius:var(--radius-sm);padding:12px 16px;">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Delivery Details</div>
          <div style="font-weight:600;">${o.customer?.name || 'Guest'}</div>
          <div style="font-size:13px;color:var(--muted);">📞 ${o.customer?.phone || 'N/A'}</div>
          <div style="font-size:13px;color:var(--muted);">📍 ${o.customer?.address || 'N/A'}</div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--muted);letter-spacing:0.06em;margin-bottom:8px;">Order Items</div>
          ${(o.items||[]).map(i => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:14px;">
              <span>${i.name} × ${i.qty}</span>
              <span>R${(i.price * i.qty).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <!-- Totals -->
        <div style="border-top:2px solid var(--gray-200);padding-top:12px;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;">
            <span style="color:var(--muted);">Subtotal</span>
            <span>R${(o.subtotal || 0).toFixed(2)}</span>
          </div>
          ${studentDiscount > 0 ? `
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#2E7D32;">
              <span>🎓 Student Discount</span>
              <span>-R${studentDiscount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;font-weight:600;color:var(--orange);">
            <span>🚚 Delivery Fee</span>
            <span>${deliveryDisplay}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0 4px 0;font-size:18px;font-weight:800;border-top:2px solid var(--orange);margin-top:4px;">
            <span>Total</span>
            <span style="color:var(--orange);">R${total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Instructions -->
        <div style="margin-top:16px;background:#FFF8E1;border-radius:var(--radius-sm);padding:12px 16px;border-left:4px solid #DC2626;">
          <p style="font-size:12px;font-weight:600;color:#DC2626;margin:0;">⚠️ Payment Required</p>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0 0;">
            Use reference <strong style="font-family:monospace;">${reference || o.paymentReference || 'N/A'}</strong> for your Instant EFT.
          </p>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0 0;">
            Beneficiary: <strong>Quick 2 Shop</strong> • Standard Bank • 10217451673
          </p>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:12px;margin-top:20px;">
          <button class="btn btn-orange" style="flex:1;" onclick="navigateTo('home')">🏠 Continue Shopping</button>
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
        <h1 style="font-size:24px;font-weight:800;margin-bottom:20px;">My Orders</h1>
        ${myOrders.length === 0 ? '<div style="text-align:center;padding:80px;">📦 No orders</div>' : `
          <div style="overflow-x:auto;">
            <table class="orders-table">
              <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${myOrders.reverse().map(o => {
                  const canCancel = o.status === 'pending' || o.status === 'paid' || o.status === 'pending_payment';
                  const showInvoice = o.status === 'paid' || o.status === 'completed';
                  const paymentLabel = '💳 Instant EFT';
                  return `<tr>
                    <td style="font-weight:700;font-size:12px;">${o.id}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>${o.items?.length||0}</td>
                    <td><strong>R${o.total?.toFixed(2)}</strong></td>
                    <td><span class="badge badge-info">${paymentLabel}</span></td>
                    <td><span class="badge ${o.status==='pending'?'badge-warn':o.status==='pending_payment'?'badge-warn':o.status==='paid'?'badge-info':o.status==='completed'?'badge-success':'badge-danger'}">${o.status === 'pending_payment' ? '⏳ Pending Pay' : o.status}</span></td>
                    <td><div style="display:flex;gap:6px;flex-wrap:wrap;">
                      ${showInvoice ? `<button class="btn btn-outline btn-sm" onclick="viewInvoice(${JSON.stringify(o).replace(/"/g,'&quot;')})">📄</button><button class="btn btn-outline btn-sm" onclick="downloadPDF(${JSON.stringify(o).replace(/"/g,'&quot;')})">📥</button>` : '<span style="font-size:11px;color:var(--muted);">Invoice after payment</span>'}
                      ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="cancelOrder('${o.id}')">✕ Cancel</button>` : ''}
                    </div></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`}
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
  return `
    <form onsubmit="event.preventDefault();submitRegister();">
      <div id="auth-error" class="form-error" style="display:none;"></div>
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input class="form-input" id="auth-name" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email *</label>
        <input class="form-input" id="auth-email" type="email" required>
      </div>
      <div class="form-group">
        <label class="form-label">WhatsApp Number *</label>
        <input class="form-input" id="auth-whatsapp" type="tel" placeholder="072 405 2868" required>
        <small style="color:var(--muted);">We'll use this for delivery updates</small>
      </div>
      <div class="form-group">
        <label class="form-label">Delivery Address *</label>
        <div style="position:relative;">
          <input type="text" class="form-input" id="auth-address-search" placeholder="Search for your building or street..." oninput="searchRegisterAddress(this.value)">
          <div id="auth-address-results" style="max-height:150px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);display:none;margin-top:4px;background:var(--white);position:absolute;z-index:100;width:100%;"></div>
        </div>
        <textarea class="form-input" id="auth-address" rows="2" placeholder="Your full delivery address" style="margin-top:8px;"></textarea>
        <small style="color:var(--muted);">Select from the dropdown or type manually</small>
      </div>
      <div class="form-group">
        <label class="form-label">Password *</label>
        <input class="form-input" id="auth-password" type="password" required>
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Password *</label>
        <input class="form-input" id="auth-password-confirm" type="password" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full" id="auth-submit-btn">Create Account</button>
    </form>
  `;
}

function searchRegisterAddress(query) {
  const resultsContainer = document.getElementById('auth-address-results');
  const addressField = document.getElementById('auth-address');
  
  if (!resultsContainer) return;

  if (!query || query.length < 2) {
    resultsContainer.style.display = 'none';
    return;
  }

  fetch(`/api/buildings?search=${encodeURIComponent(query)}`)
    .then(r => r.json())
    .then(buildings => {
      if (buildings.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:8px;color:var(--muted);">No buildings found. Type address manually.</div>';
        resultsContainer.style.display = 'block';
        return;
      }

      resultsContainer.innerHTML = buildings.map(b => `
        <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);hover:background:var(--orange-light);"
             onclick="selectRegisterAddress('${b.name}', '${b.address || b.name}')">
          <strong>${b.name}</strong>
          <span style="font-size:11px;color:var(--muted);">${b.address || ''}</span>
        </div>
      `).join('');
      resultsContainer.style.display = 'block';
    })
    .catch(() => {
      resultsContainer.style.display = 'none';
    });
}

function selectRegisterAddress(name, address) {
  document.getElementById('auth-address-search').value = name;
  document.getElementById('auth-address').value = address;
  document.getElementById('auth-address-results').style.display = 'none';
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
  const n = document.getElementById('auth-name')?.value?.trim();
  const e = document.getElementById('auth-email')?.value?.trim();
  const w = document.getElementById('auth-whatsapp')?.value?.trim();
  const a = document.getElementById('auth-address')?.value?.trim();
  const p = document.getElementById('auth-password')?.value;
  const cp = document.getElementById('auth-password-confirm')?.value;
  const err = document.getElementById('auth-error');
  const btn = document.getElementById('auth-submit-btn');
  
  err.style.display = 'none';
  if (!n || !e || !w || !a || !p || !cp) {
    err.textContent = 'All fields required';
    err.style.display = 'block';
    return;
  }
  if (p !== cp) {
    err.textContent = 'Passwords mismatch';
    err.style.display = 'block';
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Creating…';
  
  try {
    const u = await registerUser(n, e, p, w, a);
    state.user = u;
    localStorage.setItem('habibi_user', JSON.stringify(u));
    updateAuthUI();
    closeModal();
    await loadUserRewards();
    toast(`🎉 Welcome, ${u.name}!`);
  } catch (x) {
    err.textContent = x.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
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
      const isStudent = state.user.isStudent || false;
      const studentVerified = state.user.studentVerified || false;
      const studentBadge = isStudent && studentVerified ? 
        '<span class="student-badge verified">🎓 Student</span>' : 
        (state.user.studentProof ? '<span class="student-badge pending">⏳ Pending</span>' : '');
      
      userDisplay.style.display = 'flex';
      userDisplay.innerHTML = `
        <div class="user-info">
          <button id="rewards-btn" class="btn btn-sm btn-outline" onclick="showRewardsModal()" style="margin-right:8px;">
            🎁 R${state.rewardBalance.toFixed(2)}
          </button>
          ${studentBadge}
          <div class="user-avatar" onclick="navigateTo('profile')" style="cursor:pointer;">
            ${state.user.profilePicture ? 
              `<img src="${state.user.profilePicture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` :
              state.user.name[0].toUpperCase()
            }
          </div>
          <span onclick="navigateTo('profile')" style="cursor:pointer;">${state.user.name.split(' ')[0]}</span>
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
        <div style="font-size:32px;font-weight:800;color:var(--orange);">${state.points||0} Points</div>
        <p style="color:var(--muted);">= R${(state.points||0).toFixed(2)} discount</p>
        <p style="font-size:13px;color:var(--muted);">Earn <strong>R0.50</strong> for every <strong>R10</strong> spent.</p>
        <p style="font-size:12px;color:var(--muted);">Points are awarded when your order is marked as paid.</p>
        ${(state.points||0)>=10?`<button class="btn btn-orange btn-full" style="margin-top:16px;" onclick="usePointsNow()">Use R${state.points} Off Now</button>`:'<p style="font-size:12px;color:var(--muted);">Earn 10+ points to redeem</p>'}
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
  if (!navigator.geolocation) {
    toast('⚠️ Location sharing is not supported by your browser.');
    return;
  }

  const b = document.getElementById('location-btn');
  const addressElement = document.getElementById('co-address');
  const streetElement = document.getElementById('co-street');
  
  if (b) {
    b.disabled = true;
    b.textContent = '📍 Getting precise location…';
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const accuracy = position.coords.accuracy;
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const coordsString = `${lat.toFixed(6)},${lng.toFixed(6)}`;

      let accuracyLabel = '';
      let accuracyEmoji = '';
      if (accuracy < 20) {
        accuracyLabel = 'Excellent (GPS)';
        accuracyEmoji = '📡';
      } else if (accuracy < 50) {
        accuracyLabel = 'Very Good';
        accuracyEmoji = '✅';
      } else if (accuracy < 100) {
        accuracyLabel = 'Good';
        accuracyEmoji = '👍';
      } else if (accuracy < 500) {
        accuracyLabel = 'Fair (Wi-Fi/Cell)';
        accuracyEmoji = '📶';
      } else {
        accuracyLabel = 'Low Accuracy';
        accuracyEmoji = '⚠️';
      }

      toast(`${accuracyEmoji} Location found: ±${Math.round(accuracy)}m (${accuracyLabel})`);

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        
        const fullAddress = data.display_name || `📍 ${coordsString}`;
        if (addressElement) {
          addressElement.value = fullAddress;
          addressElement.style.borderColor = '#E67E22';
          addressElement.style.boxShadow = '0 0 0 3px rgba(230, 126, 34, 0.2)';
          setTimeout(() => {
            addressElement.style.borderColor = '';
            addressElement.style.boxShadow = '';
          }, 3000);
        }
        if (streetElement) {
          streetElement.value = fullAddress;
        }
        
        const coordsElement = document.getElementById('co-coordinates');
        if (coordsElement) {
          coordsElement.value = coordsString;
        }

        toast('✏️ Please review and edit the address if needed');
        
        if (addressElement) {
          setTimeout(() => {
            addressElement.focus();
            addressElement.select();
          }, 500);
        }

      } catch (error) {
        const fallback = `📍 ${coordsString}`;
        if (addressElement) {
          addressElement.value = fallback;
          addressElement.style.borderColor = '#E67E22';
          addressElement.style.boxShadow = '0 0 0 3px rgba(230, 126, 34, 0.2)';
          setTimeout(() => {
            addressElement.style.borderColor = '';
            addressElement.style.boxShadow = '';
          }, 3000);
        }
        if (streetElement) {
          streetElement.value = fallback;
        }
        const coordsElement = document.getElementById('co-coordinates');
        if (coordsElement) {
          coordsElement.value = coordsString;
        }
        toast('✏️ Please review and edit the address if needed');
        if (addressElement) {
          setTimeout(() => {
            addressElement.focus();
            addressElement.select();
          }, 500);
        }
      }

      if (b) {
        b.disabled = false;
        b.textContent = '📍 Share My Location';
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
      let errorMessage = '⚠️ Could not get your location. ';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += 'Permission was denied. Please enable location access.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage += 'The request to get your location timed out.';
          break;
        default:
          errorMessage += 'An unknown error occurred.';
      }
      toast(errorMessage);
      if (b) {
        b.disabled = false;
        b.textContent = '📍 Share My Location';
      }
    },
    options
  );
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
        <h4>3. Payment</h4><p>Instant EFT only.</p>
        <h4>4. Delivery</h4><p>Area-based fees in Braamfontein.</p>
        <h4>5. Student Discount</h4><p>20% off delivery fee for verified students.</p>
        <h4>6. Returns</h4><p>Within 24 hours.</p>
        <h4>7. Privacy</h4><p>Never shared.</p>
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
  
  if (p === 'profile') {
    renderProfilePage();
    document.querySelectorAll('.page').forEach(x => x.style.display = 'none');
    const profileSection = document.getElementById('profile-section');
    if (profileSection) profileSection.style.display = 'block';
    return;
  }
  
  if (p === 'communications') {
    renderCommunicationsPanel();
    document.querySelectorAll('.page').forEach(x => x.style.display = 'none');
    const commSection = document.getElementById('communications-section');
    if (commSection) commSection.style.display = 'block';
    return;
  }
  
  const t = document.getElementById(`page-${p}`);
  if (t) {
    t.classList.add('active');
    t.style.display = '';
  }
  
  const profileSection = document.getElementById('profile-section');
  if (profileSection) profileSection.style.display = 'none';
  
  const commSection = document.getElementById('communications-section');
  if (commSection) commSection.style.display = 'none';
  
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === p));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeCart();
  if (p === 'home') { loadProducts(); loadHeroSlideshow(); }
  if (p === 'checkout') renderCheckout();
  if (p === 'orders') renderOrdersPage();
}

// ============================================================
//  MOBILE MENU
// ============================================================

function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  const hamburger = document.getElementById('hamburger');
  links.classList.toggle('mobile-open');
  hamburger.classList.toggle('active');
}

function closeMobileMenu() {
  const links = document.querySelector('.nav-links');
  const hamburger = document.getElementById('hamburger');
  links.classList.remove('mobile-open');
  hamburger.classList.remove('active');
}

// ============================================================
//  INIT - FIXED
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

  // Load products first, then categories will be rendered
  await loadProducts();
  await loadHeroSlideshow();

  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });

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
    if (e.key === 'Escape') { closeModal(); closeCart(); closeMobileMenu(); }
  });
  
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
  }
  
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !document.querySelector('.nav-links a[data-page="profile"]')) {
    const profileLink = document.createElement('a');
    profileLink.href = '#';
    profileLink.dataset.page = 'profile';
    profileLink.textContent = 'Profile';
    profileLink.onclick = function(e) {
      e.preventDefault();
      navigateTo('profile');
    };
    navLinks.appendChild(profileLink);
  }
}

// ============================================================
//  COMMUNICATIONS PANEL
// ============================================================

function renderCommunicationsPanel() {
  const s = document.getElementById('communications-section');
  if (!s) {
    const container = document.createElement('section');
    container.id = 'communications-section';
    container.className = 'communications-section';
    container.style.padding = 'calc(var(--nav-h) + 20px) 0 60px';
    container.style.minHeight = '100vh';
    document.body.appendChild(container);
  }
  
  const section = document.getElementById('communications-section');
  if (!section) return;
  
  if (!state.user) {
    section.innerHTML = '<div class="container"><div style="text-align:center;padding:80px;">🔒 Please sign in</div></div>';
    return;
  }

  section.innerHTML = `
    <div class="container">
      <h1 style="font-size:24px;font-weight:800;margin-bottom:20px;">💬 Communications</h1>
      
      <div class="checkout-card">
        <h3>Your Orders</h3>
        <div id="comm-orders-list">
          <div style="text-align:center;padding:20px;color:var(--muted);">Loading your orders...</div>
        </div>
      </div>
      
      <div class="checkout-card" id="comm-chat-container" style="display:none;">
        <h3 id="comm-chat-title">Order #ORD-XXXXX</h3>
        <div id="comm-messages" style="max-height:400px;overflow-y:auto;padding:12px;background:var(--surface);border-radius:var(--radius-sm);margin-bottom:12px;"></div>
        <div style="display:flex;gap:8px;">
          <textarea id="comm-message-input" rows="2" placeholder="Type your message..." style="flex:1;padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border);resize:vertical;"></textarea>
          <button class="btn btn-primary" onclick="sendCommunicationMessage()">Send</button>
        </div>
      </div>
    </div>
  `;
  
  loadUserOrdersForComm();
}

async function loadUserOrdersForComm() {
  const list = document.getElementById('comm-orders-list');
  if (!list) return;
  
  try {
    const orders = await fetchOrders();
    const myOrders = orders.filter(x => x.userId === state.user._id || x.userId === state.user.id);
    
    if (myOrders.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);">No orders found</div>';
      return;
    }
    
    list.innerHTML = myOrders.map(o => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="openCommChat('${o.id}')">
        <div>
          <strong>${o.id}</strong>
          <span style="font-size:12px;color:var(--muted);">${new Date(o.createdAt).toLocaleDateString()}</span>
          <br>
          <span style="font-size:13px;">Status: <span class="badge ${o.status === 'paid' ? 'badge-success' : o.status === 'pending' || o.status === 'pending_payment' ? 'badge-warn' : o.status === 'completed' ? 'badge-info' : 'badge-danger'}">${o.status}</span></span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();openCommChat('${o.id}')">💬 Chat</button>
      </div>
    `).join('');
    
  } catch (err) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);">Could not load orders</div>';
  }
}

async function openCommChat(orderId) {
  document.getElementById('comm-chat-container').style.display = 'block';
  document.getElementById('comm-chat-title').textContent = `Order #${orderId}`;
  document.getElementById('comm-message-input').dataset.orderId = orderId;
  
  try {
    const response = await fetch(`${API}/communications/${orderId}`);
    const messages = await response.json();
    
    const container = document.getElementById('comm-messages');
    container.innerHTML = messages.map(m => `
      <div style="margin-bottom:8px;${m.sender === 'admin' ? 'text-align:left;' : 'text-align:right;'}">
        <div style="display:inline-block;padding:8px 12px;border-radius:8px;max-width:80%;${m.sender === 'admin' ? 'background:var(--surface);border:1px solid var(--border);' : 'background:var(--orange);color:white;'}">
          <strong style="font-size:11px;">${m.sender === 'admin' ? '🛒 Admin' : 'You'}</strong>
          <div style="font-size:14px;">${m.message}</div>
          <div style="font-size:10px;color:${m.sender === 'admin' ? 'var(--muted)' : 'rgba(255,255,255,0.7)'};margin-top:4px;">${new Date(m.createdAt).toLocaleString()}</div>
        </div>
      </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
    
  } catch (err) {
    toast('❌ Could not load messages');
  }
}

async function sendCommunicationMessage() {
  const input = document.getElementById('comm-message-input');
  const message = input.value.trim();
  const orderId = input.dataset.orderId;
  
  if (!message || !orderId) {
    toast('⚠️ Please enter a message');
    return;
  }
  
  try {
    await fetch(`${API}/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        userId: state.user._id,
        message: message,
        sender: 'customer'
      })
    });
    
    input.value = '';
    toast('✅ Message sent');
    openCommChat(orderId);
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', init);