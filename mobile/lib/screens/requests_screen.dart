import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../models/match_request.dart';
import '../constants/theme.dart';
import 'chat_screen.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({Key? key}) : super(key: key);

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> with SingleTickerProviderStateMixin {
  final ApiClient _api = ApiClient();
  late TabController _tabController;
  List<MatchRequestModel> _received = [];
  List<MatchRequestModel> _sent = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    setState(() => _isLoading = true);
    try {
      final resList = await Future.wait([
        _api.get('/requests?type=received'),
        _api.get('/requests?type=sent'),
      ]);

      if (mounted) {
        setState(() {
          _received = (resList[0]?['data'] as List?)
                  ?.map((e) => MatchRequestModel.fromJson(e))
                  .toList() ??
              [];
          _sent = (resList[1]?['data'] as List?)
                  ?.map((e) => MatchRequestModel.fromJson(e))
                  .toList() ??
              [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAction(String requestId, String action) async {
    try {
      await _api.patch('/requests/$requestId', {'action': action});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Request $action-ed successfully!')),
      );
      _loadRequests();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Swap Requests'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.slate600,
          indicatorColor: AppTheme.primaryColor,
          tabs: [
            Tab(text: 'Received (${_received.length})'),
            Tab(text: 'Sent (${_sent.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildRequestList(_received, isReceived: true),
                _buildRequestList(_sent, isReceived: false),
              ],
            ),
    );
  }

  Widget _buildRequestList(List<MatchRequestModel> list, {required bool isReceived}) {
    if (list.isEmpty) {
      return Center(
        child: Text(
          isReceived ? 'No received requests yet.' : 'No sent requests yet.',
          style: const TextStyle(color: AppTheme.slate600),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadRequests,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (ctx, idx) {
          final req = list[idx];
          final partner = isReceived ? req.sender : req.receiver;

          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.primaryLight,
                            child: Text(
                              partner.name.substring(0, 1).toUpperCase(),
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(partner.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              Text(partner.city ?? 'Worldwide', style: const TextStyle(fontSize: 11, color: AppTheme.slate600)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: req.status == 'accepted'
                              ? const Color(0xFFD1FAE5)
                              : req.status == 'pending'
                                  ? AppTheme.creditAmberLight
                                  : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          req.status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: req.status == 'accepted'
                                ? AppTheme.successGreen
                                : req.status == 'pending'
                                    ? const Color(0xFF92400E)
                                    : AppTheme.slate600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Swap Details
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.slate50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isReceived
                            ? 'They want to learn: ${req.skillRequested.name}'
                            : 'You want to learn: ${req.skillRequested.name}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.slate900),
                        ),
                        if (req.skillOffered != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            isReceived
                              ? 'They offer in return: ${req.skillOffered!.name}'
                              : 'You offer in return: ${req.skillOffered!.name}',
                            style: const TextStyle(fontSize: 12, color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ],
                    ),
                  ),

                  if (req.message.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      '"${req.message}"',
                      style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppTheme.slate600),
                    ),
                  ],

                  const SizedBox(height: 14),

                  // Actions
                  if (req.status == 'pending' && isReceived)
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _handleAction(req.id, 'accept'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryColor,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                            child: const Text('Accept', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _handleAction(req.id, 'decline'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.dangerRed,
                              side: const BorderSide(color: Color(0xFFFECDD3)),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                            child: const Text('Decline', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
                    ),

                  if (req.status == 'pending' && !isReceived)
                    OutlinedButton(
                      onPressed: () => _handleAction(req.id, 'cancel'),
                      child: const Text('Cancel Request'),
                    ),

                  if (req.status == 'accepted')
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ChatScreen(partnerId: partner.id, partnerName: partner.name),
                          ),
                        );
                      },
                      icon: const Icon(Icons.chat_bubble_outline, size: 16),
                      label: const Text('Open Chat'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
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

