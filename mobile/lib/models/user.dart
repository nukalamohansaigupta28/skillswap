class UserModel {
  final String id;
  final String name;
  final String email;
  final String? bio;
  final String? city;
  final String? photoUrl;
  final String role;
  final String status;
  final int creditBalance;
  final double ratingAverage;
  final int ratingCount;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.bio,
    this.city,
    this.photoUrl,
    required this.role,
    required this.status,
    required this.creditBalance,
    required this.ratingAverage,
    required this.ratingCount,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? resolvedCity;
    if (json['location'] is Map) {
      resolvedCity = json['location']['city'];
    }

    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'User',
      email: json['email'] ?? '',
      bio: json['bio'],
      city: resolvedCity,
      photoUrl: json['photoUrl'],
      role: json['role'] ?? 'user',
      status: json['status'] ?? 'active',
      creditBalance: (json['creditBalance'] is num) ? (json['creditBalance'] as num).toInt() : 0,
      ratingAverage: (json['ratingAverage'] is num) ? (json['ratingAverage'] as num).toDouble() : 0.0,
      ratingCount: (json['ratingCount'] is num) ? (json['ratingCount'] as num).toInt() : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'bio': bio,
      'location': {'city': city},
      'photoUrl': photoUrl,
      'role': role,
      'status': status,
      'creditBalance': creditBalance,
      'ratingAverage': ratingAverage,
      'ratingCount': ratingCount,
    };
  }
}

