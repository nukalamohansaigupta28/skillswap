# Skill-Swap Platform — Peer-to-Peer Knowledge Economy

[![Status](https://img.shields.io/badge/Status-Completed-success)]()
[![Tests](https://img.shields.io/badge/Tests-79%2F79%20Passing-brightgreen)]()
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20Flutter%20%7C%20MongoDB-blue)]()
[![License](https://img.shields.io/badge/License-MIT-purple)]()

**Skill-Swap** is an equitable, full-stack Web & Mobile platform where people trade knowledge instead of paying money. Users list skills they can **TEACH** and skills they want to **LEARN**. An algorithmic matching engine pairs complementary peers, while an atomic **Skill-Credit System** (1 hour taught = +1 credit, 1 hour learned = -1 credit) enables learning even when a two-way mutual swap is not available.

---

## 🏗️ System Architecture & Monorepo Structure

```
skillswap/
├── backend/            # Node.js + Express REST API, MongoDB/Mongoose, Socket.io
│   ├── src/
│   │   ├── config/     # Database (with fallback in-memory MongoDB) & environment
│   │   ├── controllers/# Auth, Users, Skills, Matches, Requests, Sessions, Messages, Wallet, Reviews, Admin
│   │   ├── models/     # 10 Mongoose schemas with compound indexes & validation
│   │   ├── services/   # MatchingEngine, WalletTransfer, SocketService, Notifications, Cron
│   │   ├── routes/     # Centralized Express router mounting
│   │   ├── middleware/ # JWT Auth, Role Guard, Rate Limiter, XSS Clean, Uploads, Central Error Handler
│   │   └── seed/       # 45 approved catalog skills + 20 demo users seed script
│   └── tests/          # 9 Jest automated unit & integration test suites (79 passing tests)
│
├── web/                # React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide Icons
│   └── src/
│       ├── components/ # Common Design System (Button, Input, Card, Modal, Avatar, Badge, Skeleton)
│       ├── context/    # AuthContext, SocketContext, ToastContext
│       └── pages/      # Landing, Login, Register, Dashboard, Matches, Requests, Chat, Sessions, Wallet, Profile, Admin
│
├── mobile/             # Cross-platform Flutter application (Material 3 style)
│   └── lib/
│       ├── constants/  # Theme tokens, ApiConstants (Android/iOS auto host resolution)
│       ├── models/     # Strongly-typed models matching backend schemas
│       ├── services/   # ApiClient with JWT Bearer injection, AuthService
│       └── screens/    # Splash, Login, Register, Home, Matches, Requests, Chat, Sessions, Wallet, Profile
│
└── docs/               # Technical documentation
    ├── PLAN.md         # Master Architecture, ER Diagram, Scoring Formula, Credit Rules, API Matrix
    ├── TEST_CASES.md   # Comprehensive QA Test Matrix (79 scenarios)
    ├── REPORT.md       # Final Capstone Report (11 Chapters)
    └── VIVA_QA.md      # Comprehensive Viva Voce Questions & Answers (40 Q&As)
```

---

## ⚡ Quickstart Guide

### Option 1: Docker Compose (All-in-One)
To run the full stack with MongoDB, Backend REST API, and NGINX Web client:
```bash
docker-compose up --build
```
- **Web Application:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:5000/api`
- **Interactive Swagger Docs:** `http://localhost:5000/api/docs`

---

### Option 2: Local Development (Without Docker)

#### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # Populates 45 skills + 20 demo users, sessions, reviews
npm run dev      # Starts on http://localhost:5000
```
> *Note: If a local MongoDB instance is not active, the backend automatically starts a built-in `mongodb-memory-server` in development mode.*

#### 2. Web Frontend Setup
```bash
cd web
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

#### 3. Flutter Mobile Setup
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🔑 Fast Demo Accounts

The database comes pre-seeded with 20 demo users across all categories:

| User Name | Email | Password | Role / Profile | Starting Credits |
|:---|:---|:---|:---|:---:|
| **Alice Johnson** | `alice@example.com` | `Password123!` | Guitar Teacher / Learns Coding (Boston) | 4 |
| **Bob Smith** | `bob@example.com` | `Password123!` | Full-Stack Dev / Learns Guitar (Boston) | 3 |
| **Carlos Santana** | `carlos@example.com` | `Password123!` | Spanish Linguist / Learns Python (SF) | 2 |
| **Diana Prince** | `diana@example.com` | `Password123!` | Public Speaker / Learns French (Chicago) | 2 |
| **System Admin** | `admin@skillswap.com` | `AdminPass123!` | Platform SuperAdmin | 10 |

*(One-click demo login buttons are available on the Login screen).*

---

## 🧠 Matching Engine & Scoring Formula

The matching engine ranks swap suggestions dynamically on a scale of **0 to 100%**:

$$\text{Total Score} = \text{Base Score} + \text{Bonus Points}$$

1. **Base Score:**
   - **Mutual Swap:** User A teaches what B wants AND User B teaches what A wants $\rightarrow$ **100 points**
   - **One-Way Credit Swap:** User B teaches what A wants, but User A does not teach what B wants $\rightarrow$ **50 points**
2. **Bonus Factors (up to 50 additional points):**
   - **Location Proximity:** Same city $\rightarrow$ **+15 points**
   - **Availability Overlap:** Overlapping schedule days $\rightarrow$ **+15 points**
   - **Platform Rating:** High candidate rating ($\ge 4.5$) $\rightarrow$ **+10 points**
   - **Proficiency Tier Fit:** Expert teaching a Beginner $\rightarrow$ **+10 points**

---

## ⚡ Skill-Credit Sovereign Economy

1. **Welcome Bonus:** Every newly registered member receives **2 free credits**.
2. **Hourly Parity:** 1 hour taught = **+1 credit earned**; 1 hour learned = **-1 credit spent**.
3. **Atomic Dual-Signoff:** Credits only transfer when **both** the teacher and the learner verify completion on their dashboard. If only one signs off, credits are not debited.
4. **Cancellation Protection:** Cancelled sessions never debit or transfer credits.
5. **Solvency Guarantee:** Learners cannot propose or confirm sessions if their credit balance is insufficient.

---

## 🧪 Automated Testing

Run the automated test suite across all 9 test files:
```bash
cd backend
npm test
```
Result: **79 passed, 0 failed (100% passing)**.

See [`docs/TEST_CASES.md`](./docs/TEST_CASES.md) for the complete QA test matrix.
See [`docs/REPORT.md`](./docs/REPORT.md) for the 11-chapter capstone report.
See [`docs/VIVA_QA.md`](./docs/VIVA_QA.md) for the comprehensive viva defense preparation guide.

