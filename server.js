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
//  DELIVERY AREAS & FEES
// ============================================================

const DELIVERY_AREAS = {
  braamfontein: { label: 'Braamfontein', fee: 15, keywords: ['braamfontein', 'jorissen', 'kingsway', 'biccard', 'melle', 'ennis', 'empire'] },
  doornfontein: { label: 'Doornfontein', fee: 20, keywords: ['doornfontein', 'bezuidenhout', 'twist', 'de villiers', 'goud'] },
  parktown: { label: 'Parktown', fee: 25, keywords: ['parktown', 'york', 'jan smuts', 'riviera', 'oxford'] },
  aucklandpark: { label: 'Auckland Park', fee: 25, keywords: ['auckland park', 'aucklandpark', 'greenhill', 'greenwood', 'marthin', 'university'] }
};

// ============================================================
//  STUDENT DISCOUNT
// ============================================================

const STUDENT_DISCOUNT = 20; // 20% off delivery fee
const DISCOUNT_EXPIRY = '2026-09-30';

// ============================================================
//  BUILDINGS DATABASE
// ============================================================

const BUILDINGS = {
  braamfontein: [
    "Wits Junction", "Wits Junction Park", "Wits East Campus Residences", "Wits West Campus Residences", "Wits Braamfontein Campus",
    "UJ Kingsway Campus Residences", "UJ APK Residences",
    "South Point - 56 Jorissen", "South Point - 2 De Korte", "South Point - 8 De Korte", "South Point - 22 De Korte",
    "South Point - 31 Jorissen", "South Point - 36 Jorissen", "South Point - 69 Jorissen", "South Point - 105 Jorissen",
    "South Point - 114 Jorissen", "South Point - 120 Jorissen", "South Point - 128 Jorissen", "South Point - 134 Jorissen",
    "The Lab Res", "The Lofts", "Campus Village", "Braamfontein Student Village", "Wits 1952", "The Edge", "The Square",
    "Auckland House", "Braamfontein Towers", "Metropolitan Tower", "Braamfontein Centre", "The Annex", "City Lights", "Braamfontein Gateway"
  ],
  doornfontein: [
    "UJ Doornfontein Campus Residences", "Doornfontein Towers", "Bezuidenhout Street Apartments",
    "Twist Street Residences", "De Villiers Court", "Goud Street Student Accommodation", "Doornfontein Student Village"
  ],
  parktown: [
    "Wits Parktown Residences", "Parktown Heights", "York Road Apartments", "Jan Smuts Avenue Residences",
    "Riviera Court", "Oxford Street Apartments", "Parktown Student Village"
  ],
  aucklandpark: [
    "UJ Auckland Park Residences", "Auckland Park Heights", "Greenhill Apartments", "Greenwood Court",
    "Marthin Street Residences", "University View Apartments", "Auckland Park Student Village"
  ]
};

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
    streakBonus: { 4: 10, 8: 25, 12: 50 }
  },
  subscription: {
    enabled: true,
    basic: { price: 50, bonusReward: 2, freeDelivery: true, discountPercent: 5 },
    premium: { price: 100, bonusReward: 5, freeDelivery: true, discountPercent: 10, freeItemMonthly: true, freeItemValue: 30 }
  },
  tiers: {
    bronze: { label: '🥉 Bronze', minItems: 0, bonusPercent: 0 },
    silver: { label: '🥈 Silver', minItems: 50, bonusPercent: 10 },
    gold: { label: '🥇 Gold', minItems: 150, bonusPercent: 20 },
    platinum: { label: '💎 Platinum', minItems: 300, bonusPercent: 30 }
  },
  milestones: { 10: 5, 25: 15, 50: 35, 100: 80 }
};

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
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('buildings').createIndex({ name: 1 });
    await seedDefaultData();
    await setupEmail();
  } catch (err) {
    console.error('❌ MongoDB failed:', err);
    process.exit(1);
  }
}

// ============================================================
//  SEED DATA
// ============================================================

async function seedDefaultData() {
  console.log('🌱 Seeding default data...');
  try {
    // Seed categories
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
      console.log('✅ Categories seeded');
    }

    // Seed products
    const prodCount = await db.collection('products').countDocuments();
    if (prodCount === 0) {
      await db.collection('products').insertMany([
        { name: "Fresh Apple 🍎", price: 5, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=320&q=80", description: "Fresh red apples", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() },
        { name: "Banana 🍌", price: 3, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=320&q=80", description: "Fresh yellow bananas", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() },
        { name: "Orange 🍊", price: 4, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=320&q=80", description: "Fresh juicy oranges", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() },
        { name: "Avocado 🥑", price: 8, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=320&q=80", description: "Fresh avocados", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() },
        { name: "Carrot 🥕", price: 2, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=320&q=80", description: "Fresh organic carrots", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() },
        { name: "Tomato 🍅", price: 3, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=320&q=80", description: "Fresh ripe tomatoes", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() },
        { name: "Potato 🥔", price: 4, stock: 100, category: "food", rating: 4.5, image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=320&q=80", description: "Fresh potatoes", featured: false, special: null, reviews: 0, createdAt: new Date().toISOString() }
      ]);
      console.log('✅ Products seeded');
    }

    // Seed slides
    const slideCount = await db.collection('slides').countDocuments();
    if (slideCount === 0) {
      await db.collection('slides').insertMany([
        { image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1920&q=80", caption: "Welcome to Quick 2 Shop!", active: true, order: 1, createdAt: new Date().toISOString() },
        { image: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=80", caption: "Fresh groceries delivered to your door", active: true, order: 2, createdAt: new Date().toISOString() }
      ]);
      console.log('✅ Slides seeded');
    }

    // Seed admin user
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
        isStudent: false,
        studentVerified: false,
        studentProof: null,
        studentVerificationDate: null,
        profilePicture: null,
        whatsapp: null,
        address: null,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Admin user seeded');
    }

    // Seed buildings
    const buildingCount = await db.collection('buildings').countDocuments();
    if (buildingCount === 0) {
      const allBuildings = [];
      for (const [area, buildings] of Object.entries(BUILDINGS)) {
        buildings.forEach(name => {
          allBuildings.push({ name, area, address: name, searchTerms: name.toLowerCase().split(' ') });
        });
      }
      await db.collection('buildings').insertMany(allBuildings);
      console.log(`✅ ${allBuildings.length} buildings seeded`);
    }

    console.log('✅ All seed data complete!');
  } catch (error) {
    console.error('❌ Seed data error:', error);
  }
}

connectDB();

// ============================================================
//  UTILITY FUNCTIONS
// ============================================================

function detectDeliveryArea(address) {
  if (!address) return 'braamfontein';
  const lower = address.toLowerCase();
  for (const [area, config] of Object.entries(DELIVERY_AREAS)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        return area;
      }
    }
  }
  return 'braamfontein';
}

function getDeliveryFee(address) {
  const area = detectDeliveryArea(address);
  return DELIVERY_AREAS[area]?.fee || 15;
}

function calculateStudentDiscount(deliveryFee, isStudent) {
  if (!isStudent) return 0;
  return deliveryFee * (STUDENT_DISCOUNT / 100);
}

function saveBase64File(base64Data, orderId, type = 'pop') {
  if (!base64Data || !base64Data.includes('base64')) return null;
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  const buffer = Buffer.from(matches[2], 'base64');
  let ext = '.bin';
  const mime = matches[1];
  if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
  else if (mime.includes('png')) ext = '.png';
  else if (mime.includes('webp')) ext = '.webp';
  else if (mime.includes('pdf')) ext = '.pdf';
  const filename = `${type}_${orderId}_${Date.now()}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

async function sendEmail(to, subject, html) {
  if (emailConfigured && transporter) {
    try {
      await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
      return true;
    } catch (e) { console.error('Email error:', e); }
  }
  const filename = `${Date.now()}_${subject.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.html`;
  fs.writeFileSync(path.join(emailsDir, filename), `<h3>To: ${to}</h3><h4>Subject: ${subject}</h4>${html}`);
  return false;
}

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

// ============================================================
//  REWARD CALCULATION ENGINE
// ============================================================

function calculateItemReward(items) {
  if (!items || !items.length) {
    return { rewardAmount: 0, rewardSets: 0, eligibleItems: 0, ineligibleItems: 0, progressToNext: 0, itemsNeededForNext: REWARD_CONFIG.itemsPerReward, progressPercent: 0, details: { totalItems: 0, eligibleCount: 0, ineligibleCount: 0, rewardSets: 0 } };
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
    details: { totalItems: items.length, eligibleCount: eligibleCount, ineligibleCount: ineligibleCount, rewardSets: rewardSets, rewardPerSet: REWARD_CONFIG.rewardAmount }
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

  return { streakCount: streak, bonusAmount: bonusAmount, nextBonusAt: streak >= 12 ? null : Math.ceil((streak + 1) / 4) * 4 };
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
    progress: baseResult
  };
}

function getNextTier(totalRewardsEarned) {
  if (totalRewardsEarned < 50) return { tier: 'silver', minItems: 50, gap: 50 - totalRewardsEarned };
  if (totalRewardsEarned < 150) return { tier: 'gold', minItems: 150, gap: 150 - totalRewardsEarned };
  if (totalRewardsEarned < 300) return { tier: 'platinum', minItems: 300, gap: 300 - totalRewardsEarned };
  return null;
}

// ============================================================
//  USER API
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
      isStudent: false,
      studentVerified: false,
      studentProof: null,
      studentVerificationDate: null,
      profilePicture: null,
      whatsapp: req.body.whatsapp || null,
      address: req.body.address || null,
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

app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({
      _id: new ObjectId(req.params.id)
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.password;
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = result.value;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  STUDENT VERIFICATION API
// ============================================================

app.post('/api/user/verify-student', async (req, res) => {
  try {
    const { userId, proofBase64 } = req.body;
    if (!userId || !proofBase64) {
      return res.status(400).json({ error: 'User ID and proof required' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const filename = saveBase64File(proofBase64, userId, 'student_proof');
    if (!filename) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          studentProof: filename,
          studentVerified: false,
          studentVerificationDate: null,
          isStudent: false
        }
      }
    );

    await sendEmail(
      'habibishoppingsa@gmail.com',
      `🎓 Student Verification Request - ${user.name}`,
      `<h2>New Student Verification Request</h2>
       <p><strong>Name:</strong> ${user.name}</p>
       <p><strong>Email:</strong> ${user.email}</p>
       <p><strong>User ID:</strong> ${userId}</p>
       <p><strong>Proof:</strong> <a href="${filename}">View Document</a></p>
       <p><a href="https://quick-2-shop.onrender.com/admin.html">Approve in Admin Panel</a></p>`
    );

    res.json({ 
      success: true, 
      message: 'Proof submitted for verification. You will be notified once approved.',
      pending: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/student-verifications', async (req, res) => {
  try {
    const users = await db.collection('users')
      .find({ studentProof: { $ne: null }, studentVerified: false })
      .toArray();
    const safe = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/verify-student/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved } = req.body;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isStudent: approved,
          studentVerified: approved,
          studentVerificationDate: approved ? new Date().toISOString() : null
        }
      }
    );

    if (approved) {
      await sendEmail(
        user.email,
        '🎉 Student Discount Approved!',
        `<h2>Congratulations ${user.name}!</h2>
         <p>Your student status has been verified. You now get 20% off delivery fees!</p>
         <p><strong>Discount valid until:</strong> ${DISCOUNT_EXPIRY}</p>
         <p>Start shopping at: <a href="https://quick-2-shop.onrender.com">Quick 2 Shop</a></p>`
      );
    }

    res.json({ success: true, approved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  BUILDINGS API
// ============================================================

app.get('/api/buildings', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search && search.trim()) {
      const terms = search.trim().toLowerCase().split(' ').filter(t => t.length > 0);
      query = { searchTerms: { $all: terms } };
    }
    const buildings = await db.collection('buildings').find(query).limit(20).toArray();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/buildings/area/:area', async (req, res) => {
  try {
    const buildings = await db.collection('buildings')
      .find({ area: req.params.area })
      .toArray();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  DELIVERY API
// ============================================================

app.get('/api/delivery/fee', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.json({ fee: 15, area: 'braamfontein', label: 'Braamfontein' });
    }
    const area = detectDeliveryArea(address);
    const fee = DELIVERY_AREAS[area]?.fee || 15;
    res.json({ fee, area, label: DELIVERY_AREAS[area]?.label || 'Braamfontein' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  PRODUCTS API
// ============================================================

app.get('/api/products', async (req, res) => {
  try {
    const query = {};
    if (req.query.category && req.query.category !== 'all') {
      query.category = decodeURIComponent(req.query.category);
    }
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    let products;
    try {
      if (req.query.search && req.query.search.trim()) {
        const regex = new RegExp(req.query.search.trim(), 'i');
        products = await db.collection('products').find({ ...query, $or: [{ name: regex }, { description: regex }, { category: regex }] }).toArray();
      } else {
        products = await db.collection('products').find(query).toArray();
      }
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      products = [];
    }
    if (!products || !Array.isArray(products)) {
      products = [];
    }
    const formatted = products.map(p => ({ ...p, id: p._id ? p._id.toString() : p.id || 'unknown' }));
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
    const np = { ...req.body, featured: req.body.featured || false, special: req.body.special || null, createdAt: new Date().toISOString() };
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

// ============================================================
//  ORDERS API
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
        { $inc: { rewardBalance: rewardAmount, totalRewardsEarned: rewardResult.rewardSets, eligibleItemsPurchased: rewardResult.eligibleItems }, $set: { lastOrderDate: new Date().toISOString() } }
      );
      if (order.customer?.email) {
        await sendEmail(order.customer.email, '🎁 Rewards Earned!',
          `<h2>You earned R${rewardAmount.toFixed(2)} in rewards!</h2>
           <p>From ${rewardResult.rewardSets} sets of 10 items.</p>
           <p>Your total reward balance: R${rewardAmount.toFixed(2)}</p>`
        );
      }
    } else if (order.userId) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(order.userId) },
        { $set: { lastOrderDate: new Date().toISOString() } }
      );
    }

    if (order.proofOfPayment?.includes('base64')) {
      const fp = saveBase64File(order.proofOfPayment, order.id, 'pop');
      if (fp) {
        order.proofOfPaymentPath = fp;
        delete order.proofOfPayment;
      }
    }

    await db.collection('orders').insertOne(order);
    res.status(201).json(order);
  } catch (err) {
    console.error('Order error:', err);
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
    
    if (req.body.status === 'paid' || req.body.status === 'completed') {
      await sendEmail(order.customer?.email, `🚚 Order #${order.id} Update`,
        `<h2>Your order has been ${req.body.status === 'paid' ? 'paid' : 'completed'}!</h2>
         <p><strong>Order ID:</strong> ${order.id}</p>
         ${req.body.status === 'paid' ? '<p>Your payment has been confirmed. We\'re preparing your order.</p>' : '<p>Your order has been delivered. Thank you for shopping with us!</p>'}`
      );
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
//  REWARDS API
// ============================================================

app.get('/api/user/rewards/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const orders = await db.collection('orders')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    const rewardData = calculateTotalRewardValue(user, orders);

    let subscriptionInfo = null;
    if (user.subscriptionTier) {
      subscriptionInfo = { tier: user.subscriptionTier, config: REWARD_CONFIG.subscription[user.subscriptionTier], active: true, startedAt: user.subscriptionStartedAt };
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      rewardBalance: rewardData.totalRewardBalance,
      totalRewardsEarned: rewardData.totalRewardsEarned,
      tier: rewardData.tier,
      isStudent: user.isStudent || false,
      studentVerified: user.studentVerified || false,
      studentDiscountActive: user.isStudent && new Date() < new Date(DISCOUNT_EXPIRY),
      whatsapp: user.whatsapp || null,
      address: user.address || null,
      breakdown: { baseRewards: rewardData.baseRewards, streakBonus: rewardData.streakBonus, subscriptionBonus: rewardData.subscriptionBonus, milestoneBonus: rewardData.milestoneBonus, tierBonus: rewardData.tierBonus },
      progress: { eligibleItems: rewardData.progress.eligibleItems, progressToNext: rewardData.progress.progressToNext, itemsNeededForNext: rewardData.progress.itemsNeededForNext, progressPercent: rewardData.progress.progressPercent },
      streak: { count: rewardData.streakCount, nextBonusAt: rewardData.streakCount >= 12 ? null : Math.ceil((rewardData.streakCount + 1) / 4) * 4 },
      subscription: subscriptionInfo,
      recentOrders: orders.slice(0, 5).map(o => ({ id: o.id, total: o.total, rewardEarned: o.rewardEarned || 0, status: o.status, createdAt: o.createdAt })),
      tierProgress: { current: rewardData.tier, next: getNextTier(rewardData.totalRewardsEarned) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
      { $inc: { rewardBalance: -amount }, $push: { rewardHistory: { type: 'redemption', amount: amount, date: new Date().toISOString() } } }
    );
    res.json({ success: true, redeemed: amount, remaining: (user.rewardBalance || 0) - amount, message: `Successfully redeemed R${amount.toFixed(2)}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/reward-progress', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
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
      progress: { eligibleItems: progress.eligibleItems, itemsNeededForNext: progress.itemsNeededForNext, progressToNext: progress.progressToNext, progressPercent: progress.progressPercent, rewardSetsEarned: progress.rewardSets },
      streak: { count: streak.streakCount, bonusAmount: streak.bonusAmount },
      subscription: { active: !!user.subscriptionTier, tier: user.subscriptionTier || null },
      nextRewardAt: progress.itemsNeededForNext === 0 ? 'Ready!' : `${progress.itemsNeededForNext} more items`
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
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const config = REWARD_CONFIG.subscription[tier];

    if (user.subscriptionTier === tier) {
      return res.status(400).json({ error: 'Already subscribed to this tier' });
    }

    if (user.subscriptionTier === 'basic' && tier === 'premium') {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscriptionTier: tier, subscriptionStartedAt: new Date().toISOString(), subscriptionUpdatedAt: new Date().toISOString() }, $inc: { rewardBalance: config.bonusReward } }
      );
      res.json({ success: true, message: `Upgraded to ${tier} tier!` });
      return;
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { subscriptionTier: tier, subscriptionStartedAt: new Date().toISOString(), subscriptionUpdatedAt: new Date().toISOString() }, $inc: { rewardBalance: config.bonusReward } }
    );

    if (user.email) {
      await sendEmail(user.email, `🎉 Welcome to Quick 2 Shop ${tier} tier!`,
        `<h2>Welcome to ${tier} tier!</h2><p>You've received R${config.bonusReward.toFixed(2)} in rewards!</p><ul>${config.freeDelivery ? '<li>✅ Free delivery on all orders</li>' : ''}${config.discountPercent ? `<li>✅ ${config.discountPercent}% off every order</li>` : ''}${config.freeItemMonthly ? '<li>✅ Free item every month</li>' : ''}</ul>`
      );
    }

    res.json({ success: true, message: `Subscribed to ${tier} tier!`, bonusReward: config.bonusReward, benefits: { freeDelivery: config.freeDelivery, discountPercent: config.discountPercent, freeItemMonthly: config.freeItemMonthly || false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.subscriptionTier) {
      return res.status(400).json({ error: 'Not subscribed' });
    }
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { subscriptionTier: null, subscriptionEndedAt: new Date().toISOString() } }
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
    const sent = await sendEmail(req.body.email, 'Quick 2 Shop - Password Reset OTP',
      `<h2>Your OTP: ${otp}</h2><p>This OTP expires in 10 minutes.</p>`
    );
    res.json({ message: sent ? 'OTP sent' : 'OTP saved', devMode: !sent, otp: !sent ? otp : undefined });
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
    await db.collection('users').updateOne({ email }, { $set: { password: newPassword } });
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
    const slides = await db.collection('slides').find({ active: true }).sort({ order: 1 }).toArray();
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
    const ns = { ...req.body, active: true, order: (max[0]?.order || 0) + 1, createdAt: new Date().toISOString() };
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
//  FORCE SEED ENDPOINT
// ============================================================

app.post('/api/admin/force-seed', async (req, res) => {
  try {
    await seedDefaultData();
    res.json({ success: true, message: 'Database seeded successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  console.log(`\n📊 Delivery Areas & Fees:`);
  console.log(`  • Braamfontein: R15`);
  console.log(`  • Doornfontein: R20`);
  console.log(`  • Parktown: R25`);
  console.log(`  • Auckland Park: R25`);
  console.log(`\n🎓 Student Discount: ${STUDENT_DISCOUNT}% off delivery fee`);
  console.log(`📅 Valid until: ${DISCOUNT_EXPIRY}`);
  console.log(`\n📊 Reward Rules:`);
  console.log(`  • ${REWARD_CONFIG.itemsPerReward} items (R${REWARD_CONFIG.minItemPrice}+) = R${REWARD_CONFIG.rewardAmount} reward`);
  console.log(`  • ${REWARD_CONFIG.streak.enabled ? '✅' : '❌'} Streak rewards enabled`);
  console.log(`  • ${REWARD_CONFIG.subscription.enabled ? '✅' : '❌'} Subscriptions enabled`);
  console.log(`  • Tiers: Bronze → Silver (50) → Gold (150) → Platinum (300)`);
});