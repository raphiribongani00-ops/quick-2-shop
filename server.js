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
const ADMIN_EMAIL = 'raphiribongani00@gmail.com';

let transporter = null;
let emailConfigured = false;

// ============================================================
//  ORDER STATUS CONSTANTS
// ============================================================

const ORDER_STATUS = {
  PENDING: 'pending',
  AWAITING_POP: 'awaiting_pop',
  PAYMENT_REVIEW: 'payment_review',
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_FAILED: 'payment_failed',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  INVESTIGATION: 'investigation'
};

// ============================================================
//  PAYMENT VERIFICATION RULES
// ============================================================

const PAYMENT_VERIFICATION_RULES = {
  referenceMatch: {
    check: (pop, order) => pop.reference === order.paymentReference,
    weight: 'critical',
    label: 'Reference Match',
    failMessage: 'Reference number does not match order reference'
  },
  amountMatch: {
    check: (pop, order) => {
      const diff = Math.abs(pop.amount - order.total);
      return diff <= order.total * 0.05;
    },
    weight: 'critical',
    label: 'Amount Match',
    failMessage: 'Payment amount does not match order total'
  },
  dateValid: {
    check: (pop) => {
      const popDate = new Date(pop.date);
      const today = new Date();
      const diffHours = (today - popDate) / (1000 * 60 * 60);
      return diffHours <= 72;
    },
    weight: 'important',
    label: 'Date Valid',
    failMessage: 'Payment date is too old (>72 hours)'
  },
  beneficiaryMatch: {
    check: (pop) => true,
    weight: 'info',
    label: 'Beneficiary Name',
    failMessage: 'Beneficiary name check skipped (not required)'
  },
  bankValid: {
    check: (pop) => {
      const bank = pop.bank?.toLowerCase() || '';
      return bank.includes('standard') || bank.includes('std') || 
             bank.includes('absa') || bank.includes('fnb') || 
             bank.includes('nedbank') || bank.includes('capitec');
    },
    weight: 'less-critical',
    label: 'Bank Name',
    failMessage: 'Bank name check (optional)'
  }
};

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

const STUDENT_DISCOUNT = 20;
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
    await db.collection('communications').createIndex({ orderId: 1, createdAt: -1 });
    await db.collection('payment_verifications').createIndex({ orderId: 1 });
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

    const slideCount = await db.collection('slides').countDocuments();
    if (slideCount === 0) {
      await db.collection('slides').insertMany([
        { image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1920&q=80", caption: "Welcome to Quick 2 Shop!", active: true, order: 1, createdAt: new Date().toISOString() },
        { image: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=80", caption: "Fresh groceries delivered to your door", active: true, order: 2, createdAt: new Date().toISOString() }
      ]);
      console.log('✅ Slides seeded');
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
//  PAYMENT VERIFICATION ENGINE
// ============================================================

function verifyPayment(popData, order) {
  const results = {};
  let criticalPassed = 0;
  let importantPassed = 0;
  let totalCritical = 0;
  let totalImportant = 0;
  let failedRules = [];
  
  for (const [ruleName, rule] of Object.entries(PAYMENT_VERIFICATION_RULES)) {
    const passed = rule.check(popData, order);
    results[ruleName] = {
      passed: passed,
      label: rule.label,
      weight: rule.weight,
      failMessage: rule.failMessage
    };
    
    if (!passed) {
      failedRules.push(rule.label);
    }
    
    if (rule.weight === 'critical') {
      totalCritical++;
      if (passed) criticalPassed++;
    } else if (rule.weight === 'important' || rule.weight === 'less-critical') {
      totalImportant++;
      if (passed) importantPassed++;
    }
  }
  
  const criticalScore = totalCritical > 0 ? (criticalPassed / totalCritical) * 100 : 100;
  const importantScore = totalImportant > 0 ? (importantPassed / totalImportant) * 100 : 100;
  const overallScore = (criticalScore * 0.7) + (importantScore * 0.3);
  
  let decision = '';
  let status = '';
  let adminNeedsReview = false;
  let customerMessage = '';
  let adminMessage = '';
  
  // Scenario 1: Perfect Match
  if (criticalPassed === totalCritical && importantPassed >= totalImportant * 0.5) {
    decision = 'APPROVED';
    status = ORDER_STATUS.PAYMENT_VERIFIED;
    adminNeedsReview = false;
    customerMessage = '✅ Your payment has been verified. Your order is being processed.';
    adminMessage = 'Payment auto-verified. All rules passed.';
  }
  // Scenario 2: Partial Match (Amount slightly off)
  else if (criticalPassed === totalCritical && !results.amountMatch.passed) {
    decision = 'PARTIAL_APPROVAL';
    status = ORDER_STATUS.PAYMENT_REVIEW;
    adminNeedsReview = false;
    customerMessage = `⚠️ Your payment amount (R${popData.amount.toFixed(2)}) doesn't match the order total (R${order.total.toFixed(2)}). Please pay the remaining balance of R${(order.total - popData.amount).toFixed(2)} using the same reference number. The system will automatically check again once you upload the additional payment.`;
    adminMessage = 'Partial payment received. Customer notified to pay balance.';
  }
  // Scenario 3: Major Mismatch
  else if (criticalPassed < totalCritical * 0.5) {
    decision = 'REJECTED';
    status = ORDER_STATUS.PAYMENT_FAILED;
    adminNeedsReview = true;
    customerMessage = `❌ The system cannot automatically review your payment due to mismatches in: ${failedRules.join(', ')}. Your order is currently being evaluated by the payment administrator. Feedback will be given shortly.`;
    adminMessage = `Payment rejected. Mismatches: ${failedRules.join(', ')}. Needs admin review.`;
    
    sendEmail(ADMIN_EMAIL, '🚨 Payment Failed - Admin Review Required',
      `<h2>Payment Failed - Needs Review</h2>
       <p><strong>Order ID:</strong> ${order.id}</p>
       <p><strong>Customer:</strong> ${order.customer?.name}</p>
       <p><strong>Amount:</strong> R${order.total.toFixed(2)}</p>
       <p><strong>Failed Rules:</strong> ${failedRules.join(', ')}</p>
       <p><a href="https://quick-2-shop.onrender.com/admin.html">Review in Admin Panel</a></p>`
    );
  }
  // Scenario 5: Suspicious POP
  else if (criticalPassed < totalCritical * 0.75) {
    decision = 'SUSPICIOUS';
    status = ORDER_STATUS.INVESTIGATION;
    adminNeedsReview = true;
    customerMessage = `🔍 Your payment is under investigation due to ${failedRules.join(', ')}. Please go to the communications panel to provide more information.`;
    adminMessage = `Suspicious POP detected. Mismatches: ${failedRules.join(', ')}. Needs investigation.`;
    
    sendEmail(ADMIN_EMAIL, '🚨 Suspicious POP Detected - Investigation Required',
      `<h2>Suspicious POP - Investigation Required</h2>
       <p><strong>Order ID:</strong> ${order.id}</p>
       <p><strong>Customer:</strong> ${order.customer?.name}</p>
       <p><strong>Amount:</strong> R${order.total.toFixed(2)}</p>
       <p><strong>Issues:</strong> ${failedRules.join(', ')}</p>
       <p><a href="https://quick-2-shop.onrender.com/admin.html">Review in Admin Panel</a></p>`
    );
  }
  // Scenario 6: Payment Method Confusion
  else if (criticalPassed >= totalCritical * 0.5) {
    decision = 'REVIEW_NEEDED';
    status = ORDER_STATUS.PAYMENT_REVIEW;
    adminNeedsReview = true;
    customerMessage = `📋 Your payment is being reviewed. Please go to the communications panel for manual payment review and verification.`;
    adminMessage = `Payment needs manual review. Partial matches detected.`;
  }
  // Scenario 7: Wrong Amount/Account
  else {
    decision = 'REJECTED';
    status = ORDER_STATUS.PAYMENT_FAILED;
    adminNeedsReview = true;
    customerMessage = `❌ Your payment could not be matched to your order. Please go to the communications panel to speak to us for manual verification.`;
    adminMessage = `Payment rejected. Needs manual verification.`;
  }
  
  return {
    decision,
    status,
    adminNeedsReview,
    results,
    overallScore,
    criticalScore,
    importantScore,
    failedRules,
    customerMessage,
    adminMessage,
    summary: {
      criticalPassed,
      criticalTotal: totalCritical,
      importantPassed,
      importantTotal: totalImportant
    },
    recommendation: adminNeedsReview ? 'Admin review required' : 'Auto-verified'
  };
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
      ADMIN_EMAIL,
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
//  ORDERS API WITH PAYMENT VERIFICATION
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
      status: ORDER_STATUS.AWAITING_POP,
      createdAt: new Date().toISOString(),
      rewardEarned: 0,
      rewardDetails: null,
      paymentVerification: null,
      popUploaded: false
    };

    const items = order.items || [];

    if (order.proofOfPayment?.includes('base64')) {
      const fp = saveBase64File(order.proofOfPayment, order.id, 'pop');
      if (fp) {
        order.proofOfPaymentPath = fp;
        order.popUploaded = true;
        delete order.proofOfPayment;
        
        const verificationResult = {
          status: ORDER_STATUS.PAYMENT_REVIEW,
          message: 'Payment uploaded. Awaiting verification.'
        };
        order.paymentVerification = verificationResult;
        order.status = ORDER_STATUS.PAYMENT_REVIEW;
      }
    }

    await db.collection('orders').insertOne(order);
    res.status(201).json(order);
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  PAYMENT VERIFICATION ENDPOINTS
// ============================================================

app.get('/api/admin/payment-reviews', async (req, res) => {
  try {
    const orders = await db.collection('orders')
      .find({ 
        status: { 
          $in: [
            ORDER_STATUS.PAYMENT_REVIEW, 
            ORDER_STATUS.INVESTIGATION, 
            ORDER_STATUS.PAYMENT_FAILED,
            ORDER_STATUS.AWAITING_POP
          ] 
        } 
      })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/verify-payment', async (req, res) => {
  try {
    const { orderId, popAmount, popReference, popDate, popBank, popBeneficiary, decision, adminNotes } = req.body;
    
    const order = await db.collection('orders').findOne({ id: orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const popData = {
      amount: popAmount,
      reference: popReference,
      date: popDate,
      bank: popBank,
      beneficiary: popBeneficiary
    };

    const verification = verifyPayment(popData, order);
    
    const updateData = {
      status: verification.status,
      paymentVerification: {
        ...verification,
        verifiedAt: new Date().toISOString(),
        adminNotes: adminNotes || null,
        reviewedBy: 'admin'
      },
      popData: popData
    };

    await db.collection('orders').updateOne(
      { id: orderId },
      { $set: updateData }
    );

    if (verification.adminNeedsReview) {
      await sendEmail(ADMIN_EMAIL, `📋 Payment Review Needed - ${orderId}`,
        `<h2>Payment Review Needed</h2>
         <p><strong>Order ID:</strong> ${orderId}</p>
         <p><strong>Customer:</strong> ${order.customer?.name}</p>
         <p><strong>Amount:</strong> R${order.total.toFixed(2)}</p>
         <p><strong>Status:</strong> ${verification.status}</p>
         <p><strong>Decision:</strong> ${verification.decision}</p>
         <p><strong>Failed Rules:</strong> ${verification.failedRules.join(', ')}</p>
         <p><a href="https://quick-2-shop.onrender.com/admin.html">Review in Admin Panel</a></p>`
      );
    }

    await sendEmail(order.customer?.email, `📦 Order #${orderId} - Payment Update`,
      `<h2>Payment Update</h2>
       <p>${verification.customerMessage}</p>
       <p><strong>Order ID:</strong> ${orderId}</p>
       <p><a href="https://quick-2-shop.onrender.com">View Order</a></p>`
    );

    res.json({
      success: true,
      order: updateData,
      verification: verification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/override-payment', async (req, res) => {
  try {
    const { orderId, decision, adminNotes } = req.body;
    
    const order = await db.collection('orders').findOne({ id: orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let newStatus = order.status;
    let customerMessage = '';

    if (decision === 'approve') {
      newStatus = ORDER_STATUS.PAID;
      customerMessage = '✅ Your payment has been approved by the administrator. Your order is being processed.';
    } else if (decision === 'reject') {
      newStatus = ORDER_STATUS.CANCELLED;
      customerMessage = '❌ Your payment was rejected by the administrator. Please contact support for more information.';
    } else if (decision === 'investigate') {
      newStatus = ORDER_STATUS.INVESTIGATION;
      customerMessage = '🔍 Your payment is under further investigation. You will be contacted shortly.';
    }

    await db.collection('orders').updateOne(
      { id: orderId },
      { 
        $set: { 
          status: newStatus,
          'paymentVerification.adminOverride': {
            decision: decision,
            notes: adminNotes,
            overriddenAt: new Date().toISOString()
          }
        } 
      }
    );

    await sendEmail(order.customer?.email, `📦 Order #${orderId} - Admin Update`,
      `<h2>Order Update</h2>
       <p>${customerMessage}</p>
       <p><strong>Order ID:</strong> ${orderId}</p>
       <p><a href="https://quick-2-shop.onrender.com">View Order</a></p>`
    );

    res.json({ success: true, message: 'Payment override applied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  COMMUNICATIONS API
// ============================================================

app.post('/api/communications', async (req, res) => {
  try {
    const { orderId, userId, message, sender } = req.body;
    
    const communication = {
      orderId: orderId,
      userId: userId,
      message: message,
      sender: sender,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    await db.collection('communications').insertOne(communication);
    
    if (sender === 'admin') {
      await db.collection('communications').updateOne(
        { _id: communication._id },
        { $set: { read: true } }
      );
    }
    
    res.json({ success: true, communication });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/communications/:orderId', async (req, res) => {
  try {
    const messages = await db.collection('communications')
      .find({ orderId: req.params.orderId })
      .sort({ createdAt: 1 })
      .toArray();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/communications/user/:userId', async (req, res) => {
  try {
    const messages = await db.collection('communications')
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/communications/:id/read', async (req, res) => {
  try {
    await db.collection('communications').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/communications/unread/:userId', async (req, res) => {
  try {
    const count = await db.collection('communications')
      .countDocuments({ 
        userId: req.params.userId, 
        read: false,
        sender: 'admin'
      });
    res.json({ unread: count });
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
  console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
  console.log(`\n📊 Delivery Areas & Fees:`);
  console.log(`  • Braamfontein: R15`);
  console.log(`  • Doornfontein: R20`);
  console.log(`  • Parktown: R25`);
  console.log(`  • Auckland Park: R25`);
  console.log(`\n🎓 Student Discount: ${STUDENT_DISCOUNT}% off delivery fee`);
  console.log(`📅 Valid until: ${DISCOUNT_EXPIRY}`);
});