import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';
import '../models/skill.dart';
import '../constants/theme.dart';
import '../widgets/custom_button.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiClient _api = ApiClient();
  List<UserSkillModel> _teachSkills = [];
  List<UserSkillModel> _learnSkills = [];
  List<SkillModel> _catalogSkills = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSkills();
  }

  Future<void> _loadSkills() async {
    setState(() => _isLoading = true);
    try {
      final resList = await Future.wait([
        _api.get('/users/me/skills'),
        _api.get('/skills?limit=100'),
      ]);

      if (mounted) {
        final userSkills = (resList[0]?['data'] as List?)
                ?.map((e) => UserSkillModel.fromJson(e))
                .toList() ??
            [];
        final catalog = (resList[1]?['data'] as List?)
                ?.map((e) => SkillModel.fromJson(e))
                .toList() ??
            [];

        setState(() {
          _teachSkills = userSkills.where((s) => s.type == 'TEACH').toList();
          _learnSkills = userSkills.where((s) => s.type == 'LEARN').toList();
          _catalogSkills = catalog;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteSkill(String id, String name) async {
    try {
      await _api.delete('/users/me/skills/$id');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Removed $name')),
      );
      _loadSkills();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showAddSkillDialog(String type) {
    String? selectedSkillId = _catalogSkills.isNotEmpty ? _catalogSkills.first.id : null;
    String proficiency = 'Intermediate';
    final descController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                type == 'TEACH' ? 'Add Teaching Skill' : 'Add Learning Goal',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedSkillId,
                items: _catalogSkills.map((s) {
                  return DropdownMenuItem(value: s.id, child: Text(s.name));
                }).toList(),
                onChanged: (val) => selectedSkillId = val,
                decoration: const InputDecoration(labelText: 'Select Catalog Skill'),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                value: proficiency,
                items: const [
                  DropdownMenuItem(value: 'Beginner', child: Text('Beginner')),
                  DropdownMenuItem(value: 'Intermediate', child: Text('Intermediate')),
                  DropdownMenuItem(value: 'Expert', child: Text('Expert')),
                ],
                onChanged: (val) => proficiency = val ?? 'Intermediate',
                decoration: const InputDecoration(labelText: 'Proficiency Level'),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'Focus or Notes (Optional)'),
              ),
              const SizedBox(height: 20),
              CustomButton(
                text: 'Add to Portfolio',
                onPressed: () async {
                  if (selectedSkillId == null) return;
                  try {
                    await _api.post('/users/me/skills', {
                      'skillId': selectedSkillId,
                      'type': type,
                      'proficiency': proficiency,
                      'description': descController.text.trim(),
                    });
                    Navigator.pop(ctx);
                    _loadSkills();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile & Skills')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadSkills,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Profile Header Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: AppTheme.primaryLight,
                            child: Text(
                              user?.name.substring(0, 1).toUpperCase() ?? 'U',
                              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(user?.name ?? 'Member', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                Text(user?.email ?? '', style: const TextStyle(fontSize: 12, color: AppTheme.slate600)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on, size: 12, color: AppTheme.slate600),
                                    Text(' ${user?.city ?? "Worldwide"}', style: const TextStyle(fontSize: 11)),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.star, size: 12, color: Colors.amber),
                                    Text(' ${user?.ratingAverage.toStringAsFixed(1) ?? "5.0"} (${user?.ratingCount ?? 0})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // TEACH Skills
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Skills I Can TEACH', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        TextButton.icon(
                          onPressed: () => _showAddSkillDialog('TEACH'),
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Add'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_teachSkills.isEmpty)
                      const Text('No teaching skills listed yet.', style: TextStyle(color: AppTheme.slate600, fontSize: 12))
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _teachSkills.map((s) {
                          return Chip(
                            backgroundColor: AppTheme.primaryLight,
                            label: Text('${s.skill.name} (${s.proficiency})', style: const TextStyle(fontSize: 12, color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
                            deleteIcon: const Icon(Icons.close, size: 14, color: AppTheme.primaryColor),
                            onDeleted: () => _deleteSkill(s.id, s.skill.name),
                          );
                        }).toList(),
                      ),

                    const SizedBox(height: 24),

                    // LEARN Skills
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Skills I Want to LEARN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        TextButton.icon(
                          onPressed: () => _showAddSkillDialog('LEARN'),
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Add'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_learnSkills.isEmpty)
                      const Text('No learning goals listed yet.', style: TextStyle(color: AppTheme.slate600, fontSize: 12))
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _learnSkills.map((s) {
                          return Chip(
                            backgroundColor: AppTheme.creditAmberLight,
                            label: Text('${s.skill.name} (${s.proficiency})', style: const TextStyle(fontSize: 12, color: Color(0xFF92400E), fontWeight: FontWeight.bold)),
                            deleteIcon: const Icon(Icons.close, size: 14, color: Color(0xFF92400E)),
                            onDeleted: () => _deleteSkill(s.id, s.skill.name),
                          );
                        }).toList(),
                      ),

                    const SizedBox(height: 36),

                    // Log out Button
                    OutlinedButton.icon(
                      onPressed: () async {
                        await auth.logout();
                        if (!mounted) return;
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                          (route) => false,
                        );
                      },
                      icon: const Icon(Icons.logout, size: 18, color: AppTheme.dangerRed),
                      label: const Text('Log Out', style: TextStyle(color: AppTheme.dangerRed)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFFECDD3)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

