# Skill-Swap Mobile App (Flutter)

A modern cross-platform mobile application for **Skill-Swap Platform**, built with Flutter and Material 3 design system, consuming the Node.js/Express REST backend.

---

## 📱 Features

- **Authentication:** JWT Bearer authentication, session persistence via `shared_preferences`, fast demo login shortcuts.
- **Home Dashboard:** Sovereign credit balance pill, pending request counters, confirmed sessions status, and safety rules guide.
- **Smart Matching Engine:** Ranked suggestions with score indicators, mutual swap vs credit-based flags, and interactive swap request dialogs.
- **Request Inbox & Outbox:** Accept, decline, and cancel swap proposals.
- **Live 1-to-1 Chat:** Messaging thread with matched peers.
- **Session Scheduling:** Propose sessions, confirm schedules, and execute atomic dual-completion signoffs.
- **Skill-Credit Wallet:** Credit balance cards, economy guide, and audited transaction ledger (`EARN`, `SPEND`, `BONUS`).
- **Profile & Skills Portfolio:** Add and remove TEACH skills and LEARN goals, select proficiency tiers (`Beginner`, `Intermediate`, `Expert`).

---

## 🛠️ Architecture

```
mobile/
├── pubspec.yaml                  # Flutter package definition and dependencies
├── lib/
│   ├── main.dart                 # Application entry point with Provider tree
│   ├── constants/
│   │   ├── api_constants.dart    # Configurable backend URLs (Android/iOS/Web)
│   │   └── theme.dart            # Material 3 light design tokens (Indigo & Amber)
│   ├── models/
│   │   ├── user.dart             # UserModel with JSON serialization
│   │   ├── skill.dart            # SkillModel & UserSkillModel
│   │   ├── match.dart            # MatchModel & scoring breakdown
│   │   ├── match_request.dart    # MatchRequestModel
│   │   ├── session.dart          # SessionModel with dual-verification flags
│   │   ├── message.dart          # MessageModel
│   │   └── wallet_transaction.dart # WalletTransactionModel
│   ├── services/
│   │   ├── api_client.dart       # HTTP client with JWT header injection & error handling
│   │   └── auth_service.dart     # Reactive ChangeNotifier for authentication state
│   ├── widgets/
│   │   ├── credit_badge.dart     # Reusable credit balance pill
│   │   └── custom_button.dart    # Accessible Material 3 button with loading states
│   └── screens/
│       ├── splash_screen.dart    # Initial session validation check
│       ├── login_screen.dart     # Sign in with 1-click demo accounts
│       ├── register_screen.dart  # Sign up with 2 welcome credits banner
│       ├── main_navigation_screen.dart # Material 3 bottom navigation bar
│       ├── home_screen.dart      # Central dashboard
│       ├── matches_screen.dart   # Ranked match recommendations
│       ├── requests_screen.dart  # Swap proposals inbox and outbox
│       ├── chat_screen.dart      # Peer 1-on-1 chat
│       ├── sessions_screen.dart  # Calendar & dual-signoff completion
│       ├── wallet_screen.dart    # Credit ledger
│       └── profile_screen.dart   # Portfolio management
```

---

## 🚀 Running the App

### Prerequisites
1. Ensure the backend server is running:
   ```bash
   cd ../backend
   npm run dev
   ```

2. Run the Flutter application:
   ```bash
   cd mobile
   flutter pub get
   flutter run
   ```

### Emulator vs Device Network URLs
Configured in `lib/constants/api_constants.dart`:
- **Android Emulator:** Points automatically to `http://10.0.2.2:5000/api`.
- **iOS Simulator & Web:** Points to `http://localhost:5000/api`.
- **Physical Device:** Update `api_constants.dart` with your machine's LAN IP (e.g. `http://192.168.1.50:5000/api`).

