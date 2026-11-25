import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../models/session.dart';
import '../constants/theme.dart';
import '../widgets/custom_button.dart';

class SessionsScreen extends StatefulWidget {
  const SessionsScreen({Key? key}) : super(key: key);

  @override
  State<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends State<SessionsScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;
  List<SessionModel> _confirmed = [];
  List<SessionModel> _proposed = [];
  List<SessionModel> _completed = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);
    try {
      final resList = await Future.wait([
        _api.get('/sessions?status=confirmed'),
        _api.get('/sessions?status=proposed'),
        _api.get('/sessions?status=completed'),
      ]);

      if (mounted) {
        setState(() {
          _confirmed = (resList[0]?['data'] as List?)
                  ?.map((e) => SessionModel.fromJson(e))
                  .toList() ??
              [];
          _proposed = (resList[1]?['data'] as List?)
                  ?.map((e) => SessionModel.fromJson(e))
                  .toList() ??
              [];
          _completed = (resList[2]?['data'] as List?)
                  ?.map((e) => SessionModel.fromJson(e))
                  .toList() ??
              [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmSession(String sessionId) async {
    try {
      await _api.patch('/sessions/$sessionId/confirm');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session confirmed!')),
      );
      _loadSessions();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _completeSession(String sessionId) async {
    try {
      await _api.patch('/sessions/$sessionId/complete');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session completion confirmed!')),
      );
      Provider.of<AuthService>(context, listen: false).refreshProfile();
      _loadSessions();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showReviewDialog(SessionModel session) {
    int rating = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Leave a Review'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [1, 2, 3, 4, 5].map((s) {
                      return IconButton(
                        icon: Icon(
                          Icons.star,
                          color: s <= rating ? Colors.amber : Colors.grey.shade300,
                          size: 32,
                        ),
                        onPressed: () => setDialogState(() => rating = s),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: commentController,
                    maxLines: 2,
                    decoration: const InputDecoration(hintText: 'Share feedback on the session...'),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      await _api.post('/reviews', {
                        'sessionId': session.id,
                        'rating': rating,
                        'comment': commentController.text.trim(),
                      });
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Review submitted! Thank you.')),
                      );
                      _loadSessions();
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  },
                  child: const Text('Submit'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sessions Calendar'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.slate600,
          indicatorColor: AppTheme.primaryColor,
          tabs: [
            Tab(text: 'Confirmed (${_confirmed.length})'),
            Tab(text: 'Proposed (${_proposed.length})'),
            Tab(text: 'Completed (${_completed.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildSessionList(_confirmed),
                _buildSessionList(_proposed),
                _buildSessionList(_completed),
              ],
            ),
    );
  }

  Widget _buildSessionList(List<SessionModel> list) {
    final myId = Provider.of<AuthService>(context, listen: false).currentUser?.id;

    if (list.isEmpty) {
      return const Center(
        child: Text('No sessions in this category.', style: TextStyle(color: AppTheme.slate600)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadSessions,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (ctx, idx) {
          final s = list[idx];
          final isTeacher = s.teacher.id == myId;
          final partner = isTeacher ? s.learner : s.teacher;
          final userConfirmed = isTeacher ? s.teacherConfirmed : s.learnerConfirmed;

          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        s.skill.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.slate900),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryLight,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          s.mode.toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isTeacher ? 'Learner: ${partner.name}' : 'Teacher: ${partner.name}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.slate600),
                  ),
                  const SizedBox(height: 8),

                  // Time
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 14, color: AppTheme.slate600),
                      const SizedBox(width: 4),
                      Text(
                        '${s.scheduledAt.toLocal().month}/${s.scheduledAt.toLocal().day} at ${s.scheduledAt.toLocal().hour}:${s.scheduledAt.toLocal().minute.toString().padLeft(2, '0')} (${s.durationMinutes} min)',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Dual verification progress
                  if (s.status == 'confirmed') ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.slate50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Text('Teacher: ${s.teacherConfirmed ? "✓ Signed" : "Pending"}',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: s.teacherConfirmed ? AppTheme.successGreen : Colors.grey)),
                          Text('Learner: ${s.learnerConfirmed ? "✓ Signed" : "Pending"}',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: s.learnerConfirmed ? AppTheme.successGreen : Colors.grey)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Action Buttons
                  if (s.status == 'proposed')
                    CustomButton(
                      text: 'Confirm Session Time',
                      onPressed: () => _confirmSession(s.id),
                    ),

                  if (s.status == 'confirmed' && !userConfirmed)
                    CustomButton(
                      text: 'Mark as Completed (Dual-Signoff)',
                      backgroundColor: AppTheme.successGreen,
                      onPressed: () => _completeSession(s.id),
                    ),

                  if (s.status == 'completed')
                    CustomButton(
                      text: 'Leave a Review (1-5 Stars)',
                      icon: Icons.star_outline,
                      backgroundColor: AppTheme.creditAmber,
                      onPressed: () => _showReviewDialog(s),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

