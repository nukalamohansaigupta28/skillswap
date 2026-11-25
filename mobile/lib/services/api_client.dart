import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('skillswap_token');
  }

  Future<Map<String, String>> _headers() async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await _getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  dynamic _processResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      body = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      final msg = (body is Map && body['message'] != null)
          ? body['message'].toString()
          : 'Request failed with status code ${response.statusCode}';
      throw ApiException(msg, response.statusCode);
    }
  }

  Future<dynamic> get(String endpoint, {Map<String, String>? queryParams}) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint')
        .replace(queryParameters: queryParams);
    final headers = await _headers();
    final response = await http.get(uri, headers: headers);
    return _processResponse(response);
  }

  Future<dynamic> post(String endpoint, dynamic data) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _headers();
    final response = await http.post(
      uri,
      headers: headers,
      body: jsonEncode(data),
    );
    return _processResponse(response);
  }

  Future<dynamic> patch(String endpoint, [dynamic data]) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _headers();
    final response = await http.patch(
      uri,
      headers: headers,
      body: data != null ? jsonEncode(data) : null,
    );
    return _processResponse(response);
  }

  Future<dynamic> delete(String endpoint) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _headers();
    final response = await http.delete(uri, headers: headers);
    return _processResponse(response);
  }
}

