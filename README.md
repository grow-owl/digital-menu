# 🌿 Chai Addaa

<div align="center">

[![Dining Experience](https://img.shields.io/badge/Dining-Zero--Friction%20QR-166534?style=for-the-badge&logoColor=fff)](#-shift-stories-how-aura-handles-real-service)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20•%20Vite%205%20•%20Vercel-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](#-cloud-deployment-guide)
[![Backend](https://img.shields.io/badge/Backend-Node%20(ESM)%20•%20Express%205%20•%20Render-059669?style=for-the-badge&logo=render&logoColor=white)](#-cloud-deployment-guide)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#-tech-stack--decisions)
[![Code Intelligence](https://img.shields.io/badge/CodeGraph-Active%20(1.1k%20Nodes)-8B5CF6?style=for-the-badge&logoColor=white)](#-code-intelligence-with-codegraph)
[![Build Status](https://img.shields.io/badge/Build-Passing%20(0%20Errors)-emerald?style=for-the-badge&logo=vite&logoColor=white)](#-running-locally)

<br />

> **“Most restaurant tech feels like it was designed in 1998 and bolted onto a tablet.”**
>
> Clunky $4,000 legacy terminals that crash when three servers hit 'Print'. Lost paper chits soaking in sauce at the pass. Awkward diner wave-downs across a crowded room. And hideous 100MB mobile apps that force customers to register an account just to order an appetizer.
>
> **AURA was built to throw that entire mess away.**

<p align="center">
  <b>Conceived, Architected & Handcrafted with heart by <a href="https://github.com/Amarsah15">Amarnath Kumar</a></b><br />
  <a href="mailto:gsah150803@gmail.com"><code>gsah150803@gmail.com</code></a> &nbsp;•&nbsp;
  <a href="https://instagram.com/_amar_sah_"><code>@_amar_sah_</code></a> &nbsp;•&nbsp;
  <a href="https://github.com/Amarsah15"><code>@Amarsah15</code></a> &nbsp;•&nbsp;
  <a href="https://github.com/grow-owl/digital-menu">GitHub Repository</a>
</p>

</div>

---

## 📖 The Backstory: Why I Built This

I’ve spent hours observing busy dinner services—watching what happens when an 8:30 PM rush hits the dining floor at full speed.

Here is what *actually* happens in real dining rooms:
1. **The Kitchen Runs Out of Scallops Mid-Service:** The line cook yells across the kitchen pass that scallops are *86’d*. The floor staff doesn't hear it over the dining room chatter. A server rings in two more orders five minutes later. The manager now has to go to the table, apologize, void the tickets, and re-balance the entire check.
2. **The App Trap:** Guests sit down, scan a QR code, and get hit with: *"Download our app from the App Store and create a password."* Nobody does it. They put their phone away, wait 10 minutes to catch a server's eye, and the whole service slows down.
3. **The Refund Disaster:** A guest sends back one glass of wine because it wasn't chilled. Most POS systems force staff to void the whole £280 bill, re-punch 12 dishes from scratch, and leave the end-of-night accounting ledger off by £15.
4. **Basement Signal Dead Zones:** Guests sit in a subterranean cellar or secluded courtyard with zero cellular reception, staring at a blank loading screen because they don't know the guest Wi-Fi password.

**AURA was engineered to be the quiet, dependable pulse that solves every single one of these problems without getting in the way of hospitality.**

Hospitality isn't about staring at screens; it's about warmth, timing, and great food. The software should simply be invisible, ultra-fast, and indestructible under load.

---

## 🧭 System Topology

Here is how data, state, and audio move through the venue:

```
                            ┌──────────────────────────────────────────────┐
                            │           🌿 AURA GASTRONOMY OS              │
                            │        Real-Time Multi-Station Pulse         │
                            └──────────────────────┬───────────────────────┘
                                                   │
          ┌────────────────────────────────────────┼────────────────────────────────────────┐
          │                                        │                                        │
          ▼                                        ▼                                        ▼
┌──────────────────────┐                ┌──────────────────────┐                ┌──────────────────────┐
│  📱 GUEST TABLE PORTAL│                │  🍳 KITCHEN PASS KDS │                │  🤵 FLOOR COMMAND    │
├──────────────────────┤                ├──────────────────────┤                ├──────────────────────┤
│ • Clean /menu URL    │                │ • High-Contrast Grid │                │ • 30-Table Visual Grid│
│ • No Password or App │                │ • Instant Dish 86    │                │ • Web Audio Melodic  │
│ • Floating Service   │                │ • Auto Bill Re-calc  │                │   Service Chimes     │
│ • Live Prep Tracker  │                │ • Priority Timers    │                │ • One-Tap Table Reset│
└──────────┬───────────┘                └──────────┬───────────┘                └──────────┬───────────┘
           │                                       │                                       │
           └───────────────────────────────────────┼───────────────────────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              👑 UNIFIED ADMIN & EXECUTIVE COMMAND CENTER                             │
├──────────────────────────────┬───────────────────────────────┬───────────────────────────────────────┤
│ PILLAR 1: FINANCE            │ PILLAR 2: LIVE RESTAURANT/MENU│ PILLAR 3: FLOOR & STAFF OPS           │
│ • Net Revenue & 5% GST       │ • Live Kitchen Stage Pipeline │ • 30 Tables / 128 Seats Capacity      │
│ • Payment Split (UPI/Card)   │ • Real-Time Order Stream Ticker│ • Status Grid (Free/Occupied/Billing) │
│ • 24h Hourly Revenue Heatmap │ • Top Performing Dishes       │ • 4 Seating Zones Breakdown           │
│ • End-of-Day Audit Export    │ • 86'd Out-of-Stock Restock   │ • Direct Table Billing & KDS Shortcuts│
└──────────────────────────────┴───────────────┬───────────────┴───────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────┴───────────────────────────────────────────────────────┐
│                                 🛡️ DECOUPLED MODERN MERN INFRASTRUCTURE                             │
├──────────────────────────────────────────────┬───────────────────────────────────────────────────────┤
│ 🚀 FRONTEND (Vercel Ready)                   │ 🌐 BACKEND (Render Ready - ES Modules)                │
│ • React 19 + TypeScript + Vite 5             │ • Native Node.js ESM (`type: module`)                 │
│ • Client-Side SPA Routing via `vercel.json`  │ • Fully Hardened Express 5 + NoSQL Sanitizer          │
│ • Responsive UI (Mobile 330px to 4K)         │ • 1-Click Cloud Deployment via `render.yaml`          │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## ⚡ Shift Stories: How AURA Handles Real Service

### 🍝 Scenario 1: The Kitchen Runs Out of Scallops at 8:42 PM
* **The Problem:** The line cook uses the last portion of Pan-Seared Scallops. Three tables are currently looking at the menu.
* **The AURA Fix:** The chef taps **86 Dish** on the KDS terminal.
  - The Scallops instantly disappear from all live customer menus.
  - Any pending order containing the scallops can be partially cancelled right from the pass with a selected reason (*"Ingredient Depleted"*).
  - The order’s subtotal, service charges, and taxes re-calculate automatically on the fly.
  - The guest's phone tracker shows a courteous status badge: *"Dish Cancelled by Kitchen (Out of Stock)"* and updates their bill in real time. No confusion, no awkward surprise at checkout.

### 🍷 Scenario 2: A Spilled Drink & Partial Refund
* **The Problem:** A guest accidentally knocks over a glass of vintage Pinot Noir (£18) and the floor manager wants to comp it without disrupting the rest of their £320 anniversary dinner check.
* **The AURA Fix:** The manager opens the table's check, taps **Refund Line Item**, selects the Pinot Noir, and logs the reason (*"Spilled / Manager Courtesy"*).
  - The system adjusts the balance: `netAmount = originalTotal - refundAmount`.
  - The thermal receipt prints an itemized credit deduction line.
  - The daily executive revenue dashboard deducts the £18 from net sales so the night's cash-out ledger balances to the penny.

### 📶 Scenario 3: Cell Signal Drop in the Wine Cellar
* **The Problem:** Table 12 is seated in the corner alcove where mobile reception drops to one bar.
* **The AURA Fix:** The acrylic stand on Table 12 features a **Dual-QR Stand**:
  - **Left QR:** Direct scan to connect to the venue's private 5GHz Guest Wi-Fi (built using the standard WPA Wi-Fi protocol—one tap and they are online).
  - **Right QR:** Clean scan directly into Table 12's personalized digital dining menu.

### 🛡️ Scenario 4: The Mischievous Guest
* **The Problem:** A tech-savvy patron opens Chrome DevTools and changes the price of Wagyu A5 Striploin from £95 to £0.95 in the checkout JSON payload before submitting.
* **The AURA Fix:** The backend operates on **Zero Client Trust**. The server strips all prices sent from the browser, queries the official database prices for each menu item ID, computes taxes and service charge on the server, and stores the authentic total. The tampering attempt fails silently and harmlessly.

---

## ✨ Features Crafted for Each Station

### 1. 📱 For the Dining Guest (Diner Portal)
* **Zero Registration Wall:** Guests simply enter a 10-digit mobile number during ordering to link their loyalty points and order history. No passwords, no confirmation emails, no barrier to eating.
* **Automatic +100 Loyalty Bonus:** New dining numbers are automatically gifted 100 points on their first order.
* **Clean URLs:** Tables are securely authenticated without exposing ugly, brittle session tokens in the browser's address bar.
* **Floating Floor Chimes:** One tap on **"Water Refill"** or **"Call Server"** sends an ambient notification directly to the waiter station.

### 2. 🍳 For the Kitchen (KDS Pass)
* **High-Visibility Cooking Grid:** High-contrast dark interface engineered for hot, steamy kitchen environments with clear visual hierarchy.
* **Prep Milestones:** Distinct status steps: `Received` ➔ `Preparing` ➔ `Ready` ➔ `Served`.
* **Line-Item Dish 86:** Cancel specific unavailable items on an active ticket without voiding the table's whole dinner.
* **Live Ticket Timers:** Color-coded elapsed time badges show line cooks which orders need immediate plating.

### 3. 🤵 For Floor Staff (Waiter Terminal)
* **30-Table Visual Floor Grid:** Color-coded status at a glance:
  - 🟢 **Vacant** (Ready for seating)
  - 🔵 **Occupied** (Actively dining)
  - 🟡 **Billing** (Check requested / settling)
  - 🟣 **Needs Bussing** (Table ready for turnover)
* **Synthesized Web Audio Chimes:** Built-in musical chime engine using the browser's native **Web Audio API** (harmonic dual-tone chords at 587Hz & 880Hz with natural decay). No external sound files, no network delays, zero audio clipping.
* **1-Tap Table Reset:** Clean and re-open tables instantly with one tap to keep floor turnover high.

### 4. 👑 Unified Admin & Executive Control Center
The CEO Executive Cockpit and Operational Admin Panel are consolidated into a single powerhouse dashboard at `/admin`, structured around **Three Core Pillars**:
* **Pillar 1: Finance**: Real-time Gross Settled Sales, Average Order Value (AOV), Payment Method Breakdown (UPI, Card, Cash %), 5% GST & Net Intake, 24-hour service revenue heatmap, and 1-click audit CSV export.
* **Pillar 2: Menu Details & Live Working in Restaurant**: 4-stage kitchen pipeline monitor (*In Queue*, *On Flames*, *At Pass*, *Served*), live active dining tickets ticker showing items ordered and elapsed timers, top dishes leaderboard, and live 86'd Out-of-Stock monitor with 1-tap restock toggle.
* **Pillar 3: Floor, Table & Staff Operations**: 30 tables / 128 pax capacity breakdown, status distribution (Free, Occupied, Billing, Cleaning), 4 floor zones (Main Hall, VIP Lounge, Garden, Family Boothing), turnover speed metrics, and direct shortcuts to Table Billing, Waiter Floor Map, and Kitchen KDS.

### 5. 💳 Table Billing & Precision Invoicing (Admin Portal)
* **Precision Refunds:** Supports **Full Refunds**, **Partial Value Offsets**, and **Item-Level Line Returns** with full audit logs (who issued it, at what time, and why).
* **True Net Revenue Tracking:** Calculates `netAmount = total - refundAmount`, guaranteeing that daily closing summaries, tax reports, and owner analytics match real banked revenue.
* **Dual Printing Engine:**
  - **80mm Thermal Receipt:** Clean slip with item breakdowns, discount lines, refund deductions, and staff name.
  - **Formal A4 GST Invoice:** Full business tax breakdown with GSTIN, CGST, SGST, customer information, and tax summary tables.

### 6. 🖨️ Luxury Dual-QR Table Stand Generator
* **Print-Ready Acrylic Stands:** Generates bespoke, high-resolution table cards designed for standard acrylic table tents (A4, A5, and A6).
* **Dual QR Integration:** Combines both the **Table Order QR** and the **WPA Guest Wi-Fi Auto-Connect QR** side-by-side on the same luxury card.
* **Live Domain Config:** Change your dining URL directly inside the Settings UI without touching a line of code.
* **300 DPI Export:** Export crisp PNGs ready for commercial printing, or print directly using the built-in `@media print` CSS layout.

---

## 🛠️ Tech Stack & Decisions

| Layer | Technologies | Why It Was Chosen |
|:---|:---|:---|
| **Frontend** | React 19, TypeScript (Strict), Vite 5 | Instant HMR during development, strict type safety across order payloads, and tiny production bundle sizes. Ready for Vercel. |
| **State & UI** | Zustand, Framer Motion, TailwindCSS | Predictable, lightweight state store without Redux boilerplate; hardware-accelerated animations down to 330px viewports. |
| **Audio** | Native Web Audio API | Zero network requests for audio assets; synthesized sine-wave harmonies that play reliably even on offline kiosks. |
| **Backend** | Node.js (Native ES Modules), Express 5 | Modern `import`/`export` architecture with native high-concurrency polling and minimal memory overhead. Ready for Render. |
| **Database** | MongoDB Atlas, Mongoose | Cloud document cluster with compound indexes for dynamic dishes, multi-state orders, and embedded refund audit records. |
| **Code Intelligence** | CodeGraph | Complete symbol knowledge graph and call path mapping across 1.1k nodes and 2.2k relationships. |

---

## 🛡️ Zero-Client-Trust Security & Architecture

We treat every client connection—whether from a diner's smartphone or an unknown tablet—as untrusted:

1. **Authoritative Server Pricing:** The frontend never decides what an order costs. When an order payload arrives, the server ignores any provided prices, looks up the current item cost in MongoDB, and recalculates the line items, taxes, service charges, and grand totals from scratch.
2. **Recursive NoSQL Scrubbing:** Custom middleware inspects all request bodies, query strings, and route parameters, stripping out dangerous MongoDB query operators (`$gt`, `$regex`, `$where`, etc.) to block injection attacks. Compatible with Express 5 request getters.
3. **Manager Terminal Guard:** Fast station switching is protected behind an administrative PIN (`AURA2026`). On unverified devices, staff must authenticate with full email/password credentials.
4. **Optimized Compound Indexes:** The database uses compound indexes on `(tableId, paymentStatus)`, `(status, paymentStatus)`, and `createdAt` so high-volume queries return in under 3 milliseconds even with tens of thousands of historic tickets.

---

## 🚀 Live Station Reference & Default Credentials

| Station | Route | Default Access | Key Capabilities |
|:---|:---|:---|:---|
| 📱 **Guest Dining Menu** | `/menu` | *Open to all guests* | Dynamic menu, dietary filters, chef notes, cart & checkout |
| ⏱️ **Live Order Tracker** | `/order/:orderId` | *Automatic on checkout* | Real-time prep stage tracker & live bill adjustment notices |
| 🍳 **Kitchen Pass (KDS)** | `/kitchen` | `chef@aura.com` / `chef123` | High-contrast tickets, dish 86 controls, ticket timer badges |
| 🤵 **Floor Command** | `/waiter` | `waiter@aura.com` / `waiter123` | 30-table layout, audio chimes, service calls, table turnover |
| 👑 **Admin Portal** | `/admin` | `admin@aura.com` / `admin123` | 4-in-1 Workspace: Table Billing, Billing History, Menu Items & Today's Availability |
| 🖨️ **QR Stand Studio** | `/admin/qr-generator` | `admin@aura.com` / `admin123` | High-res dual QR acrylic table stand generation |
| ⚙️ **Platform Settings** | `/admin/settings` | `admin@aura.com` / `admin123` | Venue branding, dining host URL, guest Wi-Fi credentials |
| 🔐 **Fast Staff Gate** | `/login` | Passcode: `AURA2026` | Quick 1-click station switcher for dedicated floor tablets |

---

## ☁️ Cloud Deployment Guide

AURA is decoupled for zero-friction cloud deployment:

### 1. Deploy Frontend on Vercel
1. Import this repository into **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Framework Preset will automatically detect **Vite**.
4. In **Environment Variables**, add:
   ```env
   VITE_API_URL=https://<your-render-backend-name>.onrender.com/api
   ```
5. Click **Deploy**. Vercel will build `dist/` and manage client-side SPA routing via [`frontend/vercel.json`](file:///d:/Projects/Freelance/Restaurant/Restaurant/frontend/vercel.json).

### 2. Deploy Backend on Render
1. In the **Render Dashboard**, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
4. In **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mdn2dez.mongodb.net/aura_restaurant?retryWrites=true&w=majority
   JWT_SECRET=your_production_secret_key_here
   ```
5. Click **Create Web Service**.

---

## 💻 Quick Start: Running Locally

### 1. Clone & Enter the Project
```bash
git clone https://github.com/Amarsah15/Digital_Menu_Card.git
cd Digital_Menu_Card
```

### 2. Configure & Start Backend
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mdn2dez.mongodb.net/aura_restaurant?retryWrites=true&w=majority
JWT_SECRET=aura_super_secure_jwt_secret_2026
NODE_ENV=development
```

Start the API server (ES Module native):
```bash
npm start
# ➜ Server running on port 5000 (accessible on LAN)
# ➜ MongoDB Connected successfully
```

### 3. Start Frontend Dev Server
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
# ➜ Local: http://localhost:5173/
```

### 4. Build for Production
To verify strict TypeScript compilation and production bundling:
```bash
cd frontend
npm run build
# ➜ tsc -b && vite build
# ➜ Built cleanly in ~5s with 0 errors
```

### 5. Root Workspace Helper Scripts
From the repository root, you can also run:
```bash
npm run backend   # Starts backend dev server
npm run frontend  # Starts frontend dev server
npm run build     # Builds production frontend bundle
```

---

## 🧠 Code Intelligence with CodeGraph

This project is indexed by **CodeGraph** (`.codegraph/`), offering instant structural code intelligence:

* **126 Files** indexed across TSX, TypeScript, and JavaScript.
* **1,121 Nodes** (Functions, Components, Routes, Interfaces, Constants).
* **2,273 Edges** (Dynamic dispatch hops, call graphs, import dependencies).

To explore the codebase via CLI:
```bash
codegraph explore "how order cancellation recalculates bill"
codegraph callers awardLoyaltyPointsForOrder
codegraph status
```

---

## 🎨 The Aesthetic Philosophy: RASA

The culinary soul of AURA is built around **RASA** (रस) — the ancient Sanskrit aesthetic philosophy of discovering the pure, unadulterated essence of an experience.

We translated that directly into the user interface:
* **Deep Obsidian & Slate:** Low-light dining room friendly; doesn't blind guests enjoying an intimate candlelit dinner.
* **Warm Champagne & Emerald Accents:** Elegant visual cues that direct attention to what matters: dishes, preparation states, and hospitality alerts.
* **Micro-Haptics & Tactile Feedback:** Buttons and drawers slide with physical weight and calibrated spring physics, making tablets feel like premium hospitality hardware.

---

## 👨‍💻 Handcrafted By

<div align="center">

### **Amarnath Kumar**
*Full-Stack Software Engineer & Architecture Enthusiast*

[![GitHub](https://img.shields.io/badge/GitHub-Amarsah15-181717?style=flat-square&logo=github)](https://github.com/Amarsah15)
[![Instagram](https://img.shields.io/badge/Instagram-@_amar_sah_-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/_amar_sah_)
[![Email](https://img.shields.io/badge/Email-gsah150803@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:gsah150803@gmail.com)
[![Project](https://img.shields.io/badge/Repo-digital--menu-blue?style=flat-square&logo=git)](https://github.com/grow-owl/digital-menu)

<br />

<sub>*"Technology in a restaurant should be like a world-class maître d' — always present when you need it, completely invisible when you don't."*</sub>

</div>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). You are free to adapt, extend, and deploy it for independent restaurants, boutique cafes, or luxury hospitality venues.
