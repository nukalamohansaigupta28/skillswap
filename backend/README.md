# Skill-Swap Platform — Backend REST API & Real-Time Engine

The backend for **Skill-Swap Platform**, a capstone web and mobile application where users exchange knowledge and skills through reciprocal swaps or credit-based sessions without monetary payment.

---

## Tech Stack & Architecture

- **Runtime & Framework:** Node.js 20+ with Express 4
- **Database:** MongoDB with Mongoose 8 ODM (indexing, validation, atomic transactions)
- **Real-Time Engine:** Socket.io (bi-directional WebSockets with JWT handshake auth)
- **Security & Hardening:** Helmet (HTTP headers), CORS, `express-mongo-sanitize` (NoSQL injection defense), XSS sanitization, `express-rate-limit` (tiered IP rate limiters)
- **API Documentation:** Swagger / OpenAPI 3.0 via `swagger-jsdoc` & `swagger-ui-express`
- **Testing:** Jest & Supertest integration test suite
- **Scheduler:** `node-cron` for automated session reminders

---

## Directory Structure

```
backend/
├── src/
│   ├── config/              # Database connection, env validation, Swagger specs
│   ├── constants/           # Roles, statuses, categories enums
│   ├── controllers/         # Request handling & HTTP response builders
│   ├── middleware/          # JWT auth, role guard, rate limiter, multer, sanitizers, error handler
│   ├── models/              # Mongoose schemas (User, Skill, UserSkill, MatchRequest, Session, Message, Review, Report, CreditTransaction, Notification)
│   ├── routes/              # Express route declarations
│   ├── seed/                # Catalog (45 skills) & Demo (20 users + Admin + history) seeders
│   ├── services/            # Core business logic (matchingService, walletService, socketService, cronService, notificationService)
│   ├── utils/               # ApiError, asyncHandler
│   ├── app.js               # Express application initialization & middleware stack
│   └── server.js            # HTTP + Socket.io server bootstrap
├── tests/
│   ├── unit/                # Unit tests for matching engine & credit transactions
│   └── integration/         # API integration tests for auth, skills, requests, sessions, chat, reviews, admin
├── uploads/                 # Storage for user avatar photos
├── requests.http            # Ready-to-run REST client test collection
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js:** v18.x or v20+ installed
- **MongoDB:** Local MongoDB instance running on port 27017, OR a cloud MongoDB Atlas connection string. *(Note: in development mode, an in-memory replica will automatically bootstrap as a fallback if no local MongoDB service is detected).*

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` configuration:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/skillswap
JWT_SECRET=super_secret_jwt_key_skillswap_capstone_2026_dev
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database
Seed the 45 standard skills across all 8 categories:
```bash
npm run seed:skills
```

Seed 20 demo users with skills, historical match requests, completed sessions, star reviews, credit balances, and the administrator account:
```bash
npm run seed:demo
```

### 5. Start the Server
Start in development mode with nodemon:
```bash
npm run dev
```

Start in production mode:
```bash
npm start
```

---

## Interactive API Documentation (Swagger)

Once the backend is running, open your browser to inspect and interact with the full Swagger/OpenAPI documentation:
👉 **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

Raw OpenAPI 3.0 JSON specification is available at:
👉 **[http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)**

---

## Demo Test Credentials

| Role | Name | Email | Password | City / Skills |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@skillswap.com` | `AdminPass123!` | San Francisco (Full Governance) |
| **Teacher/Learner** | Alice Johnson | `alice@example.com` | `Password123!` | Boston (Teaches: Guitar, Learns: React) |
| **Teacher/Learner** | Bob Smith | `bob@example.com` | `Password123!` | Boston (Teaches: React, Learns: Guitar) |
| **Teacher/Learner** | Carlos Santana | `carlos@example.com` | `Password123!` | San Francisco (Teaches: Spanish, Learns: Python) |
| **Teacher/Learner** | Priya Patel | `priya@example.com` | `Password123!` | Dallas (Teaches: Indian Cooking, Learns: Python) |
| *16 More Users* | *Various* | *See `src/seed/demo.js`* | `Password123!` | *Across Austin, Chicago, New York, Seattle, etc.* |

---

## Testing & Quality Assurance

Run the comprehensive Jest test suite:
```bash
npm test
```

Run the standalone Socket.io 2-client real-time verification test:
```bash
node socket-test.js
```

Run the REST API automated verification runner:
```bash
node test-runner.js
```

