const API = '/api';

// ============================================================
//  DELIVERY CONFIGURATION
// ============================================================

const DELIVERY_FEE = 10;
const DELIVERY_AREA = 'Braamfontein';
const DELIVERY_NOTE = '🚚 Deliveries are currently available in Braamfontein, Doornfontein, Parktown & Auckland Park.';

const state = {
  cart: JSON.parse(localStorage.getItem('habibi_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('habibi_user') || 'null'),
  wishlist: JSON.parse(localStorage.getItem('habibi_wishlist') || '[]'),
  products: [], categories: [],
  currentCategory: 'all', searchQuery: '', sortBy: 'default', currentPage: 'home',
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

    if (state.products.length === 0) {
      await loadProducts();
      return;
    }

    const activeCategories = cats.filter(c => {
      return state.products.some(p => p.category === c.id);
    });

    console.log('🏷️ Active categories (with products):', activeCategories.length);

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
//  BUILDING SEARCH - FOR DROPDOWN
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

function getBuildingsByArea(area) {
  return allBuildings.filter(b => b.area === area);
}

function renderBuildingDropdown() {
  const container = document.getElementById('building-dropdown-container');
  if (!container) return;

  const areas = ['braamfontein', 'doornfontein', 'parktown', 'aucklandpark'];
  const areaLabels = {
    braamfontein: 'Braamfontein',
    doornfontein: 'Doornfontein', 
    parktown: 'Parktown',
    aucklandpark: 'Auckland Park'
  };

  let html = `<select class="form-input" id="building-select" onchange="selectBuilding(this.value)">`;
  html += `<option value="">-- Select Your Building --</option>`;

  areas.forEach(area => {
    const buildings = getBuildingsByArea(area);
    if (buildings.length > 0) {
      html += `<optgroup label="--- ${areaLabels[area]} ---">`;
      buildings.forEach(b => {
        html += `<option value="${b._id}">${b.name}</option>`;
      });
      html += `</optgroup>`;
    }
  });

  html += `</select>`;
  container.innerHTML = html;
}

function selectBuilding(buildingId) {
  if (!buildingId) return;
  
  const building = allBuildings.find(b => b._id === buildingId);
  if (!building) return;

  // Build full address
  const fullAddress = `${building.name}, ${building.street}, ${building.area.charAt(0).toUpperCase() + building.area.slice(1)}${building.postalCode ? ', ' + building.postalCode : ''}`;
  
  document.getElementById('co-address').value = fullAddress;
  document.getElementById('co-street').value = building.street;
  document.getElementById('co-building-name').value = building.name;
  document.getElementById('co-area').value = building.area;
  
  toast(`✅ ${building.name} selected`);
  detectAddressAndFee();
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
//  PAYMENT METHODS & CHECKOUT
// ============================================================

function renderCheckout() {
  const s = document.getElementById('checkout-section');
  if (!s) return;

  if (!paymentReference) {
    paymentReference = generatePaymentReference();
  }

  const subtotal = Cart.total();
  
  const userWhatsapp = state.user?.whatsapp || '';
  const userAddress = state.user?.address || '';
  
  let deliveryFee = 15;
  let deliveryArea = 'Braamfontein';
  const savedFee = localStorage.getItem('delivery_fee');
  const savedArea = localStorage.getItem('delivery_area');
  if (savedFee && savedArea) {
    deliveryFee = parseInt(savedFee);
    deliveryArea = savedArea;
  }
  
  const total = subtotal + deliveryFee;
  
  const deliveryDisplay = `R${deliveryFee.toFixed(2)}`;
  const deliveryNote = '🚚 Deliveries are currently available in Braamfontein, Doornfontein, Parktown & Auckland Park.';
  const deliveryAreaDisplay = `📍 ${deliveryArea}`;
  
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
              
              <div class="form-group" id="building-dropdown-container">
                <!-- Building dropdown will be rendered here -->
              </div>
              
              <input type="hidden" id="co-street">
              <input type="hidden" id="co-building-name">
              <input type="hidden" id="co-area">
              
              <div class="form-group">
                <label>Full Address</label>
                <textarea class="form-input" id="co-address" rows="3" placeholder="Select a building above to auto-fill address" oninput="detectAddressAndFee()">${userAddress || defaultAddress?.address || ''}</textarea>
                <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                  <button class="btn btn-outline btn-sm" onclick="shareLocation()">📍 Share My Location</button>
                  ${state.user ? `<button class="btn btn-outline btn-sm" onclick="saveCurrentAddress()">💾 Save Address</button>` : ''}
                </div>
                <small style="color:var(--muted);">Select a building from the dropdown or enter manually</small>
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
            </div>
          </div>

          <div class="order-summary-card">
            <h3>Order Summary</h3>
            ${state.cart.map(i => `<div class="order-line"><span>${i.name} × ${i.qty}</span><span>R${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
            <div class="order-line" style="font-weight:600;border-top:2px solid var(--gray-300);padding-top:12px;margin-top:12px;">
              <span>Subtotal (Items Only)</span>
              <span>R${subtotal.toFixed(2)}</span>
            </div>
            <div class="order-line" style="color:var(--orange);font-weight:600;">
              <span>🚚 Delivery Fee</span>
              <span class="delivery-fee">${deliveryDisplay}</span>
            </div>
            <div style="font-size:12px;color:var(--orange);text-align:center;margin:4px 0;">${deliveryNote}</div>
            <div class="order-line total"><span>Total</span><span class="amount">R${total.toFixed(2)}</span></div>
            
            <button class="btn btn-orange btn-full" id="place-order-btn" onclick="placeOrderWithPOP()">
              Pay & Place Order — R${total.toFixed(2)}
            </button>
            <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
              You'll be prompted to upload proof of payment.
            </p>
          </div>
        </div>
      `}
    </div>`;

  loadBuildings().then(() => {
    renderBuildingDropdown();
  });
  detectAddressAndFee();
}

function loadSelectedAddress(addressId) {
  const addresses = getUserAddresses();
  const addr = addresses.find(a => a.id === addressId);
  if (addr) {
    document.getElementById('co-address').value = addr.address;
    document.getElementById('co-phone').value = addr.phone || document.getElementById('co-phone').value;
    toast('📂 Address loaded');
    detectAddressAndFee();
  }
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
//  POP UPLOAD & VERIFICATION
// ============================================================

async function placeOrderWithPOP() {
  const p = document.getElementById('co-phone')?.value.trim();
  const a = document.getElementById('co-address')?.value.trim();
  const n = document.getElementById('co-notes')?.value.trim();
  const btn = document.getElementById('place-order-btn');

  if (!p || !a) { toast('⚠️ Fill required fields (WhatsApp and Address)'); return; }

  btn.disabled = true;
  btn.textContent = 'Creating Order…';

  const subtotal = Cart.total();
  const savedFee = localStorage.getItem('delivery_fee');
  let deliveryFee = savedFee ? parseInt(savedFee) : 15;
  const total = subtotal + deliveryFee;

  try {
    const orderData = {
      customer: { 
        name: state.user?.name || 'Guest', 
        email: state.user?.email || '', 
        phone: p, 
        address: a,
        notes: n 
      },
      items: state.cart,
      total: total,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      paymentMethod: 'payshap',
      userId: state.user?._id || null,
      paymentReference: paymentReference
    };

    const o = await placeOrder(orderData);
    
    // Show POP upload modal
    showPOPUploadModal(o);
    
    btn.disabled = false;
    btn.textContent = 'Pay & Place Order';
    
  } catch (err) {
    toast('❌ Failed to create order: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Pay & Place Order';
  }
}

function showPOPUploadModal(order) {
  const ref = paymentReference;
  paymentReference = '';

  document.getElementById('modal-overlay').innerHTML = `
    <div class="modal" onclick="event.stopPropagation()" style="max-width:500px;">
      <div class="modal-header">
        <h3>📤 Upload Proof of Payment</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:#FFF8E1;padding:12px;border-radius:8px;margin-bottom:16px;border-left:4px solid var(--orange);">
          <p style="font-size:13px;color:var(--orange-dark);font-weight:600;">Order #${order.id}</p>
          <p style="font-size:13px;color:var(--muted);">Total: R${order.total.toFixed(2)}</p>
          <p style="font-size:13px;color:var(--muted);">Reference: <strong>${ref}</strong></p>
        </div>
        
        <div style="background:#E8F5E9;padding:12px;border-radius:8px;margin-bottom:16px;">
          <p style="font-size:13px;color:#2E7D32;">✅ Please upload your proof of payment. The system will automatically verify it.</p>
        </div>
        
        <div id="pop-upload-progress" style="display:none;">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <span id="pop-progress-icon">📤</span>
            <span id="pop-progress-text">Uploading...</span>
          </div>
          <div style="background:var(--gray-200);height:6px;border-radius:99px;overflow:hidden;width:100%;">
            <div id="pop-progress-bar" style="background:var(--orange);height:100%;width:0%;border-radius:99px;transition:width 0.3s;"></div>
          </div>
        </div>
        
        <div id="pop-upload-area">
          <div class="image-upload-area" onclick="document.getElementById('pop-file-input').click()" style="padding:30px;">
            <div style="font-size:48px;">📄</div>
            <div>Click to upload your proof of payment</div>
            <div style="font-size:12px;color:var(--muted);">PDF, JPG, PNG, WebP • Max 5MB</div>
          </div>
          <input type="file" id="pop-file-input" accept="application/pdf,image/*" style="display:none;" onchange="uploadPOPFile('${order.id}', '${ref}')">
        </div>
        
        <div id="pop-verification-result" style="display:none;margin-top:16px;padding:12px;border-radius:8px;"></div>
        
        <div id="pop-place-order-section" style="display:none;margin-top:16px;">
          <button class="btn btn-orange btn-full" onclick="finalizeOrder('${order.id}')">
            ✅ Place Order — R${order.total.toFixed(2)}
          </button>
          <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
            Your payment has been verified. Click to place your order.
          </p>
        </div>
        
        <div id="pop-manual-review-section" style="display:none;margin-top:16px;">
          <button class="btn btn-warning btn-full" onclick="finalizeOrderManual('${order.id}')">
            ⏳ Place Order (Manual Review)
          </button>
          <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">
            Your payment will be reviewed manually by an admin.
          </p>
        </div>
        
        <button class="btn btn-outline btn-full" onclick="closeModal();navigateTo('orders')" style="margin-top:8px;">
          📋 Go to My Orders
        </button>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function uploadPOPFile(orderId, reference) {
  const fileInput = document.getElementById('pop-file-input');
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

  // Show progress bar
  document.getElementById('pop-upload-progress').style.display = 'block';
  document.getElementById('pop-upload-area').style.display = 'none';
  document.getElementById('pop-progress-icon').textContent = '📤';
  document.getElementById('pop-progress-text').textContent = 'Uploading...';
  document.getElementById('pop-progress-bar').style.width = '30%';

  try {
    const base64 = await fileToBase64(file);
    document.getElementById('pop-progress-bar').style.width = '60%';
    document.getElementById('pop-progress-text').textContent = 'Processing...';
    document.getElementById('pop-progress-icon').textContent = '🔍';

    // Extract text from the POP using Tesseract.js (in browser)
    let extractedData = {
      amount: 0,
      reference: '',
      date: '',
      bank: '',
      beneficiary: ''
    };

    try {
      // Try to extract text from image/PDF using Tesseract
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      // Parse the extracted text
      extractedData = parsePOPText(text, reference);
    } catch (ocrError) {
      console.warn('OCR failed:', ocrError);
      // If OCR fails, try to extract from PDF directly
      if (file.type === 'application/pdf') {
        try {
          // Try to read PDF text
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
          }
          extractedData = parsePOPText(fullText, reference);
        } catch (pdfError) {
          console.warn('PDF extraction failed:', pdfError);
        }
      }
    }

    document.getElementById('pop-progress-bar').style.width = '80%';
    document.getElementById('pop-progress-text').textContent = 'Verifying...';
    document.getElementById('pop-progress-icon').textContent = '✅';

    // Send to server for verification
    const response = await fetch(`${API}/orders/${orderId}/upload-pop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        popBase64: base64,
        extractedData: extractedData
      })
    });

    const result = await response.json();
    
    document.getElementById('pop-progress-bar').style.width = '100%';
    document.getElementById('pop-progress-text').textContent = 'Complete!';
    
    setTimeout(() => {
      document.getElementById('pop-upload-progress').style.display = 'none';
      showVerificationResult(result.verification, orderId);
    }, 500);

  } catch (err) {
    console.error('POP upload error:', err);
    toast('❌ Upload failed: ' + err.message);
    document.getElementById('pop-upload-progress').style.display = 'none';
    document.getElementById('pop-upload-area').style.display = 'block';
  }
}

function parsePOPText(text, reference) {
  const result = {
    amount: 0,
    reference: '',
    date: '',
    bank: '',
    beneficiary: ''
  };

  // Try to find amount (look for R numbers)
  const amountMatches = text.match(/R\s*(\d+\.?\d*)/gi);
  if (amountMatches && amountMatches.length > 0) {
    const amounts = amountMatches.map(m => parseFloat(m.replace(/[^0-9.]/g, '')));
    result.amount = Math.max(...amounts); // Use the largest amount found
  }

  // Try to find reference (look for PAY- number)
  const refMatches = text.match(/PAY-?(\d+[\-\d]*)/gi);
  if (refMatches && refMatches.length > 0) {
    result.reference = refMatches[0].replace(/[^0-9-]/g, '');
  } else {
    // Try to find the reference from the order
    const refNum = reference.replace('PAY-', '');
    if (text.includes(refNum)) {
      result.reference = reference;
    }
  }

  // Try to find date
  const dateMatches = text.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
  if (dateMatches && dateMatches.length > 0) {
    result.date = dateMatches[0];
  }

  // Try to find bank name
  const bankMatches = text.match(/standard|std|absa|fnb|nedbank|capitec/i);
  if (bankMatches && bankMatches.length > 0) {
    result.bank = bankMatches[0];
  }

  // Try to find beneficiary
  const beneficiaryMatches = text.match(/quick|2 shop|shoppingsa/i);
  if (beneficiaryMatches && beneficiaryMatches.length > 0) {
    result.beneficiary = beneficiaryMatches[0];
  }

  return result;
}

function showVerificationResult(verification, orderId) {
  const resultDiv = document.getElementById('pop-verification-result');
  const placeOrderDiv = document.getElementById('pop-place-order-section');
  const manualReviewDiv = document.getElementById('pop-manual-review-section');

  resultDiv.style.display = 'block';
  
  if (verification.allPassed) {
    resultDiv.style.background = '#E8F5E9';
    resultDiv.style.border = '1px solid #4CAF50';
    resultDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:24px;">✅</span>
        <div>
          <strong style="color:#2E7D32;">Payment Verified!</strong>
          <p style="font-size:13px;color:#2E7D32;margin:0;">${verification.message}</p>
        </div>
      </div>
    `;
    placeOrderDiv.style.display = 'block';
    manualReviewDiv.style.display = 'none';
  } else if (verification.status === 'pending_manual_review') {
    resultDiv.style.background = '#FFF8E1';
    resultDiv.style.border = '1px solid #FFA726';
    resultDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:24px;">⏳</span>
        <div>
          <strong style="color:#E65100;">${verification.message}</strong>
          ${verification.failedRules.length > 0 ? `
            <p style="font-size:12px;color:#E65100;margin:4px 0 0 0;">
              Issues: ${verification.failedRules.join(', ')}
            </p>
          ` : ''}
        </div>
      </div>
    `;
    placeOrderDiv.style.display = 'none';
    manualReviewDiv.style.display = 'block';
  } else {
    resultDiv.style.background = '#FDECEA';
    resultDiv.style.border = '1px solid #DC2626';
    resultDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:24px;">❌</span>
        <div>
          <strong style="color:#DC2626;">Payment Verification Failed</strong>
          <p style="font-size:13px;color:#DC2626;margin:0;">${verification.message}</p>
          ${verification.failedRules.length > 0 ? `
            <p style="font-size:12px;color:#DC2626;margin:4px 0 0 0;">
              Issues: ${verification.failedRules.join(', ')}
            </p>
          ` : ''}
        </div>
      </div>
    `;
    placeOrderDiv.style.display = 'none';
    manualReviewDiv.style.display = 'block';
  }
}

async function finalizeOrder(orderId) {
  try {
    const response = await fetch(`${API}/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    });
    
    if (response.ok) {
      closeModal();
      toast('✅ Order placed successfully!');
      Cart.clear();
      navigateTo('orders');
    } else {
      toast('❌ Failed to place order');
    }
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

async function finalizeOrderManual(orderId) {
  try {
    const response = await fetch(`${API}/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending_manual_review' })
    });
    
    if (response.ok) {
      closeModal();
      toast('⏳ Order placed for manual review');
      Cart.clear();
      navigateTo('orders');
    } else {
      toast('❌ Failed to place order');
    }
  } catch (err) {
    toast('❌ ' + err.message);
  }
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
    const myOrders = orders.filter(x => x.userId === state.user._id || x.userId === state.user.id || x.customer?.email === state.user?.email);
    
    s.innerHTML = `
      <div class="container">
        <h1 style="font-size:24px;font-weight:800;margin-bottom:20px;">My Orders</h1>
        ${myOrders.length === 0 ? '<div style="text-align:center;padding:80px;">📦 No orders</div>' : `
          <div style="overflow-x:auto;">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${myOrders.reverse().map(o => `
                  <tr>
                    <td><strong style="font-size:13px;cursor:pointer;color:var(--orange);" onclick="viewOrderDetails('${o.id}')">${o.id}</strong></td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>${o.items?.length || 0}</td>
                    <td><strong>R${(o.total || 0).toFixed(2)}</strong></td>
                    <td><span class="badge ${o.status === 'paid' ? 'badge-success' : o.status === 'pending' || o.status === 'awaiting_pop' ? 'badge-warn' : o.status === 'pop_verified' ? 'badge-info' : o.status === 'pending_manual_review' ? 'badge-warn' : o.status === 'pop_uploaded' ? 'badge-info' : o.status === 'completed' ? 'badge-success' : 'badge-danger'}">${o.status}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${o.id}')">📄 View</button>
                        ${o.status === 'pending' || o.status === 'awaiting_pop' ? `
                          <button class="btn btn-orange btn-sm" onclick="uploadPOPForOrder('${o.id}')">📤 Upload POP</button>
                        ` : ''}
                        ${o.status === 'pending' || o.status === 'awaiting_pop' || o.status === 'pop_uploaded' || o.status === 'pending_manual_review' ? `
                          <button class="btn btn-danger btn-sm" onclick="cancelOrder('${o.id}')">✕ Cancel</button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    s.innerHTML = '<div class="container"><p>Could not load orders.</p></div>';
  }
}

async function viewOrderDetails(orderId) {
  try {
    const orders = await fetchOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) { toast('⚠️ Order not found'); return; }

    // Get order history
    const historyResponse = await fetch(`${API}/order-history/${orderId}`);
    const history = historyResponse.ok ? await historyResponse.json() : [];

    document.getElementById('modal-overlay').innerHTML = `
      <div class="modal" onclick="event.stopPropagation()" style="max-width:600px;">
        <div class="modal-header">
          <h3>📄 Order #${order.id}</h3>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <!-- Customer Info -->
          <div style="background:var(--surface);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
              <div><strong>Customer:</strong> ${order.customer?.name || 'Guest'}</div>
              <div><strong>WhatsApp:</strong> ${order.customer?.phone || 'N/A'}</div>
              <div style="grid-column:1/-1;"><strong>Address:</strong> ${order.customer?.address || 'N/A'}</div>
            </div>
          </div>

          <!-- Status -->
          <div style="background:var(--surface);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
              <div><strong>Status:</strong> <span class="badge ${order.status === 'paid' ? 'badge-success' : order.status === 'pending' || order.status === 'awaiting_pop' ? 'badge-warn' : order.status === 'pop_verified' ? 'badge-info' : order.status === 'pending_manual_review' ? 'badge-warn' : order.status === 'pop_uploaded' ? 'badge-info' : order.status === 'completed' ? 'badge-success' : 'badge-danger'}">${order.status}</span></div>
              <div><strong>Total:</strong> <span style="font-weight:700;color:var(--orange);">R${(order.total || 0).toFixed(2)}</span></div>
            </div>
          </div>

          <!-- Timeline -->
          ${history.length > 0 ? `
            <div style="background:var(--surface);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px;">
              <strong style="font-size:13px;">📋 Order Timeline</strong>
              <div style="margin-top:8px;max-height:200px;overflow-y:auto;">
                ${history.map(h => `
                  <div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">
                    <span style="font-weight:600;">${h.status === 'pending' ? '📝' : h.status === 'awaiting_pop' ? '⏳' : h.status === 'pop_uploaded' ? '📤' : h.status === 'pop_verified' ? '✅' : h.status === 'pending_manual_review' ? '🔍' : h.status === 'paid' ? '💰' : h.status === 'processing' ? '🔄' : h.status === 'shipped' ? '🚚' : h.status === 'delivered' ? '📦' : '❌'}</span>
                    <span>${h.status.replace(/_/g, ' ').toUpperCase()}</span>
                    <span style="color:var(--muted);margin-left:auto;">${new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Items -->
          <div style="margin-bottom:12px;">
            <strong style="font-size:13px;">🛒 Items</strong>
            ${(order.items || []).map(i => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--gray-100);font-size:13px;">
                <span>${i.name} × ${i.qty}</span>
                <span>R${(i.price * i.qty).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <!-- POP -->
          ${order.popPath ? `
            <div style="background:var(--surface);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px;">
              <strong style="font-size:13px;">📎 Proof of Payment</strong>
              <div style="margin-top:8px;">
                ${order.popPath.endsWith('.pdf') ? `
                  <a href="${order.popPath}" target="_blank" style="color:var(--orange);">📄 View PDF</a>
                ` : `
                  <img src="${order.popPath}" style="max-width:100%;max-height:200px;border-radius:8px;cursor:pointer;" onclick="window.open('${order.popPath}','_blank')">
                `}
              </div>
            </div>
          ` : ''}

          <!-- Payment Details -->
          <div style="background:var(--surface);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
              <div><strong>Payment Method:</strong> ${order.paymentMethod === 'payshap' ? '💳 Instant EFT' : order.paymentMethod}</div>
              <div><strong>Reference:</strong> <span style="font-family:monospace;">${order.paymentReference}</span></div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
            ${order.status === 'pending' || order.status === 'awaiting_pop' ? `
              <button class="btn btn-orange" onclick="closeModal();uploadPOPForOrder('${order.id}')">📤 Upload POP</button>
            ` : ''}
            ${order.status === 'pending' || order.status === 'awaiting_pop' || order.status === 'pop_uploaded' || order.status === 'pending_manual_review' ? `
              <button class="btn btn-danger" onclick="closeModal();cancelOrder('${order.id}')">✕ Cancel</button>
            ` : ''}
            ${order.popPath ? `
              <button class="btn btn-outline" onclick="window.open('${order.popPath}','_blank')">📄 View POP</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';

  } catch (err) {
    toast('❌ Could not load order details');
  }
}

async function uploadPOPForOrder(orderId) {
  closeModal();
  
  // Fetch the order to get details
  const orders = await fetchOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) { toast('⚠️ Order not found'); return; }
  
  // Reuse the POP upload modal
  showPOPUploadModal(order);
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) { const err = await res.json(); toast('❌ ' + err.error); return; }
    toast('🗑 Order cancelled');
    renderOrdersPage();
  } catch (err) {
    toast('❌ Failed to cancel order');
  }
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
        <textarea class="form-input" id="auth-address" rows="2" placeholder="Your full delivery address" required></textarea>
        <small style="color:var(--muted);">Enter your delivery address</small>
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
  localStorage.removeItem('habibi_user');
  updateAuthUI();
  toast('👋 Signed out');
  navigateTo('home');
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn'), userDisplay = document.getElementById('user-display');
  if (state.user) {
    if (btn) btn.style.display = 'none';
    if (userDisplay) {
      userDisplay.style.display = 'flex';
      userDisplay.innerHTML = `
        <div class="user-info">
          <div class="user-avatar" onclick="navigateTo('profile')" style="cursor:pointer;">
            ${state.user.name[0].toUpperCase()}
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
//  PROFILE PAGE
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

  section.innerHTML = `
    <div class="container">
      <h1 style="font-size:24px;font-weight:800;margin-bottom:20px;">👤 My Profile</h1>
      
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
        <h3>📸 Profile Picture</h3>
        <div style="background:#FFF8E1;padding:12px;border-radius:8px;border-left:4px solid var(--orange);">
          <p style="font-size:13px;color:var(--orange-dark);">Profile pictures coming soon! 🚀</p>
          <p style="font-size:12px;color:var(--muted);">You'll be able to upload a profile picture in the next update.</p>
        </div>
      </div>
    </div>
  `;
}

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
  if (!state.user) {
    toast('⚠️ Please sign in first');
    return;
  }
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
//  LOCATION
// ============================================================

async function shareLocation() {
  if (!navigator.geolocation) {
    toast('⚠️ Location sharing is not supported by your browser.');
    return;
  }

  const b = document.getElementById('location-btn');
  const addressElement = document.getElementById('co-address');
  
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
        <h4>4. Delivery</h4><p>Area-based fees.</p>
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
        <div id="comm-messages" style="max-height:300px;overflow-y:auto;padding:12px;background:var(--surface);border-radius:var(--radius-sm);margin-bottom:12px;"></div>
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
          <span style="font-size:13px;">Status: <span class="badge ${o.status === 'paid' ? 'badge-success' : o.status === 'pending' || o.status === 'awaiting_pop' ? 'badge-warn' : o.status === 'pop_verified' ? 'badge-info' : o.status === 'pending_manual_review' ? 'badge-warn' : o.status === 'pop_uploaded' ? 'badge-info' : o.status === 'completed' ? 'badge-success' : 'badge-danger'}">${o.status}</span></span>
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
    // Load order details
    const orders = await fetchOrders();
    const order = orders.find(o => o.id === orderId);
    
    // Load messages
    const response = await fetch(`${API}/communications/${orderId}`);
    const messages = await response.json();
    
    const container = document.getElementById('comm-messages');
    
    // Show order details at top
    let orderDetailsHTML = '';
    if (order) {
      orderDetailsHTML = `
        <div style="background:var(--orange-light);padding:12px;border-radius:8px;margin-bottom:12px;font-size:13px;">
          <div><strong>📄 Order #${order.id}</strong></div>
          <div><strong>Total:</strong> R${(order.total || 0).toFixed(2)}</div>
          <div><strong>Status:</strong> <span class="badge ${order.status === 'paid' ? 'badge-success' : order.status === 'pending' || order.status === 'awaiting_pop' ? 'badge-warn' : order.status === 'pop_verified' ? 'badge-info' : order.status === 'pending_manual_review' ? 'badge-warn' : order.status === 'pop_uploaded' ? 'badge-info' : order.status === 'completed' ? 'badge-success' : 'badge-danger'}">${order.status}</span></div>
          <div><strong>Address:</strong> ${order.customer?.address || 'N/A'}</div>
          <div style="margin-top:4px;">
            <strong>Items:</strong>
            ${(order.items || []).map(i => `<div style="font-size:12px;padding:2px 0;">${i.name} × ${i.qty} = R${(i.price * i.qty).toFixed(2)}</div>`).join('')}
          </div>
          ${order.popPath ? `
            <div style="margin-top:4px;">
              <strong>POP:</strong> 
              ${order.popPath.endsWith('.pdf') ? 
                `<a href="${order.popPath}" target="_blank" style="color:var(--orange);">📄 View PDF</a>` : 
                `<img src="${order.popPath}" style="max-width:100px;max-height:100px;border-radius:4px;cursor:pointer;" onclick="window.open('${order.popPath}','_blank')">`
              }
            </div>
          ` : ''}
        </div>
      `;
    }
    
    container.innerHTML = orderDetailsHTML + messages.map(m => `
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
    } catch {
      localStorage.removeItem('habibi_user');
    }
  }

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

document.addEventListener('DOMContentLoaded', init);