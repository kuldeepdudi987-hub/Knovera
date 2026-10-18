# Knovera (1 Credit = 1 Minute)
### Peer-to-Peer Micro-Tutoring & Skill-Exchange Marketplace

Knovera is a full-stack, production-ready micro-tutoring marketplace engineered around the core principle: **1 Credit = 1 Minute of live learning**. Students pay only for the exact minutes they learn, backed by an immutable double-entry escrow ledger and an AI Session Integrity Sentinel with a **100% Automated Escrow Refund Guarantee**.

---

## ⚡ Key Highlights & Architecture

### 1. Dual-Coin Time-Credit Economy
- **Silver Coins (Group Tutoring Sessions)**:
  - **New Student Welcome Bonus**: **60 Free Silver Coins** automatically credited upon registration!
  - **Starter Pack**: 30 Silver Coins = ₹45 (₹1.50 / min)
  - **Value Pack**: 90 Silver Coins = ₹125 (₹1.38 / min • 8% savings)
  - **Pro Pack**: 120 Silver Coins = ₹165 (₹1.37 / min • 9% savings)
- **Golden Coins (1-to-1 Private Tutoring Sessions)**:
  - **Starter Pack**: 30 Golden Coins = ₹150 (₹5.00 / min)
  - **Value Pack**: 90 Golden Coins = ₹430 (₹4.77 / min)
  - **Pro Pack**: 120 Golden Coins = ₹570 (₹4.75 / min)
- **Escrow & Mediator Spread Engine**:
  - When a student books or starts a session, required coins are locked in an **Escrow Hold**.
  - During live learning, credits are deducted at a synchronized rate of 1 coin per minute.
  - On completion, learning minutes convert to Teacher INR earnings:
    - **Teacher Net Share**: **75%** (₹3.75/min for Golden, ₹1.10/min for Silver)
    - **Platform Facilitation Fee**: **25%**
  - **Teacher Payout Dashboard**: Real-time tracking of minutes taught, pending escrow, withdrawable INR balance, and instant UPI payout routing (min threshold ₹200).

### 2. Payments: Direct Real UPI (0% Fees • Live Bank Settlement)
- **Dynamic NPCI UPI QR Code & Intent**: Generates instant scannable UPI QR codes and deep links (`upi://pay?pa=9680877599@ybl...`) for GPay, PhonePe, Paytm, and CRED.
- **Direct 12-Digit Bank UTR Verification**: Students enter the authentic 12-digit bank reference number from their payment app to verify and claim coins.
- **Anti-Fraud Duplicate Detection**: Prevents double-claiming of any redeemed UTR numbers.
- **Official Tax Receipts**: Automatically logs every transaction in the double-entry ledger and generates printable HTML tax invoices.

### 3. AI-Monitored Live Classroom & 100% Auto-Refund Guarantee
- **Live Classroom Workspace**:
  - **WebRTC Video/Audio Grid**: P2P camera/mic toggles and screen sharing with latency monitoring.
  - **Collaborative Whiteboard Canvas**: Pencil, line, rectangle, circle, eraser, color palette, thickness control, undo, clear, export as PNG, synchronized via WebSockets (Socket.IO).
  - **Live Synchronized Credit Countdown Timer**: Color-coded states (Green >5m, Amber <5m, Red Pulse <2m) synchronized between teacher and student.
  - **Real-Time Classroom Chat**: Message broadcasting, timestamps, and system escrow announcements.
- **AI Session Integrity Sentinel**:
  - Pre-session target topic and learning goal tracking.
  - Live topic coverage progress bar (0–100%).
  - Real-time audit checkpoints (Topic Alignment, Teacher Presence, Code Drill, Comprehension Check).
  - **100% Escrow Auto-Refund**: If the mentor disconnects early or the AI sentinel flags an incomplete session, 100% of the locked credits are automatically refunded to the student's wallet with an immutable audit log entry.

### 4. Authentication & Dual-Role Onboarding
- **Google OAuth 2.0 / Google Identity Services**: "Sign in with Google ID" with real Gmail account linking and avatar synchronization.
- **Dedicated Login Gateway**: Automatic redirect to `#login` upon sign-out or when accessing protected portals while unauthenticated.
- **Dev-Mode 1-Click Quick Login Bypass**:
  - Instant login as **Demo Student (Aarav Sharma - 60 Free Silver Coins)**.
  - Instant login as **Demo Teacher (Dr. Priya Nair - ₹4,200 Withdrawable Balance)**.
- **Seamless Role Switching**: Toggle between `[🎓 Student Mode]` and `[👨‍🏫 Teacher Mode]` anytime from the navbar.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.IO (WebSockets), JSON Web Tokens (JWT), QRCode.
- **Database**: Dual-engine architecture:
  - **Production**: PostgreSQL via `pg` (Render `DATABASE_URL`).
  - **Local/Preview**: Persistent local ACID file store (`server/data/knovera_local.json`) with zero external DB dependencies required.
- **Deployment**: Render Infrastructure-as-Code (`render.yaml`), dynamic `PORT` binding.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ or v20+

### 1. Installation
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Build and Start
```bash
# Build the React frontend
npm run build

# Start the full-stack server (serves API and client on port 5000)
npm start
```

Open your browser at **`http://localhost:5000`**.

---

## ☁️ Deploying to Render in 1 Click
This repository includes a `render.yaml` blueprint:
1. Push your repository to GitHub or GitLab.
2. In the Render Dashboard, click **New +** -> **Blueprint**.
3. Select your Knovera repository.
4. Render will automatically provision:
   - `knovera-db` (PostgreSQL Database)
   - `knovera-web` (Web Service running `npm install && npm run build` and `node server/index.js`)
   - Auto-bindings for `DATABASE_URL` and `PORT`.

---

## 🛡️ Security & Secret Safety Pass

> [!WARNING]
> ### ⚠️ Critical Security Notice: Rotate Previously Hardcoded Secrets
> If any secrets, database passwords, or test tokens were previously committed to version control, **those values remain accessible in your git history**.
> - **Action Required:** Immediately revoke and rotate any previously exposed JWT signing keys, database passwords, Google OAuth client secrets, or external API keys before deploying to production.
> - Ensure `.env` is never committed (protected in `.gitignore`).
> - In production (`NODE_ENV=production`), Knovera strictly enforces that `JWT_SECRET` must be set via system environment variables and will abort startup if missing.

---

## 🔑 Environment Variables Template (`.env.example`)
Configure these variables in your deployment dashboard (e.g. Render Web Service Environment):

```ini
# Server Configuration
PORT=5000
NODE_ENV=production

# Authentication: Secure JWT signing key (Min 32 characters, required in production)
JWT_SECRET=your_super_secure_jwt_signing_secret_min_32_chars_random_string

# Database: PostgreSQL on Render (Leave blank to use automatic local persistent JSON storage engine)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Google OAuth 2.0 Credentials ("Sign in with Google / Gmail")
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payments: Official Merchant UPI Virtual Payment Address (0% Platform Fee, Direct Bank-to-Bank)
MERCHANT_UPI_ID=9680877599@ybl
```
