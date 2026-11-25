import 'user.dart';
import 'skill.dart';

class SessionModel {
  final String id;
  final UserModel teacher;
  final UserModel learner;
  final SkillModel skill;
  final DateTime scheduledAt;
  final int durationMinutes;
  final String mode; // 'online' or 'offline'
  final String? meetingLink;
  final String? locationAddress;
  final String status; // 'proposed', 'confirmed', 'completed', 'cancelled'
  final bool teacherConfirmed;
  final bool learnerConfirmed;
  final bool creditsTransferred;

  SessionModel({
    required this.id,
    required this.teacher,
    required this.learner,
    required this.skill,
    required this.scheduledAt,
    required this.durationMinutes,
    required this.mode,
    this.meetingLink,
    this.locationAddress,
    required this.status,
    required this.teacherConfirmed,
    required this.learnerConfirmed,
    required this.creditsTransferred,
  });

  factory SessionModel.fromJson(Map<String, dynamic> json) {
    bool tConfirmed = false;
    bool lConfirmed = false;
    if (json['completionConfirmation'] is Map) {
      tConfirmed = json['completionConfirmation']['teacherConfirmed'] ?? false;
      lConfirmed = json['completionConfirmation']['learnerConfirmed'] ?? false;
    }

    return SessionModel(
      id: json['_id'] ?? json['id'] ?? '',
      teacher: UserModel.fromJson(json['teacher']),
      learner: UserModel.fromJson(json['learner']),
      skill: SkillModel.fromJson(json['skill']),
      scheduledAt: json['scheduledAt'] != null
          ? DateTime.tryParse(json['scheduledAt']) ?? DateTime.now()
          : DateTime.now(),
      durationMinutes: json['durationMinutes'] ?? 60,
      mode: json['mode'] ?? 'online',
      meetingLink: json['meetingLink'],
      locationAddress: json['locationAddress'],
      status: json['status'] ?? 'proposed',
      teacherConfirmed: tConfirmed,
      learnerConfirmed: lConfirmed,
      creditsTransferred: json['creditsTransferred'] ?? false,
    );
  }
}

