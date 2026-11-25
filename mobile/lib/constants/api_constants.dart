import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // Determine appropriate host depending on runtime platform:
  // Android Emulator: 10.0.2.2 points to host localhost
  // iOS Simulator / macOS / Windows / Linux: localhost points to host
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api';
      }
    } catch (_) {
      // Fallback
    }
    return 'http://localhost:5000/api';
  }

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';

  // Core endpoints
  static const String matches = '/matches';
  static const String requests = '/requests';
  static const String sessions = '/sessions';
  static const String conversations = '/conversations';
  static const String wallet = '/wallet';
  static const String userSkills = '/users/me/skills';
  static const String catalogSkills = '/skills';
  static const String userProfile = '/users/me';
  static const String reviews = '/reviews';
}

