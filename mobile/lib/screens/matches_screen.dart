import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../models/match.dart';
import '../models/skill.dart';
import '../constants/theme.dart';
import '../widgets/custom_button.dart';

class MatchesScreen extends StatefulWidget {
  const MatchesScreen({Key? key}) : super(key: key);

  @override
  State<MatchesScreen> createState() => _MatchesScreenState();
}

class _MatchesScreenState extends State<MatchesScreen> {
  final ApiClient _api = ApiClient();
  List<MatchModel> _matches = [];
  List<UserSkillModel> _myTeachSkills = [];
  bool _isLoading = true;
  String _matchTypeFilter = '';

  @override
  void initState() {
    super.initState();
    _loadMatches();
    _loadMySkills();
  }

  Future<void> _loadMySkills() async {
    try {
      final res = await _api.get('/users/me/skills');
      if (res != null && res['data'] is List) {
        final list = (res['data'] as List)
            .map((e) => UserSkillModel.fromJson(e))
            .where((s) => s.type == 'TEACH')
            .toList();
        setState(() => _myTeachSkills = list);
      }
    } catch (_) {}
  }

  Future<void> _loadMatches() async {
    setState(() => _isLoading = true);
    try {
      final query = <String, String>{'limit': '20'};
      if (_matchTypeFilter.isNotEmpty) query['matchType'] = _matchTypeFilter;

      final res = await _api.get('/matches', queryParams: query);
      if (res != null && res['data'] is List) {
        final list = (res['data'] as List).map((e) => MatchModel.fromJson(e)).toList();
        setState(() {
          _matches = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load matches: $e')),
        );
      }
    }
  }

  void _showRequestDialog(MatchModel match) {
    String? selectedRequestedId = match.candidateTeaches.isNotEmpty
        ? match.candidateTeaches.first.skill.id
        : null;
    String? selectedOfferedId = _myTeachSkills.isNotEmpty
        ? _myTeachSkills.first.skill.id
        : null;
    String matchType = match.matchType == 'MUTUAL' ? 'MUTUAL' : 'ONE_WAY_CREDIT';
    final messageController = TextEditingController(
      text: 'Hi ${match.user.name}, I would love to exchange skills with you on Skill-Swap!',
    );
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Swap Request with ${match.user.name}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.slate900,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Skill to learn
                    const Text('SKILL YOU WANT TO LEARN *',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.slate600)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: selectedRequestedId,
                      items: match.candidateTeaches.map((s) {
                        return DropdownMenuItem(
                          value: s.skill.id,
                          child: Text('${s.skill.name} (${s.proficiency})'),
                        );
                      }).toList(),
                      onChanged: (val) => setModalState(() => selectedRequestedId = val),
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10)),
                    ),

                    const SizedBox(height: 14),

                    // Skill to teach if mutual
                    if (matchType == 'MUTUAL') ...[
                      const Text('SKILL YOU WILL TEACH IN RETURN *',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.slate600)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: selectedOfferedId,
                        items: _myTeachSkills.map((s) {
                          return DropdownMenuItem(
                            value: s.skill.id,
                            child: Text('${s.skill.name} (${s.proficiency})'),
                          );
                        }).toList(),
                        onChanged: (val) => setModalState(() => selectedOfferedId = val),
                        decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10)),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Note
                    TextField(
                      controller: messageController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Personal Introduction Note',
                      ),
                    ),

                    const SizedBox(height: 20),

                    CustomButton(
                      text: 'Send Swap Request',
                      isLoading: isSubmitting,
                      onPressed: () async {
                        if (selectedRequestedId == null) return;
                        setModalState(() => isSubmitting = true);
                        try {
                          await _api.post('/requests', {
                            'receiverId': match.user.id,
                            'skillRequestedId': selectedRequestedId,
                            if (matchType == 'MUTUAL') 'skillOfferedId': selectedOfferedId,
                            'matchType': matchType,
                            'message': messageController.text.trim(),
                          });
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Swap request sent to ${match.user.name}!')),
                          );
                        } catch (err) {
                          setModalState(() => isSubmitting = false);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $err')),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
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
        title: const Text('Find Matches'),
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: Row(
              children: [
                _buildFilterChip('All Matches', ''),
                const SizedBox(width: 8),
                _buildFilterChip('Mutual Swaps', 'MUTUAL'),
                const SizedBox(width: 8),
                _buildFilterChip('Credit Learning', 'ONE_WAY'),
              ],
            ),
          ),

          // Matches List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _matches.isEmpty
                    ? Center(
                        child: Text(
                          'No matches found for this filter.',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadMatches,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _matches.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 14),
                          itemBuilder: (ctx, idx) {
                            final match = _matches[idx];
                            final isMutual = match.matchType == 'MUTUAL';

                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Header Score Tag
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isMutual ? AppTheme.primaryLight : AppTheme.creditAmberLight,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            isMutual ? '⇄ Mutual Swap' : '⚡ Credit Learning',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: isMutual ? AppTheme.primaryColor : const Color(0xFF92400E),
                                            ),
                                          ),
                                        ),
                                        Text(
                                          '${match.score}% Score',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                            color: AppTheme.slate900,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // User Info
                                    Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 20,
                                          backgroundColor: AppTheme.primaryLight,
                                          child: Text(
                                            match.user.name.substring(0, 1).toUpperCase(),
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                match.user.name,
                                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.slate900),
                                              ),
                                              Row(
                                                children: [
                                                  Text(match.user.city ?? 'Worldwide', style: const TextStyle(fontSize: 11, color: AppTheme.slate600)),
                                                  const SizedBox(width: 6),
                                                  const Icon(Icons.star, size: 12, color: Colors.amber),
                                                  Text(' ${match.user.ratingAverage.toStringAsFixed(1)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 10),

                                    // Explanation
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppTheme.slate50,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        match.explanation,
                                        style: const TextStyle(fontSize: 11, color: AppTheme.slate600),
                                      ),
                                    ),

                                    const SizedBox(height: 12),

                                    // Teaches tags
                                    Wrap(
                                      spacing: 6,
                                      runSpacing: 6,
                                      children: match.candidateTeaches.map((t) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'Teaches: ${t.skill.name}',
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.slate900),
                                          ),
                                        );
                                      }).toList(),
                                    ),

                                    const SizedBox(height: 14),

                                    CustomButton(
                                      text: isMutual ? 'Send Mutual Request' : 'Propose Credit Swap',
                                      backgroundColor: isMutual ? AppTheme.primaryColor : AppTheme.creditAmber,
                                      onPressed: () => _showRequestDialog(match),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _matchTypeFilter == value;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : AppTheme.slate900)),
      selected: isSelected,
      selectedColor: AppTheme.primaryColor,
      backgroundColor: const Color(0xFFF1F5F9),
      onSelected: (_) {
        setState(() => _matchTypeFilter = value);
        _loadMatches();
      },
    );
  }
}

