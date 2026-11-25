class WalletTransactionModel {
  final String id;
  final double amount;
  final String type; // 'EARN', 'SPEND', 'BONUS', 'REFUND'
  final int balanceAfter;
  final DateTime createdAt;
  final String? sessionInfo;

  WalletTransactionModel({
    required this.id,
    required this.amount,
    required this.type,
    required this.balanceAfter,
    required this.createdAt,
    this.sessionInfo,
  });

  factory WalletTransactionModel.fromJson(Map<String, dynamic> json) {
    String? sInfo;
    if (json['session'] is Map) {
      sInfo = '${json['session']['durationMinutes'] ?? 60}m session (${json['session']['mode'] ?? 'online'})';
    }

    return WalletTransactionModel(
      id: json['_id'] ?? json['id'] ?? '',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      type: json['type'] ?? 'EARN',
      balanceAfter: (json['balanceAfter'] is num) ? (json['balanceAfter'] as num).toInt() : 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      sessionInfo: sInfo,
    );
  }
}

