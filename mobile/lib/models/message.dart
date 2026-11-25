class MessageModel {
  final String id;
  final String senderId;
  final String senderName;
  final String content;
  final DateTime createdAt;
  final bool isRead;

  MessageModel({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.createdAt,
    required this.isRead,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    String sId = '';
    String sName = 'User';
    if (json['sender'] is Map) {
      sId = json['sender']['_id'] ?? json['sender']['id'] ?? '';
      sName = json['sender']['name'] ?? 'User';
    } else if (json['sender'] is String) {
      sId = json['sender'];
    }

    return MessageModel(
      id: json['_id'] ?? json['id'] ?? '',
      senderId: sId,
      senderName: sName,
      content: json['content'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['readAt'] != null,
    );
  }
}

