const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- DB helpers ---
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- PRODUCTS ---
app.get('/api/products', (req, res) => {
  const db = readDB();
  let products = db.products;
  if (req.query.category && req.query.category !== 'all') {
    products = products.filter(p => p.category === req.query.category);
  }
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const db = readDB();
  const newProduct = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.products[idx] = { ...db.products[idx], ...req.body };
  writeDB(db);
  res.json(db.products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  const db = readDB();
  db.products = db.products.filter(p => p.id !== parseInt(req.params.id));
  writeDB(db);
  res.json({ success: true });
});

// --- ORDERS ---
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const newOrder = {
    id: 'ORD-' + Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.orders.push(newOrder);
  writeDB(db);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const db = readDB();
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.orders[idx] = { ...db.orders[idx], ...req.body };
  writeDB(db);
  res.json(db.orders[idx]);
});

// --- USERS ---
app.post('/api/register', (req, res) => {
  const db = readDB();
  const { name, email, password } = req.body;
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const newUser = { id: Date.now(), name, email, password, createdAt: new Date().toISOString() };
  db.users.push(newUser);
  writeDB(db);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.post('/api/login', (req, res) => {
  const db = readDB();
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// --- CATEGORIES ---
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.listen(PORT, () => {
  console.log(`\n🛒  Habibi Shopping server running at http://localhost:${PORT}\n`);
});
