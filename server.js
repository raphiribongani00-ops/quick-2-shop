const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = 'mongodb://habibishoppingsa_db_user:ZCy1lEJmeMDIRHjJ@ac-fwxjvai-shard-00-00.ncnptop.mongodb.net:27017,ac-fwxjvai-shard-00-01.ncnptop.mongodb.net:27017,ac-fwxjvai-shard-00-02.ncnptop.mongodb.net:27017/habibi?ssl=true&replicaSet=atlas-4bfqgt-shard-0&authSource=admin';

const EMAIL_FROM = '"Quick 2 Shop" <habibishoppingsa@gmail.com>';
const EMAIL_USER = 'habibishoppingsa@gmail.com';
const EMAIL_PASS = 'xeujezeumwllgppk';

let transporter = null;
let emailConfigured = false;

// ============================================================
//  REWARDS CONFIGURATION
// ============================================================
const REWARD_CONFIG = {
  itemsPerReward: 10,
  rewardAmount: 2,
  minItemPrice: 10,

  streak: {
    enabled: true,
    minOrders: 3,
    weeklyBonus: 5,
    streakBonus: {
      4: 10,
      8: 25,
      12: 50,
    }
  },

  subscription: {
    enabled: true,
    basic: {
      price: 50,
      bonusReward: 2,
      freeDelivery: true,
      discountPercent: 5,
    },
    premium: {
      price: 100,
      bonusReward: 5,
      freeDelivery: true,
      discountPercent: 10,
      freeItemMonthly: true,
      freeItemValue: 30,
    }
  },

  tiers: {
    bronze: { label: '🥉 Bronze', minItems: 0, bonusPercent: 0 },
    silver: { label: '🥈 Silver', minItems: 50, bonusPercent: 10 },
    gold: { label: '🥇 Gold', minItems: 150, bonusPercent: 20 },
    platinum: { label: '💎 Platinum', minItems: 300, bonusPercent: 30 },
  },

  milestones: {
    10: 5,
    25: 15,
    50: 35,
    100: 80,
  }
};

// ============================================================
//  REWARD CALCULATION ENGINE
// ============================================================

function calculateItemReward(items) {
  if (!items || !items.length) {
    return {
      rewardAmount: 0,
      rewardSets: 0,
      eligibleItems: 0,
      ineligibleItems: 0,
      progressToNext: 0,
      itemsNeededForNext: REWARD_CONFIG.itemsPerReward,
      progressPercent: 0,
      details: { totalItems: 0, eligibleCount: 0, ineligibleCount: 0, rewardSets: 0 }
    };
  }

  const eligibleItems = items.filter(item => (item.price || 0) >= REWARD_CONFIG.minItemPrice);
  const eligibleCount = eligibleItems.length;
  const ineligibleCount = items.length - eligibleCount;
  const rewardSets = Math.floor(eligibleCount / REWARD_CONFIG.itemsPerReward);
  const rewardAmount = rewardSets * REWARD_CONFIG.rewardAmount;
  const remainingToNext = eligibleCount % REWARD_CONFIG.itemsPerReward;
  const itemsNeededForNext = remainingToNext === 0 ? 0 : REWARD_CONFIG.itemsPerReward - remainingToNext;

  return {
    rewardAmount: rewardAmount,
    rewardSets: rewardSets,
    eligibleItems: eligibleCount,
    ineligibleItems: ineligibleCount,
    progressToNext: remainingToNext,
    itemsNeededForNext: itemsNeededForNext,
    progressPercent: Math.round((remainingToNext / REWARD_CONFIG.itemsPerReward) * 100),
    details: {
      totalItems: items.length,
      eligibleCount: eligibleCount,
      ineligibleCount: ineligibleCount,
      rewardSets: rewardSets,
      rewardPerSet: REWARD_CONFIG.rewardAmount,
    }
  };
}

function calculateStreak(orders) {
  if (!orders || orders.length < REWARD_CONFIG.streak.minOrders) {
    return { streakCount: 0, bonusAmount: 0, nextBonusAt: REWARD_CONFIG.streak.minOrders };
  }

  let streak = 1;
  let currentDate = new Date(orders[0]?.createdAt || Date.now());

  for (let i = 1; i < orders.length; i++) {
    const orderDate = new Date(orders[i].createdAt);
    const daysDiff = (currentDate - orderDate) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 7) {
      streak++;
      currentDate = orderDate;
    } else {
      break;
    }
  }

  let bonusAmount = 0;
  if (streak >= 4) bonusAmount += REWARD_CONFIG.streak.streakBonus[4] || 0;
  if (streak >= 8) bonusAmount += REWARD_CONFIG.streak.streakBonus[8] || 0;
  if (streak >= 12) bonusAmount += REWARD_CONFIG.streak.streakBonus[12] || 0;
  if (streak >= REWARD_CONFIG.streak.minOrders) {
    bonusAmount += REWARD_CONFIG.streak.weeklyBonus;
  }

  return {
    streakCount: streak,
    bonusAmount: bonusAmount,
    nextBonusAt: streak >= 12 ? null : Math.ceil((streak + 1) / 4) * 4,
  };
}

function getUserTier(totalRewardsEarned) {
  if (totalRewardsEarned >= 300) return 'platinum';
  if (totalRewardsEarned >= 150) return 'gold';
  if (totalRewardsEarned >= 50) return 'silver';
  return 'bronze';
}

function getMilestoneBonus(totalRewardsEarned) {
  const milestones = REWARD_CONFIG.milestones;
  let bonus = 0;
  for (const [threshold, amount] of Object.entries(milestones)) {
    if (totalRewardsEarned >= parseInt(threshold)) {
      bonus += amount;
    }
  }
  return bonus;
}

function calculateTotalRewardValue(user, orders) {
  const allItems = orders.flatMap(o => o.items || []);
  const baseResult = calculateItemReward(allItems);
  const baseRewards = baseResult.rewardAmount;
  const streak = calculateStreak(orders);
  const streakBonus = streak.bonusAmount;

  let subscriptionBonus = 0;
  if (user.subscriptionTier) {
    const subConfig = REWARD_CONFIG.subscription[user.subscriptionTier];
    if (subConfig) {
      subscriptionBonus = subConfig.bonusReward || 0;
    }
  }

  const totalRewardsEarned = Math.floor(baseRewards / REWARD_CONFIG.rewardAmount);
  const tier = getUserTier(totalRewardsEarned);
  const tierBonusPercent = REWARD_CONFIG.tiers[tier]?.bonusPercent || 0;
  const milestoneBonus = getMilestoneBonus(totalRewardsEarned);

  const totalRewardBalance = baseRewards + streakBonus + subscriptionBonus + milestoneBonus;
  const tierBonusAmount = (totalRewardBalance * tierBonusPercent) / 100;

  return {
    baseRewards: baseRewards,
    streakBonus: streakBonus,
    subscriptionBonus: subscriptionBonus,
    milestoneBonus: milestoneBonus,
    tierBonus: tierBonusAmount,
    totalRewardBalance: totalRewardBalance + tierBonusAmount,
    totalRewardsEarned: totalRewardsEarned,
    tier: tier,
    streakCount: streak.streakCount,
    progress: baseResult,
  };
}

// ============================================================
//  EMAIL SETUP
// ============================================================

async function setupEmail() {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
    await transporter.verify();
    emailConfigured = true;
    console.log('📧 Gmail ready');
  } catch (err) {
    emailConfigured = false;
    console.warn('⚠️ Gmail failed:', err.message);
  }
}

const otpStore = {};

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(express.static(__dirname));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const emailsDir = path.join(__dirname, 'saved_emails');
if (!fs.existsSync(emailsDir)) fs.mkdirSync(emailsDir, { recursive: true });

let db;
const client = new MongoClient(MONGO_URI, {
  tls: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000
});

// ============================================================
//  DATABASE CONNECTION
// ============================================================

async function connectDB() {
  try {
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('orders').createIndex({ id: 1 });
    await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });
    await seedDefaultData();
    await setupEmail();
  } catch (err) {
    console.error('❌ MongoDB failed:', err);
    process.exit(1);
  }
}

async function seedDefaultData() {
  const catCount = await db.collection('categories').countDocuments();
  if (catCount === 0) {
    await db.collection('categories').insertMany([
      { id: "food", label: "Food & Snacks", icon: "🍕" },
      { id: "drinks", label: "Beverages", icon: "🧃" },
      { id: "shoes", label: "Shoes", icon: "👟" },
      { id: "clothing", label: "Clothing", icon: "👕" },
      { id: "stationery", label: "Stationery", icon: "📚" },
      { id: "electronics", label: "Electronics", icon: "💻" },
      { id: "beauty", label: "Beauty", icon: "💄" },
      { id: "other", label: "Other", icon: "📦" }
    ]);
    console.log('✅ Default categories seeded');
  }

  const prodCount = await db.collection('products').countDocuments();
  if (prodCount === 0) {
    await db.collection('products').insertMany([
      { 
        name: "Clover Butro Spread 500g", 
        price: 102, 
        stock: 100, 
        category: "food", 
        rating: 5, 
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=320&q=80", 
        description: "Full cream butter spread",
        featured: false,
        reviews: 0,
        createdAt: new Date().toISOString() 
      },
      { 
        name: "Fruit Juice 500ml", 
        price: 18, 
        stock: 50, 
        category: "drinks", 
        rating: 4.7, 
        image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=320&q=80", 
        description: "Fresh mango juice",
        featured: false,
        reviews: 0,
        createdAt: new Date().toISOString() 
      },
      { 
        name: "Nike Air Max", 
        price: 850, 
        stock: 8, 
        category: "shoes", 
        rating: 4.8, 
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=320&q=80", 
        description: "Classic sneakers",
        featured: true,
        reviews: 0,
        createdAt: new Date().toISOString() 
      }
    ]);
    console.log('✅ Default products seeded');
  }

  const slideCount = await db.collection('slides').countDocuments();
  if (slideCount === 0) {
    await db.collection('slides').insertMany([
      {
        image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1920&q=80",
        caption: "Welcome to Quick 2 Shop!",
        active: true,
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        image: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=80",
        caption: "Fresh groceries delivered to your door",
        active: true,
        order: 2,
        createdAt: new Date().toISOString()
      }
    ]);
    console.log('✅ Default slides seeded');
  }

  const userCount = await db.collection('users').countDocuments();
  if (userCount === 0) {
    await db.collection('users').insertOne({
      name: "Admin",
      email: "admin@habibi.co.za",
      password: "admin123",
      rewardBalance: 0,
      totalRewardsEarned: 0,
      eligibleItemsPurchased: 0,
      subscriptionTier: null,
      streakCount: 0,
      lastOrderDate: null,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Default admin user seeded');
  }
}

connectDB();

// ============================================================
//  UTILITY FUNCTIONS
// ============================================================

function saveBase64File(base64Data, orderId) {
  if (!base64Data || !base64Data.includes('base64')) return null;
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  const buffer = Buffer.from(matches[2], 'base64');
  let ext = '.bin';
  const mime = matches[1];
  if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
  else if (mime.includes('png')) ext = '.png';
  else if (mime.includes('pdf')) ext = '.pdf';
  const filename = `pop_${orderId}_${Date.now()}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

async function sendEmail(to, subject, html) {
  if (emailConfigured && transporter) {
    try {
      await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
      return true;
    } catch (e) { }
  }
  const filename = `${Date.now()}_${subject.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.html`;
  fs.writeFileSync(path.join(emailsDir, filename), `<h3>To: ${to}</h3><h4>Subject: ${subject}</h4>${html}`);
  return false;
}

async function sendPasswordResetOTP(email, otp) {
  return sendEmail(email, 'Quick 2 Shop - Password Reset OTP',
    `<h2>Your OTP: ${otp}</h2><p>This OTP expires in 10 minutes.</p>`
  );
}

async function sendRewardNotification(email, amount, reason) {
  return sendEmail(email, '🎁 Quick 2 Shop - Rewards Update',
    `<h2>You've earned R${amount.toFixed(2)} in rewards!</h2>
     <p>${reason}</p>
     <p>Keep shopping to earn more rewards!</p>`
  );
}

async function sendOrderInvoice(order) {
  const items = (order.items || []).map(i =>
    `<tr><td>${i.name}</td><td>${i.qty}</td><td>R${(i.price * i.qty).toFixed(2)}</td></tr>`
  ).join('');
  return sendEmail(order.customer?.email, `Quick 2 Shop - Order #${order.id}`,
    `<h2>Thank you!</h2>
     <p>Order: ${order.id}</p>
     <p>Total: R${order.total.toFixed(2)}</p>
     ${order.rewardEarned ? `<p>🎁 Reward earned: R${order.rewardEarned.toFixed(2)}</p>` : ''}
     <table>${items}</table>`
  );
}

async function sendDeliveryNotification(order) {
  return sendEmail(order.customer?.email, `Quick 2 Shop - Order #${order.id} Out for Delivery`,
    `<h2>Your order is on the way!</h2>`
  );
}

// ============================================================
//  PRODUCTS API (FIXED)
// ============================================================

app.get('/api/products', async (req, res) => {
  try {
    const query = {};
    console.log('📦 Products request params:', req.query);
    
    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      const category = decodeURIComponent(req.query.category);
      query.category = category;
      console.log('🔍 Filtering by category:', category);
    }
    
    // Featured filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    // Search filter
    let products;
    try {
      if (req.query.search && req.query.search.trim()) {
        const regex = new RegExp(req.query.search.trim(), 'i');
        products = await db.collection('products').find({
          ...query,
          $or: [
            { name: regex },
            { description: regex },
            { category: regex }
          ]
        }).toArray();
      } else {
        products = await db.collection('products').find(query).toArray();
      }
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      products = [];
    }
    
    // Make sure products is always an array
    if (!products || !Array.isArray(products)) {
      products = [];
    }
    
    // Add id field for frontend compatibility
    const formatted = products.map(p => ({
      ...p,
      id: p._id ? p._id.toString() : p.id || 'unknown'
    }));
    
    console.log(`📦 Returning ${formatted.length} products for category:`, query.category || 'all');
    res.json(formatted);
    
  } catch (err) {
    console.error('❌ Products error:', err);
    res.json([]);
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const p = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const np = {
      ...req.body,
      featured: req.body.featured || false,
      createdAt: new Date().toISOString()
    };
    const result = await db.collection('products').insertOne(np);
    res.status(201).json({ ...np, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const result = await db.collection('products').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'Not found' });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/featured-products', async (req, res) => {
  try {
    res.json(await db.collection('products').find({ featured: true }).limit(3).toArray());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  ORDERS API (WITH REWARDS)
// ============================================================

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.collection('orders').find().toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = {
      ...req.body,
      id: 'ORD-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      rewardEarned: 0,
      rewardDetails: null,
    };

    const items = order.items || [];
    const rewardResult = calculateItemReward(items);
    const rewardAmount = rewardResult.rewardAmount;

    if (rewardAmount > 0 && order.userId) {
      order.rewardEarned = rewardAmount;
      order.rewardDetails = rewardResult.details;

      await db.collection('users').updateOne(
        { _id: new ObjectId(order.userId) },
        {
          $inc: {
            rewardBalance: rewardAmount,
            totalRewardsEarned: rewardResult.rewardSets,
            eligibleItemsPurchased: rewardResult.eligibleItems,
          },
          $set: { lastOrderDate: new Date().toISOString() }
        }
      );

      if (order.customer?.email) {
        await sendRewardNotification(
          order.customer.email,
          rewardAmount,
          `You earned R${rewardAmount.toFixed(2)} from ${rewardResult.rewardSets} sets of 10 items!`
        );
      }
    } else if (order.userId) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(order.userId) },
        { $set: { lastOrderDate: new Date().toISOString() } }
      );
    }

    if (order.proofOfPayment?.includes('base64')) {
      const fp = saveBase64File(order.proofOfPayment, order.id);
      if (fp) {
        order.proofOfPaymentPath = fp;
        delete order.proofOfPayment;
      }
    }

    await db.collection('orders').insertOne(order);
    await sendOrderInvoice(order);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const result = await db.collection('orders').findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'Not found' });

    const order = result.value;

    if (req.body.status === 'paid' && order.status !== 'paid') {
      if (order.userId) {
        const user = await db.collection('users').findOne({ _id: new ObjectId(order.userId) });
        if (user?.subscriptionTier) {
          const subConfig = REWARD_CONFIG.subscription[user.subscriptionTier];
          if (subConfig && subConfig.discountPercent) {
            // Apply discount logic here
          }
        }
      }
    }

    if (req.body.status === 'completed') {
      await sendDeliveryNotification(order);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.collection('orders').findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot delete completed or cancelled orders' });
    }

    if (order.rewardEarned > 0 && order.userId) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(order.userId) },
        { $inc: { rewardBalance: -order.rewardEarned } }
      );
    }

    await db.collection('orders').deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  USERS API
// ============================================================

app.post('/api/register', async (req, res) => {
  try {
    if (await db.collection('users').findOne({ email: req.body.email })) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const nu = {
      ...req.body,
      rewardBalance: 0,
      totalRewardsEarned: 0,
      eligibleItemsPurchased: 0,
      subscriptionTier: null,
      streakCount: 0,
      lastOrderDate: null,
      createdAt: new Date().toISOString()
    };
    await db.collection('users').insertOne(nu);
    const { password, ...safe } = nu;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({
      email: req.body.email,
      password: req.body.password
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  REWARDS API
// ============================================================

app.get('/api/user/rewards/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orders = await db.collection('orders')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    const rewardData = calculateTotalRewardValue(user, orders);

    let subscriptionInfo = null;
    if (user.subscriptionTier) {
      subscriptionInfo = {
        tier: user.subscriptionTier,
        config: REWARD_CONFIG.subscription[user.subscriptionTier],
        active: true,
        startedAt: user.subscriptionStartedAt,
      };
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      rewardBalance: rewardData.totalRewardBalance,
      totalRewardsEarned: rewardData.totalRewardsEarned,
      tier: rewardData.tier,
      breakdown: {
        baseRewards: rewardData.baseRewards,
        streakBonus: rewardData.streakBonus,
        subscriptionBonus: rewardData.subscriptionBonus,
        milestoneBonus: rewardData.milestoneBonus,
        tierBonus: rewardData.tierBonus,
      },
      progress: {
        eligibleItems: rewardData.progress.eligibleItems,
        progressToNext: rewardData.progress.progressToNext,
        itemsNeededForNext: rewardData.progress.itemsNeededForNext,
        progressPercent: rewardData.progress.progressPercent,
      },
      streak: {
        count: rewardData.streakCount,
        nextBonusAt: rewardData.streakCount >= 12 ? null : Math.ceil((rewardData.streakCount + 1) / 4) * 4,
      },
      subscription: subscriptionInfo,
      recentOrders: orders.slice(0, 5).map(o => ({
        id: o.id,
        total: o.total,
        rewardEarned: o.rewardEarned || 0,
        status: o.status,
        createdAt: o.createdAt,
      })),
      tierProgress: {
        current: rewardData.tier,
        next: getNextTier(rewardData.totalRewardsEarned),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getNextTier(totalRewardsEarned) {
  if (totalRewardsEarned < 50) return { tier: 'silver', minItems: 50, gap: 50 - totalRewardsEarned };
  if (totalRewardsEarned < 150) return { tier: 'gold', minItems: 150, gap: 150 - totalRewardsEarned };
  if (totalRewardsEarned < 300) return { tier: 'platinum', minItems: 300, gap: 300 - totalRewardsEarned };
  return null;
}

app.post('/api/user/redeem-rewards', async (req, res) => {
  try {
    const { email, amount } = req.body;
    if (!email || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Email and valid amount required' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.rewardBalance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient reward balance' });
    }

    await db.collection('users').updateOne(
      { email },
      {
        $inc: { rewardBalance: -amount },
        $push: {
          rewardHistory: {
            type: 'redemption',
            amount: amount,
            date: new Date().toISOString(),
          }
        }
      }
    );

    res.json({
      success: true,
      redeemed: amount,
      remaining: (user.rewardBalance || 0) - amount,
      message: `Successfully redeemed R${amount.toFixed(2)}!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/reward-progress', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orders = await db.collection('orders')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const allItems = orders.flatMap(o => o.items || []);
    const progress = calculateItemReward(allItems);
    const streak = calculateStreak(orders);

    res.json({
      rewardBalance: user.rewardBalance || 0,
      totalRewardsEarned: user.totalRewardsEarned || 0,
      progress: {
        eligibleItems: progress.eligibleItems,
        itemsNeededForNext: progress.itemsNeededForNext,
        progressToNext: progress.progressToNext,
        progressPercent: progress.progressPercent,
        rewardSetsEarned: progress.rewardSets,
      },
      streak: {
        count: streak.streakCount,
        bonusAmount: streak.bonusAmount,
      },
      subscription: {
        active: !!user.subscriptionTier,
        tier: user.subscriptionTier || null,
      },
      nextRewardAt: progress.itemsNeededForNext === 0 ? 'Ready!' : `${progress.itemsNeededForNext} more items`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/points', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ email: req.query.email });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ points: user.points || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/redeem-points', async (req, res) => {
  try {
    const { email, points } = req.body;
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(404).json({ error: 'Not found' });
    if ((user.points || 0) < points) return res.status(400).json({ error: 'Not enough points' });
    await db.collection('users').updateOne({ email }, { $inc: { points: -points } });
    res.json({ success: true, remaining: (user.points || 0) - points, redeemed: points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  SUBSCRIPTION API
// ============================================================

app.post('/api/user/subscribe', async (req, res) => {
  try {
    const { userId, tier } = req.body;
    if (!['basic', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const config = REWARD_CONFIG.subscription[tier];

    if (user.subscriptionTier === tier) {
      return res.status(400).json({ error: 'Already subscribed to this tier' });
    }

    if (user.subscriptionTier === 'basic' && tier === 'premium') {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            subscriptionTier: tier,
            subscriptionStartedAt: new Date().toISOString(),
            subscriptionUpdatedAt: new Date().toISOString(),
          },
          $inc: { rewardBalance: config.bonusReward }
        }
      );
      res.json({ success: true, message: `Upgraded to ${tier} tier!` });
      return;
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          subscriptionTier: tier,
          subscriptionStartedAt: new Date().toISOString(),
          subscriptionUpdatedAt: new Date().toISOString(),
        },
        $inc: { rewardBalance: config.bonusReward }
      }
    );

    if (user.email) {
      await sendEmail(
        user.email,
        `🎉 Welcome to Quick 2 Shop ${tier} tier!`,
        `<h2>Welcome to ${tier} tier!</h2>
         <p>You've received R${config.bonusReward.toFixed(2)} in rewards!</p>
         <ul>
           ${config.freeDelivery ? '<li>✅ Free delivery on all orders</li>' : ''}
           ${config.discountPercent ? `<li>✅ ${config.discountPercent}% off every order</li>` : ''}
           ${config.freeItemMonthly ? '<li>✅ Free item every month</li>' : ''}
         </ul>`
      );
    }

    res.json({
      success: true,
      message: `Subscribed to ${tier} tier!`,
      bonusReward: config.bonusReward,
      benefits: {
        freeDelivery: config.freeDelivery,
        discountPercent: config.discountPercent,
        freeItemMonthly: config.freeItemMonthly || false,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.subscriptionTier) {
      return res.status(400).json({ error: 'Not subscribed' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          subscriptionTier: null,
          subscriptionEndedAt: new Date().toISOString(),
        }
      }
    );

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  FORGOT PASSWORD
// ============================================================

app.post('/api/forgot-password', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'No account found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[req.body.email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    const sent = await sendPasswordResetOTP(req.body.email, otp);
    res.json({
      message: sent ? 'OTP sent' : 'OTP saved',
      devMode: !sent,
      otp: !sent ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const stored = otpStore[email];
  if (!stored || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  try {
    await db.collection('users').updateOne(
      { email },
      { $set: { password: newPassword } }
    );
    delete otpStore[email];
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  CATEGORIES API
// ============================================================

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.collection('categories').find({}).toArray();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { id, label } = req.body;
    if (!id || !label) return res.status(400).json({ error: 'ID and label required' });

    const exists = await db.collection('categories').findOne({ id });
    if (exists) return res.status(400).json({ error: 'Category ID already exists' });

    const nc = { id, label, icon: req.body.icon || '🏷️' };
    await db.collection('categories').insertOne(nc);
    res.status(201).json(nc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const r = await db.collection('categories').findOneAndUpdate(
      { id: req.params.id },
      { $set: { label: req.body.label, icon: req.body.icon || '🏷️' } },
      { returnDocument: 'after' }
    );
    if (!r.value) return res.status(404).json({ error: 'Not found' });
    res.json(r.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const pc = await db.collection('products').countDocuments({ category: req.params.id });
    if (pc > 0) {
      return res.status(400).json({ error: `Cannot delete: ${pc} products use this category` });
    }
    await db.collection('categories').deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  SLIDESHOW API
// ============================================================

app.get('/api/slides', async (req, res) => {
  try {
    const slides = await db.collection('slides')
      .find({ active: true })
      .sort({ order: 1 })
      .toArray();
    const formatted = slides.map(s => ({ ...s, id: s._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/slides/admin', async (req, res) => {
  try {
    const slides = await db.collection('slides').find({}).sort({ order: 1 }).toArray();
    const formatted = slides.map(s => ({ ...s, id: s._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/slides', async (req, res) => {
  try {
    const max = await db.collection('slides').find().sort({ order: -1 }).limit(1).toArray();
    const ns = {
      ...req.body,
      active: true,
      order: (max[0]?.order || 0) + 1,
      createdAt: new Date().toISOString()
    };
    const r = await db.collection('slides').insertOne(ns);
    res.status(201).json({ ...ns, _id: r.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/slides/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid' });
    const r = await db.collection('slides').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!r.value) return res.status(404).json({ error: 'Not found' });
    res.json(r.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/slides/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid' });
    const r = await db.collection('slides').deleteOne({ _id: new ObjectId(req.params.id) });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  STATIC FILES & FALLBACK
// ============================================================

app.get('/admin.html', (req, res) => {
  const fp = path.join(__dirname, 'admin.html');
  if (fs.existsSync(fp)) res.sendFile(fp);
  else res.status(404).send('Not found');
});

app.get('/admin', (req, res) => res.redirect('/admin.html'));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  const fp = path.join(__dirname, req.path);
  if (fs.existsSync(fp) && path.extname(fp)) return res.sendFile(fp);
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================
//  START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🛒 Quick 2 Shop running on port ${PORT}`);
  console.log(`📧 Gmail: ${emailConfigured ? 'READY' : 'NOT CONFIGURED'}`);
  console.log(`\n📊 Reward Rules:`);
  console.log(`  • ${REWARD_CONFIG.itemsPerReward} items (R${REWARD_CONFIG.minItemPrice}+) = R${REWARD_CONFIG.rewardAmount} reward`);
  console.log(`  • ${REWARD_CONFIG.streak.enabled ? '✅' : '❌'} Streak rewards enabled`);
  console.log(`  • ${REWARD_CONFIG.subscription.enabled ? '✅' : '❌'} Subscriptions enabled`);
  console.log(`  • Tiers: Bronze → Silver (50) → Gold (150) → Platinum (300)`);
});