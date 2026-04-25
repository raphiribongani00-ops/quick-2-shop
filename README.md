# 🛒 Habibi Shopping — Campus E-Commerce

A full e-commerce website for university students. Sell food, shoes, clothing and more, with delivery to res.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```
Or with auto-reload on changes:
```bash
npm run dev
```

### 3. Open the site
Visit **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```
habibi-shopping/
├── index.html          ← Main frontend (single-page app)
├── server.js           ← Express backend (REST API)
├── db.json             ← Local JSON database (your data lives here)
├── package.json
├── css/
│   └── main.css        ← All styles
└── js/
    └── app.js          ← All frontend logic (cart, auth, routing, API)
```

---

## 🔑 Features

- **Product catalogue** — filterable by category, searchable, sortable
- **Shopping cart** — persists in browser (localStorage)
- **Wishlist** — save products for later
- **Checkout** — delivery to campus buildings/res rooms
- **Order tracking** — view all placed orders
- **User accounts** — register/login
- **Admin login** — `admin@habibi.co.za` / `admin123`

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List all products |
| GET | /api/products?category=food | Filter by category |
| GET | /api/products?search=shoes | Search products |
| GET | /api/products/:id | Get single product |
| POST | /api/products | Add new product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/categories | List categories |
| GET | /api/orders | List all orders |
| POST | /api/orders | Place new order |
| POST | /api/login | Login |
| POST | /api/register | Register new user |

---

## ➕ Adding New Products

You can add products two ways:

**Option A — Edit db.json directly** (easiest):
Open `db.json`, find the `"products"` array, and add a new entry:
```json
{
  "id": 999,
  "name": "Your Product Name",
  "description": "Short description here",
  "price": 99,
  "category": "food",
  "image": "https://your-image-url.com/photo.jpg",
  "stock": 10,
  "rating": 4.5,
  "reviews": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Option B — Use the API:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Bunny Chow","description":"Half loaf with curry","price":35,"category":"food","image":"https://...","stock":15,"rating":4.8,"reviews":0}'
```

---

## 🗂 Categories Available

| ID | Label |
|----|-------|
| food | Food & Snacks |
| drinks | Drinks |
| shoes | Shoes |
| clothing | Clothing |
| stationery | Stationery |
| electronics | Electronics |
| beauty | Beauty |
| other | Other |

---

## 🛠 Customisation Tips

- **Change store name** → Search for "Habibi" in `index.html` and `css/main.css`
- **Change brand colour** → Edit `--brand: #D4460A` in `css/main.css` (`:root` block)
- **Add WhatsApp link** → Find `wa.me/27000000000` in `index.html` and replace with your number
- **Change delivery price** → Find `const delivery = 25` in `js/app.js`
- **Add more categories** → Edit the `categories` array in `db.json`

---

## 📱 WhatsApp Order Notifications (optional upgrade)

To auto-send WhatsApp messages when orders come in, sign up for **Twilio** or **WhatApp Business API** and call it from the `POST /api/orders` handler in `server.js`.

---

Made with ❤️ for campus hustlers.
