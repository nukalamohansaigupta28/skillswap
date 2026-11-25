# Skill-Swap Platform — Capstone Defense & Presentation Script

This document provides a slide-by-slide presentation outline, speaker notes, and demonstration choreography for the final capstone project defense before external evaluators and examination panels.

---

## Slide 1: Title & Introduction
- **Project Title:** Skill-Swap Platform: Equitable Peer-to-Peer Knowledge Exchange System
- **Domain:** Distributed Web & Mobile Systems / Peer-to-Peer Economics
- **Presenters:** Final Year Capstone Engineering Team
- **Department:** Computer Science & Engineering (Academic Year 2025–2026)

> **Speaker Notes:**  
> *"Good morning, respected members of the evaluation committee. Today, we are proud to present our capstone project: Skill-Swap Platform. Skill-Swap is an equitable full-stack distributed system where people exchange skills instead of paying money, powered by an algorithmic matching engine and an atomic skill-credit economy."*

---

## Slide 2: The Problem Statement
- **Financial Barrier:** Professional tutoring and MOOC courses cost $30 to $100 per hour or require recurring subscriptions, excluding students and professionals with valuable skills but limited liquidity.
- **The Classical Economic Bottleneck:** Traditional barter platforms suffer from the *double coincidence of wants* (User A teaches what B wants, but B does not teach what A wants).
- **Lack of Trust & Accountability:** Free classified boards lack structured scheduling, verified reviews, and resolution mechanisms.

> **Speaker Notes:**  
> *"Modern education has become heavily commercialized. At the same time, millions of people excel at coding, languages, music, or cooking, but cannot afford tutoring in return. Traditional barter fails because finding someone who has what you want AND wants what you have is mathematically rare. We set out to solve this fundamental economic limitation."*

---

## Slide 3: The Proposed Solution
- **Multi-Factor Algorithmic Matching:** Evaluates complementary portfolios, city proximity, availability schedule overlap, proficiency tiers, and ratings.
- **Sovereign Skill-Credit Currency:** 1 hour taught = +1 credit earned; 1 hour learned = -1 credit spent. Solves the double coincidence dilemma by allowing one-way credit learning.
- **Welcome Bonus:** 2 starting credits for all newly registered members to overcome the cold-start problem.
- **Atomic Dual-Signoff Protocol:** Credits only move when both teacher and learner verify completion.

> **Speaker Notes:**  
> *"Our solution is twofold: First, a smart recommendation engine that finds mutual swaps with top priority. Second, an internal skill-credit economy that enables one-way learning even without an exact two-way match. Every new member gets 2 free credits, and credits only transfer when both parties confirm the session was delivered."*

---

## Slide 4: System Architecture & Monorepo Topology
```
Monorepo Layout:
├── /backend   (Node.js, Express, MongoDB, Socket.io, Jest)
├── /web       (React 18, Vite, Tailwind CSS, Recharts)
├── /mobile    (Flutter Material 3, dynamic host resolution)
└── /docs      (Master Plan, QA Matrix, Capstone Report, Viva Q&A)
```
- **Gateway & Web Server:** NGINX reverse-proxying `/api/` and WebSocket `/socket.io/` connections.
- **Database Layer:** MongoDB with 10 Mongoose schemas, compound unique indexes, and automated fallback to in-memory MongoDB in dev/test mode.

> **Speaker Notes:**  
> *"We organized the codebase into a clean monorepo. The Node.js backend exposes a hardened REST API and Socket.io server. The web app is built with React 18 and Vite for near-instant hot reloading and fast production bundling. The cross-platform mobile app is written in Flutter adhering to Material 3 design."*

---

## Slide 5: Database Modeling & Entity Relationships
- **10 Core Collections:** `users`, `skills`, `userSkills`, `matchRequests`, `sessions`, `messages`, `reviews`, `creditTransactions`, `notifications`, `reports`.
- **Compound Uniqueness:**
  - `userSkills`: `{ user: 1, skill: 1, type: 1 }` prevents duplicate skill listings.
  - `reviews`: `{ session: 1, reviewer: 1 }` prevents duplicate review submissions.
- **Immutable Ledger:** `creditTransactions` maintains a complete audit trail of every credit transfer.

> **Speaker Notes:**  
> *"Our data tier uses 10 collections designed for transactional integrity. Compound indexes prevent users from adding duplicate skills or filing duplicate reviews. All balance changes are immutably logged in a transaction ledger."*

---

## Slide 6: Matching Engine & Mathematical Scoring Formula
$$\text{Total Score} = \min(100, S_{\text{base}} + B_{\text{location}} + B_{\text{availability}} + B_{\text{rating}} + B_{\text{proficiency}})$$
- **Base Score ($S_{\text{base}}$):**
  - **Mutual Swap:** 100 points
  - **One-Way Credit Swap:** 50 points
- **Bonus Factors (up to 50 additional points):**
  - **Same City Location:** +15 points
  - **Schedule Overlap:** +15 points
  - **Candidate Rating ($\ge 4.5$):** +10 points
  - **Proficiency Fit (Expert teaching Beginner):** +10 points
- **Secondary Tie-Breakers:** High average rating and total review counts.

> **Speaker Notes:**  
> *"Our matching algorithm calculates a multi-dimensional score from 0 to 100%. Mutual matches start at base 100, while credit-based matches start at base 50. Bonus points are awarded for shared city location, overlapping schedule availability, high peer ratings, and proficiency fit."*

---

## Slide 7: Atomic Dual-Signoff Protocol & Wallet Safeguards
1. **Solvency Verification:** Learner must have $\ge \text{credits}$ before proposing or confirming a session.
2. **Dual-Signoff Requirement:**
   - Teacher marks "Completed" $\rightarrow \text{teacherConfirmed} = \text{true}$
   - Learner marks "Completed" $\rightarrow \text{learnerConfirmed} = \text{true}$
   - When both verify: Learner balance decrements, Teacher balance increments atomically.
3. **Cancellation Protection:** Cancelled sessions never debit credits.
4. **Dispute Safeguard:** If one party fails to sign off, credits remain safe until an admin reviews the incident report.

> **Speaker Notes:**  
> *"To eliminate fraud and no-shows, credits never transfer based on a single user's claim. Both the teacher and learner must click 'Mark Completed' on their dashboards. Only when both flags are true does the backend execute an atomic credit transfer."*

---

## Slide 8: Real-Time Communication & Sockets
- **Socket.io WebSocket Pipeline:** Authenticated during the handshake using JWT access tokens.
- **Chat Authorization Guard:** Users can only message peers with an active `accepted` swap request.
- **Typing Indicators:** Client emits `typing:start` and debounces for 1.5 seconds before emitting `typing:stop`.
- **Instant Alerts:** Real-time push for new swap requests, session confirmations, and earned credit transfers.

> **Speaker Notes:**  
> *"Once a swap request is accepted, a secure real-time WebSocket channel is unlocked. Peers can chat, see debounced typing indicators, view read receipts, and receive instant toasts when a session is booked or credits are earned."*

---

## Slide 9: Admin Dashboard & Telemetry (Recharts)
- **Role-Based Security:** Guarded by `RoleRoute('admin')` on frontend and `authorizeRoles('admin')` on backend.
- **Interactive Visualizations (Recharts):**
  - Weekly session trends (Scheduled vs Completed)
  - Top 10 in-demand skills horizontal bar chart
  - Skill category distribution donut chart
- **Governance Controls:** Search and suspend bad actors; approve community-suggested custom skills; inspect and resolve safety dispute reports.

> **Speaker Notes:**  
> *"Our administrative dashboard provides telemetric oversight. We use Recharts for interactive weekly trends, top skills, and category shares. Administrators can also approve user-suggested custom skills and suspend disruptive users."*

---

## Slide 10: Cross-Platform Mobile App (Flutter Material 3)
- **Unified REST API:** Consumes the exact same backend endpoints as the web app.
- **Dynamic Host Resolution:** Automatically points to `10.0.2.2:5000` on Android emulators and `localhost:5000` on iOS simulators.
- **Material 3 Design:** NavigationBar with Home, Matches, Requests, Sessions, and Profile screens.

> **Speaker Notes:**  
> *"Our mobile application is built in Flutter adhering to Google's Material 3 design system. It uses a reactive Provider architecture and dynamic network configuration to work seamlessly on both emulators and physical devices."*

---

## Slide 11: Security, Access Control & API Hardening
- **Authentication:** Stateless JWT access tokens with 7-day expiration and `/api/auth/refresh` rotation.
- **NoSQL Injection Defense:** `express-mongo-sanitize` strips `$` and `.` operators.
- **XSS Defense:** Custom `xssClean` middleware scrubs HTML/script payloads.
- **HTTP Security Headers:** Helmet enforces `Content-Security-Policy` and `X-Frame-Options`.
- **Rate Limiting:** Prevents brute-force attacks with an IP-based request threshold.
- **Documentation:** Interactive OpenAPI 3.0 / Swagger UI at `/api/docs`.

> **Speaker Notes:**  
> *"Security was designed into every layer. We protect against NoSQL injection, XSS attacks, and brute-force attempts with rate limiting and Helmet headers. The entire API is documented via interactive Swagger UI."*

---

## Slide 12: Testing & Quality Assurance
- **Frameworks:** Jest, Supertest, in-memory MongoDB, Socket.io-client.
- **Test Metrics:**
  - **9 out of 9 test suites passed**
  - **79 out of 79 automated tests passed (100% pass rate)**
  - Zero snapshots, zero flaky tests.
- **Automated Coverage:** Unit tests for matching and credit logic; integration tests for auth, skills, requests, sessions, chat, and admin moderation.

> **Speaker Notes:**  
> *"We maintained a strict test-driven development workflow. Our automated test suite includes 79 tests across 9 test suites, covering all business logic, credit transactions, and security barriers with a 100% passing record."*

---

## Slide 13: Live Demonstration Walkthrough (3-Minute Script)
1. **Login:** Log in as **Alice Johnson** (`alice@example.com`), a Guitar teacher in Boston with 4 credits.
2. **Find Match:** Alice browses `/matches` and spots **Bob Smith** (Full-Stack Dev in Boston who wants Guitar). Match Score: **95% (Mutual Swap)**.
3. **Send Request:** Alice selects *Full-Stack Development* and sends a mutual swap request.
4. **Switch User & Accept:** Log in as **Bob** (`bob@example.com`) $\rightarrow$ open `/requests` $\rightarrow$ click **Accept**.
5. **Chat:** Bob clicks **Open Chat** $\rightarrow$ sends *"Hey Alice, let's schedule our session!"* $\rightarrow$ Alice sees real-time message bubble.
6. **Schedule & Complete:** Propose a 60-minute session $\rightarrow$ confirm $\rightarrow$ both click **Mark Completed** $\rightarrow$ credits verify and transfer atomically!
7. **Admin Console:** Switch to `admin@skillswap.com` $\rightarrow$ view live Recharts analytics updated with the new session and credit transfer!

> **Speaker Notes:**  
> *"Now let's conduct a live demonstration of the complete peer-to-peer exchange workflow from discovery to atomic credit transfer and administrative telemetry."*

---

## Slide 14: Conclusion & Future Scope
- **Conclusion:** Skill-Swap successfully removes monetary barriers to education while solving the barter double coincidence problem through time-banking credits.
- **Future Enhancements:**
  1. Built-in WebRTC peer-to-peer encrypted video calls.
  2. AI-driven resume and GitHub skill extraction.
  3. Staking escrow deposits to penalize no-shows.

> **Speaker Notes:**  
> *"In conclusion, Skill-Swap proves that a cashless, algorithmic peer-to-peer knowledge economy is both technically viable and socially transformative. Thank you, and we welcome your questions."*

---

## Slide 15: Q&A / Defense Session
- *Open floor for evaluation panel questions.*
- Refer to [`docs/VIVA_QA.md`](./VIVA_QA.md) for 40 detailed answers on architecture, concurrency, algorithms, and security.

