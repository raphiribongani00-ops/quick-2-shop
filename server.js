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
  POP_UPLOADED: 'pop_uploaded',
  POP_VERIFIED: 'pop_verified',
  PENDING_MANUAL_REVIEW: 'pending_manual_review',
  MANUAL_APPROVED: 'manual_approved',
  MANUAL_REJECTED: 'manual_rejected',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
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
//  BUILDINGS DATABASE
// ============================================================

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
    await db.collection('buildings').createIndex({ area: 1 });
    await db.collection('communications').createIndex({ orderId: 1, createdAt: -1 });
    await db.collection('order_history').createIndex({ orderId: 1, timestamp: -1 });
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
        whatsapp: null,
        address: null,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Admin user seeded');
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
//  ORDER HISTORY
// ============================================================

async function addOrderHistory(orderId, status, note = '') {
  try {
    const history = {
      orderId: orderId,
      status: status,
      note: note,
      timestamp: new Date().toISOString()
    };
    await db.collection('order_history').insertOne(history);
    return history;
  } catch (err) {
    console.error('Error adding order history:', err);
    return null;
  }
}

async function getOrderHistory(orderId) {
  try {
    return await db.collection('order_history')
      .find({ orderId: orderId })
      .sort({ timestamp: 1 })
      .toArray();
  } catch (err) {
    console.error('Error getting order history:', err);
    return [];
  }
}

// ============================================================
//  PAYMENT VERIFICATION ENGINE (Tesseract + Backend)
// ============================================================

function verifyPayment(extractedData, order) {
  const results = {};
  let allPassed = true;
  let failedRules = [];

  // Rule 1: Amount Match (within R5)
  const amountMatch = Math.abs(extractedData.amount - order.total) <= 5;
  results.amountMatch = amountMatch;
  if (!amountMatch) {
    allPassed = false;
    failedRules.push(`Amount (R${extractedData.amount}) doesn't match order total (R${order.total})`);
  }

  // Rule 2: Reference Match (exact match after PAY-)
  const refMatch = extractedData.reference === order.paymentReference;
  results.referenceMatch = refMatch;
  if (!refMatch) {
    allPassed = false;
    failedRules.push(`Reference (${extractedData.reference}) doesn't match (${order.paymentReference})`);
  }

  // Rule 3: Date Check (within 72 hours)
  const dateValid = extractedData.date ? 
    (new Date() - new Date(extractedData.date)) <= 72 * 60 * 60 * 1000 : false;
  results.dateValid = dateValid;
  if (!dateValid) {
    allPassed = false;
    failedRules.push(`Payment date is older than 72 hours or invalid`);
  }

  // Rule 4: Bank Check (must be Standard Bank or similar)
  const bankValid = extractedData.bank ? 
    extractedData.bank.toLowerCase().includes('standard') || 
    extractedData.bank.toLowerCase().includes('std') : false;
  results.bankValid = bankValid;
  if (!bankValid) {
    allPassed = false;
    failedRules.push(`Bank (${extractedData.bank || 'Unknown'}) is not Standard Bank`);
  }

  // Rule 5: Beneficiary Name (skip - not important)
  results.beneficiaryMatch = true;

  const passedCount = Object.values(results).filter(v => v === true).length;
  const totalRules = Object.keys(results).length;

  let status = '';
  let message = '';
  let adminNeedsReview = false;

  if (allPassed) {
    status = ORDER_STATUS.POP_VERIFIED;
    message = '✅ Payment verified successfully! Your order is being processed.';
    adminNeedsReview = false;
  } else if (passedCount >= 3) {
    status = ORDER_STATUS.PENDING_MANUAL_REVIEW;
    message = 'We couldn\'t verify your payment automatically. Please wait for admin confirmation.';
    adminNeedsReview = true;
  } else {
    status = ORDER_STATUS.PENDING_MANUAL_REVIEW;
    message = 'We couldn\'t verify your payment automatically. Please wait for admin confirmation.';
    adminNeedsReview = true;
  }

  return {
    status,
    message,
    adminNeedsReview,
    results,
    passedCount,
    totalRules,
    failedRules,
    allPassed,
    extractedData
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
//  BUILDINGS API
// ============================================================

app.get('/api/buildings', async (req, res) => {
  try {
    const { search, area } = req.query;
    let query = {};
    if (area && area !== 'all') {
      query.area = area;
    }
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { street: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    const buildings = await db.collection('buildings').find(query).toArray();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/buildings', async (req, res) => {
  try {
    const { name, street, area, postalCode, notes } = req.body;
    if (!name || !street || !area) {
      return res.status(400).json({ error: 'Name, street, and area are required' });
    }
    const building = {
      name,
      street,
      area,
      postalCode: postalCode || '',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    const result = await db.collection('buildings').insertOne(building);
    res.status(201).json({ ...building, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.createdAt;
    
    const result = await db.collection('buildings').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ error: 'Building not found' });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('buildings').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.json({ success: true });
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
      popUploaded: false,
      verificationResult: null,
      history: []
    };

    // Add initial history entry
    await addOrderHistory(order.id, ORDER_STATUS.PENDING, 'Order placed');
    await addOrderHistory(order.id, ORDER_STATUS.AWAITING_POP, 'Awaiting proof of payment');

    await db.collection('orders').insertOne(order);
    res.status(201).json(order);
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  POP UPLOAD & VERIFICATION
// ============================================================

app.post('/api/orders/:orderId/upload-pop', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { popBase64, extractedData } = req.body;

    const order = await db.collection('orders').findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Save the POP file
    const filename = saveBase64File(popBase64, orderId, 'pop');
    if (!filename) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    // Update order with POP
    await db.collection('orders').updateOne(
      { id: orderId },
      { 
        $set: { 
          popPath: filename,
          popUploaded: true,
          status: ORDER_STATUS.POP_UPLOADED,
          extractedData: extractedData || null
        }
      }
    );
    await addOrderHistory(orderId, ORDER_STATUS.POP_UPLOADED, 'Proof of payment uploaded');

    // Run verification
    const verification = verifyPayment(extractedData, order);
    
    // Update order with verification result
    await db.collection('orders').updateOne(
      { id: orderId },
      { 
        $set: { 
          status: verification.status,
          verificationResult: verification
        }
      }
    );
    await addOrderHistory(orderId, verification.status, verification.message);

    // If admin review needed, add notification
    if (verification.adminNeedsReview) {
      await db.collection('admin_notifications').insertOne({
        orderId: orderId,
        message: `Payment review needed for order ${orderId}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'payment_review'
      });
      
      // Send email to admin
      await sendEmail(
        ADMIN_EMAIL,
        `📋 Payment Review Needed - ${orderId}`,
        `<h2>Payment Review Needed</h2>
         <p><strong>Order ID:</strong> ${orderId}</p>
         <p><strong>Customer:</strong> ${order.customer?.name || 'Guest'}</p>
         <p><strong>Amount:</strong> R${order.total.toFixed(2)}</p>
         <p><strong>Status:</strong> ${verification.status}</p>
         <p><strong>Failed Rules:</strong> ${verification.failedRules.join(', ')}</p>
         <p><a href="https://quick-2-shop.onrender.com/admin.html">Review in Admin Panel</a></p>`
      );
    }

    res.json({
      success: true,
      verification: verification,
      popPath: filename
    });

  } catch (err) {
    console.error('POP upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  ADMIN NOTIFICATIONS API
// ============================================================

app.get('/api/admin/notifications', async (req, res) => {
  try {
    const notifications = await db.collection('admin_notifications')
      .find({ read: false })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/notifications/:id/read', async (req, res) => {
  try {
    await db.collection('admin_notifications').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/notifications/unread-count', async (req, res) => {
  try {
    const count = await db.collection('admin_notifications')
      .countDocuments({ read: false });
    res.json({ count });
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
});