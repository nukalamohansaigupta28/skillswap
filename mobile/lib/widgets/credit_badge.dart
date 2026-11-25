import 'package:flutter/material.dart';
import '../constants/theme.dart';

class CreditBadge extends StatelessWidget {
  final int credits;
  final VoidCallback? onTap;

  const CreditBadge({Key? key, required this.credits, this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppTheme.creditAmberLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '⚡',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(width: 4),
            Text(
              '$credits',
              style: const TextStyle(
                color: Color(0xFF92400E),
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 3),
            const Text(
              'credits',
              style: TextStyle(
                color: Color(0xFFB45309),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

