class SkillModel {
  final String id;
  final String name;
  final String category;
  final String? description;
  final String status;

  SkillModel({
    required this.id,
    required this.name,
    required this.category,
    this.description,
    required this.status,
  });

  factory SkillModel.fromJson(Map<String, dynamic> json) {
    return SkillModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? 'Other',
      description: json['description'],
      status: json['status'] ?? 'approved',
    );
  }
}

class UserSkillModel {
  final String id;
  final SkillModel skill;
  final String type; // 'TEACH' or 'LEARN'
  final String proficiency; // 'Beginner', 'Intermediate', 'Expert'
  final String? description;

  UserSkillModel({
    required this.id,
    required this.skill,
    required this.type,
    required this.proficiency,
    this.description,
  });

  factory UserSkillModel.fromJson(Map<String, dynamic> json) {
    SkillModel resolvedSkill;
    if (json['skill'] is Map) {
      resolvedSkill = SkillModel.fromJson(json['skill']);
    } else {
      resolvedSkill = SkillModel(
        id: json['skill']?.toString() ?? '',
        name: 'Skill',
        category: 'General',
        status: 'approved',
      );
    }

    return UserSkillModel(
      id: json['_id'] ?? json['id'] ?? '',
      skill: resolvedSkill,
      type: json['type'] ?? 'TEACH',
      proficiency: json['proficiency'] ?? 'Intermediate',
      description: json['description'],
    );
  }
}

