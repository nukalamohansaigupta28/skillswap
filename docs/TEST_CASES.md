# Skill-Swap Platform — Comprehensive Quality Assurance & Test Case Matrix

This document provides the complete, audited test suite documentation and quality assurance verification matrix for the **Skill-Swap Platform**, covering unit tests, integration tests, security audits, and edge-case validation across the Backend (Node.js/Express/MongoDB), Frontend (React/Vite/Tailwind), and Mobile (Flutter) components.

---

## 1. Test Execution Summary

- **Total Test Suites:** 9 / 9 passed (100%)
- **Total Automated Tests:** 79 / 79 passed (100%)
- **Code Coverage Target:** >85% across controllers, services, models, and middleware
- **Test Framework:** Jest, Supertest, mongodb-memory-server, Socket.io-client

```
PASS tests/integration/swaggerAndSecurity.test.js
PASS tests/integration/skill.test.js
PASS tests/integration/reviewAndAdmin.test.js
PASS tests/integration/request.test.js
PASS tests/integration/session.test.js
PASS tests/integration/auth.test.js
PASS tests/integration/chat.test.js
PASS tests/unit/walletService.test.js
PASS tests/unit/matchingService.test.js

Test Suites: 9 passed, 9 total
Tests:       79 passed, 79 total
Snapshots:   0 total
Time:        43.128 s
```

---

## 2. Test Case Matrix by Functional Module

### Module 1: Authentication & User Management (Phase 1)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-AUTH-01` | System Health Check | `GET /api/health` | Returns `200 OK`, `status: "healthy"` | PASS |
| `TC-AUTH-02` | Successful User Registration | Valid email, password (min 6 chars), name, city | Returns `201 Created`, JWT token, and assigns **2 starting credits** | PASS |
| `TC-AUTH-03` | Duplicate Email Rejection | Already registered email address | Returns `409 Conflict`, error message preventing duplicates | PASS |
| `TC-AUTH-04` | Input Validation Rejection | Malformed email (e.g. `invalid-email`) or short password | Returns `400 Bad Request` with field-specific error messages | PASS |
| `TC-AUTH-05` | Successful Login | Registered email and matching password | Returns `200 OK`, JWT access token, and user payload | PASS |
| `TC-AUTH-06` | Wrong Password Rejection | Registered email with incorrect password | Returns `401 Unauthorized` | PASS |
| `TC-AUTH-07` | Protected Route with Valid JWT | `GET /api/auth/me` with `Authorization: Bearer <token>` | Returns `200 OK` and current user profile | PASS |
| `TC-AUTH-08` | Missing Token Rejection | `GET /api/auth/me` without Authorization header | Returns `401 Unauthorized` | PASS |
| `TC-AUTH-09` | Profile Modification | `PUT /api/users/me` updating bio, location city | Returns `200 OK` with persisted updates in DB | PASS |
| `TC-AUTH-10` | Public Profile View | `GET /api/users/:id` | Returns `200 OK` without leaking passwordHash or private tokens | PASS |

---

### Module 2: Skill Catalog & User Skills (Phase 2)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-SKILL-01` | Browse Approved Catalog | `GET /api/skills` | Returns paginated list of approved skills (Music, Coding, etc.) | PASS |
| `TC-SKILL-02` | Category Filtering | `GET /api/skills?category=Coding` | Returns only skills categorized under `Coding` | PASS |
| `TC-SKILL-03` | Keyword Search | `GET /api/skills?search=Guitar` | Case-insensitive regex match returning Guitar skills | PASS |
| `TC-SKILL-04` | Custom Skill Suggestion | `POST /api/skills` by standard user | Creates new skill with `status: "pending"` | PASS |
| `TC-SKILL-05` | Duplicate Skill Rejection | Suggesting an already existing skill name | Returns `409 Conflict` | PASS |
| `TC-SKILL-06` | Unauthorized Skill Approval | Standard user calling `PATCH /api/skills/:id/approve` | Returns `403 Forbidden` | PASS |
| `TC-SKILL-07` | Admin Skill Approval | Admin calling `PATCH /api/skills/:id/approve` | Updates status to `approved`, making it catalog-wide | PASS |
| `TC-SKILL-08` | Add Skill to TEACH List | `POST /api/users/me/skills` with `type: "TEACH"` | Stores in `userSkills` collection with proficiency tier | PASS |
| `TC-SKILL-09` | Add Skill to LEARN List | `POST /api/users/me/skills` with `type: "LEARN"` | Stores in `userSkills` collection as learning target | PASS |
| `TC-SKILL-10` | Duplicate User Skill Guard | Adding same `(user, skill, type)` combination twice | Returns `409 Conflict` enforcing compound index uniqueness | PASS |
| `TC-SKILL-11` | Update Skill Proficiency | `PUT /api/users/me/skills/:id` updating to `Expert` | Updates proficiency and returns updated document | PASS |
| `TC-SKILL-12` | Remove Skill from Portfolio | `DELETE /api/users/me/skills/:id` | Successfully deletes user skill mapping | PASS |
| `TC-SKILL-13` | Browse Teachers by Location | `GET /api/users/search?skill=Guitar&location=Boston` | Returns users teaching Guitar in Boston | PASS |

---

### Module 3: Matching Engine & Swap Requests (Phase 3)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-MATCH-01` | Mutual Match Detection | User A teaches Guitar / wants Coding; User B teaches Coding / wants Guitar | Assigned `score: 100` base + bonuses, tagged `MUTUAL` | PASS |
| `TC-MATCH-02` | One-Way Credit Match | User B teaches Coding / wants French; User A wants Coding but teaches Guitar | Assigned `score: 50` base + bonuses, tagged `ONE_WAY` | PASS |
| `TC-MATCH-03` | No-Match Verification | Candidate teaches nothing the active user wants | Returns `score: 0`, `isMatch: false` | PASS |
| `TC-MATCH-04` | Same City Location Bonus | User A and B both reside in Boston | Awards **+15 Location Bonus** | PASS |
| `TC-MATCH-05` | Schedule Overlap Bonus | Overlapping day/time availability slots | Awards **+up to 15 Availability Bonus** | PASS |
| `TC-MATCH-06` | Top-Rating Bonus | Candidate has 4.9 average rating with 10+ reviews | Awards **+up to 10 Rating Bonus** | PASS |
| `TC-MATCH-07` | Proficiency Fit Bonus | Teacher is `Expert` and learner is `Beginner` | Awards **+10 Proficiency Bonus** | PASS |
| `TC-MATCH-08` | Score Tie-Breaking | Two candidates with equal 85 match scores | Candidate with higher average rating ranked first | PASS |
| `TC-REQ-01` | Send Swap Request | `POST /api/requests` with valid receiver & skills | Creates request in `pending` status, emits socket alert | PASS |
| `TC-REQ-02` | Self-Request Prevention | Sender sends request to their own `_id` | Returns `400 Bad Request` ("Cannot send request to yourself") | PASS |
| `TC-REQ-03` | Duplicate Request Guard | Sending second request while previous is still pending | Returns `409 Conflict` ("Pending request already exists") | PASS |
| `TC-REQ-04` | Suspended Account Guard | Sending request to a suspended receiver | Returns `403 Forbidden` | PASS |
| `TC-REQ-05` | Request Inbox/Outbox | `GET /api/requests?type=received` and `type=sent` | Segregates incoming vs outgoing proposals | PASS |
| `TC-REQ-06` | Receiver Accept Action | Receiver calls `PATCH /api/requests/:id` with `accept` | Status becomes `accepted`, unlocks chat & sessions | PASS |
| `TC-REQ-07` | Sender Cannot Accept Own | Sender calls `PATCH /api/requests/:id` with `accept` | Returns `403 Forbidden` ("Only receiver can accept") | PASS |
| `TC-REQ-08` | Cancel Pending Request | Sender calls `PATCH /api/requests/:id` with `cancel` | Status becomes `cancelled` | PASS |

---

### Module 4: Sessions & Credit Wallet (Phase 4)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-SESS-01` | Propose Session Without Match | Proposing session between unmatched users | Returns `400 Bad Request` (Match must be accepted) | PASS |
| `TC-SESS-02` | Insufficient Credit Block | Learner with 0 credits attempts to book 60m session | Returns `400 Bad Request` ("Insufficient credits") | PASS |
| `TC-SESS-03` | Propose 60-Minute Session | Accepted match, future date, 60 minutes | Returns `201 Created` with status `proposed` | PASS |
| `TC-SESS-04` | Self-Confirm Block | Proposer attempts to confirm their own proposal | Returns `400 Bad Request` (Awaiting partner confirmation) | PASS |
| `TC-SESS-05` | Partner Confirm Session | Other participant confirms proposal | Status becomes `confirmed` | PASS |
| `TC-SESS-06` | Reschedule Confirmed | Either party proposes new future datetime | Status becomes `rescheduled`, requires re-confirmation | PASS |
| `TC-SESS-07` | Single Signoff (Partial) | Teacher calls `PATCH /api/sessions/:id/complete` | Flags `teacherConfirmed: true`, zero credits move | PASS |
| `TC-SESS-08` | Dual Signoff (Atomic Settlement) | Learner calls `PATCH /api/sessions/:id/complete` | Both confirmed -> Learner -1 credit, Teacher +1 credit | PASS |
| `TC-SESS-09` | Idempotent Transfer Guard | Calling complete endpoint again on settled session | Does not double-transfer credits | PASS |
| `TC-SESS-10` | Cancelled Session Safe | Session cancelled after confirmation | Status becomes `cancelled`, zero credits transferred | PASS |
| `TC-SESS-11` | Wallet Transaction Ledger | `GET /api/wallet` after completion | Returns balance and audited `EARN` / `SPEND` records | PASS |

---

### Module 5: Real-Time Chat & Notifications (Phase 5)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-CHAT-01` | Chat Authorization Guard | User A tries to message User C (no accepted match) | Returns `403 Forbidden` | PASS |
| `TC-CHAT-02` | Matched Peer Chat | User A messages User B (accepted match) | Returns `201 Created`, persists message in DB | PASS |
| `TC-CHAT-03` | Conversation Listing | `GET /api/conversations` | Lists threads with last message preview and unread count | PASS |
| `TC-CHAT-04` | Chronological Thread | `GET /api/conversations/:id/messages` | Returns messages in strict chronological order | PASS |
| `TC-CHAT-05` | Mark Read Receipt | `PATCH /api/conversations/:id/read` | Sets `readAt: Date` on unread messages | PASS |
| `TC-CHAT-06` | Real-Time Socket Delivery | Socket client emits `message:send` with JWT | Receiver receives `message:received` event in real time | PASS |
| `TC-CHAT-07` | Typing Indicators | Socket client emits `typing:start` | Target client receives `typing:start` event | PASS |
| `TC-NOTIF-01` | Fetch Notifications | `GET /api/notifications` | Returns list of notifications with `unreadCount` | PASS |
| `TC-NOTIF-02` | Mark All Read | `PATCH /api/notifications/read-all` | Sets all notifications to `isRead: true` | PASS |

---

### Module 6: Reviews, Ratings & Admin Governance (Phase 6 & 10)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-REV-01` | Premature Review Block | Attempting review on session that is not completed | Returns `400 Bad Request` | PASS |
| `TC-REV-02` | Valid 5-Star Review | Submitting 5 stars + feedback for completed session | Returns `201 Created`, recalculates target user's average | PASS |
| `TC-REV-03` | Duplicate Review Block | Same user submitting second review for same session | Returns `409 Conflict` | PASS |
| `TC-REV-04` | Public Reviews Query | `GET /api/users/:id/reviews` | Returns review list with star distributions | PASS |
| `TC-REP-01` | Self-Report Guard | User attempts to report themselves | Returns `400 Bad Request` | PASS |
| `TC-REP-02` | File Safety Report | User reports another for no-show or abuse | Creates report in `open` status for admin moderation | PASS |
| `TC-ADM-01` | Admin Guard | Regular user accessing `/api/admin/*` | Returns `403 Forbidden` | PASS |
| `TC-ADM-02` | List All Users | Admin calling `GET /api/admin/users` | Returns paginated user records excluding passwords | PASS |
| `TC-ADM-03` | Suspend Bad Actor | Admin calling `PATCH /api/admin/users/:id/status` | Sets `status: "suspended"` | PASS |
| `TC-ADM-04` | Self-Suspend Guard | Admin attempts to suspend their own account | Returns `400 Bad Request` | PASS |
| `TC-ADM-05` | Resolve Safety Report | Admin calls `PATCH /api/admin/reports/:id` with notes | Sets `status: "resolved"` with admin resolution notes | PASS |
| `TC-ADM-06` | Platform Telemetry | Admin calling `GET /api/admin/analytics` | Returns aggregated metrics, weekly sessions, and top skills | PASS |

---

### Module 7: Backend Hardening, OpenAPI & Security (Phase 7)
| Test ID | Test Scenario | Input Data | Expected Result | Status |
|:---|:---|:---|:---|:---:|
| `TC-SEC-01` | Swagger UI Serving | `GET /api/docs/` | Returns `200 OK` HTML with Swagger UI assets | PASS |
| `TC-SEC-02` | OpenAPI JSON Spec | `GET /api/docs.json` | Returns valid OpenAPI 3.0 specification | PASS |
| `TC-SEC-03` | Token Refresh | `POST /api/auth/refresh` with valid token | Issues new JWT access token | PASS |
| `TC-SEC-04` | Invalid Refresh Rejection | `POST /api/auth/refresh` with expired/tampered token | Returns `401 Unauthorized` | PASS |
| `TC-SEC-05` | XSS Attack Sanitization | Request body containing `<script>alert('xss')</script>` | Script tags stripped/escaped before database entry | PASS |
| `TC-SEC-06` | NoSQL Injection Defense | Query parameter containing `{"$gt": ""}` | Sanitized by `express-mongo-sanitize`, injection neutral | PASS |

---

## 3. How to Run the Automated Test Suite

To execute all unit and integration test suites:
```bash
cd backend
npm test
```

To run a specific test suite:
```bash
cd backend
npx jest tests/unit/matchingService.test.js
npx jest tests/unit/walletService.test.js
npx jest tests/integration/auth.test.js
```

