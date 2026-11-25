import 'user.dart';
import 'skill.dart';

class MatchModel {
  final UserModel user;
  final String matchType; // 'MUTUAL' or 'ONE_WAY'
  final int score;
  final String explanation;
  final Map<String, dynamic> scoreBreakdown;
  final List<UserSkillModel> candidateTeaches;
  final List<UserSkillModel> userTeaches;

  MatchModel({
    required this.user,
    required this.matchType,
    required this.score,
    required this.explanation,
    required this.scoreBreakdown,
    required this.candidateTeaches,
    required this.userTeaches,
  });

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    final candidateTeachesList = <UserSkillModel>[];
    if (json['complementarySkills'] is Map &&
        json['complementarySkills']['candidateTeaches'] is List) {
      for (var item in json['complementarySkills']['candidateTeaches']) {
        candidateTeachesList.add(UserSkillModel.fromJson(item));
      }
    }

    final userTeachesList = <UserSkillModel>[];
    if (json['complementarySkills'] is Map &&
        json['complementarySkills']['userTeaches'] is List) {
      for (var item in json['complementarySkills']['userTeaches']) {
        userTeachesList.add(UserSkillModel.fromJson(item));
      }
    }

    return MatchModel(
      user: UserModel.fromJson(json['user']),
      matchType: json['matchType'] ?? 'MUTUAL',
      score: (json['score'] is num) ? (json['score'] as num).toInt() : 0,
      explanation: json['explanation'] ?? '',
      scoreBreakdown: json['scoreBreakdown'] is Map ? json['scoreBreakdown'] : {},
      candidateTeaches: candidateTeachesList,
      userTeaches: userTeachesList,
    );
  }
}

