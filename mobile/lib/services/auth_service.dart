import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import 'api_client.dart';
import '../constants/api_constants.dart';

class AuthService extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  UserModel? _currentUser;
  String? _token;
  bool _isLoading = true;

  UserModel? get currentUser => _currentUser;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _currentUser != null;
  bool get isLoading => _isLoading;

  AuthService() {
    init();
  }

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('skillswap_token');
      if (_token != null) {
        final res = await _api.get(ApiConstants.me);
        if (res != null && res['data'] != null) {
          _currentUser = UserModel.fromJson(res['data']);
        } else {
          await logout();
        }
      }
    } catch (_) {
      _token = null;
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final res = await _api.post(ApiConstants.login, {
      'email': email,
      'password': password,
    });

    if (res != null && res['data'] != null) {
      _token = res['data']['token'];
      _currentUser = UserModel.fromJson(res['data']['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('skillswap_token', _token!);
      notifyListeners();
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String city,
    String? bio,
  }) async {
    final res = await _api.post(ApiConstants.register, {
      'name': name,
      'email': email,
      'password': password,
      'city': city,
      if (bio != null && bio.isNotEmpty) 'bio': bio,
    });

    if (res != null && res['data'] != null) {
      _token = res['data']['token'];
      _currentUser = UserModel.fromJson(res['data']['user']);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('skillswap_token', _token!);
      notifyListeners();
    }
  }

  Future<void> refreshProfile() async {
    try {
      final res = await _api.get(ApiConstants.me);
      if (res != null && res['data'] != null) {
        _currentUser = UserModel.fromJson(res['data']);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to refresh profile: $e');
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('skillswap_token');
    notifyListeners();
  }
}

