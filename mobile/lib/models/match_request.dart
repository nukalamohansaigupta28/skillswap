import 'user.dart';
import 'skill.dart';

class MatchRequestModel {
  final String id;
  final UserModel sender;
  final UserModel receiver;
  final SkillModel skillRequested;
  final SkillModel? skillOffered;
  final String matchType; // 'MUTUAL' or 'ONE_WAY'
  final String status; // 'pending', 'accepted', 'declined', 'cancelled'
  final String message;
  final DateTime createdAt;

  MatchRequestModel({
    required this.id,
    required this.sender,
    required this.receiver,
    required this.skillRequested,
    this.skillOffered,
    required this.matchType,
    required this.status,
    required this.message,
    required this.createdAt,
  });

  factory MatchRequestModel.fromJson(Map<String, dynamic> json) {
    return MatchRequestModel(
      id: json['_id'] ?? json['id'] ?? '',
      sender: UserModel.fromJson(json['sender']),
      receiver: UserModel.fromJson(json['receiver']),
      skillRequested: SkillModel.fromJson(json['skillRequested']),
      skillOffered: json['skillOffered'] != null ? SkillModel.fromJson(json['skillOffered']) : null,
      matchType: json['matchType'] ?? 'MUTUAL',
      status: json['status'] ?? 'pending',
      message: json['message'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

