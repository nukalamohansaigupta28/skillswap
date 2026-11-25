import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  User,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Star,
  Sparkles,
  CheckCircle2,
  Save,
  MessageSquare
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'profile' | 'reviews'

  // User Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    city: user?.location?.city || '',
    availabilityDays: user?.availability?.map((a) => a.day) || ['Monday', 'Wednesday', 'Saturday'],
    availabilitySlots: ['Morning', 'Evening']
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // User Skills State
  const [skills, setSkills] = useState({ teach: [], learn: [] });
  const [catalogSkills, setCatalogSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  // Add Skill Modal State
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [addSkillForm, setAddSkillForm] = useState({
    skillId: '',
    type: 'TEACH', // 'TEACH' | 'LEARN'
    proficiency: 'Intermediate',
    description: ''
  });
  const [isSubmittingSkill, setIsSubmittingSkill] = useState(false);

  // Propose New Skill Modal State
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    name: '',
    category: 'Coding',
    description: ''
  });
  const [isSubmittingPropose, setIsSubmittingPropose] = useState(false);

  // Sync profileForm when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        bio: user.bio || '',
        city: user.location?.city || '',
        availabilityDays: user.availability?.map((a) => a.day) || ['Monday', 'Wednesday', 'Saturday'],
        availabilitySlots: ['Morning', 'Evening']
      });
    }
  }, [user]);

  // Load User Skills & Catalog
  const loadSkillsData = async () => {
    setIsLoadingSkills(true);
    try {
      const [userSkillsRes, catalogRes] = await Promise.all([
        api.get('/users/me/skills'),
        api.get('/skills?limit=100')
      ]);

      const userSkills = userSkillsRes.data?.data || [];
      setSkills({
        teach: userSkills.filter((s) => s.type === 'TEACH'),
        learn: userSkills.filter((s) => s.type === 'LEARN')
      });
      setCatalogSkills(catalogRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Load User Reviews
  const loadReviewsData = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/users/${user._id}/reviews`);
      if (res.data?.success) {
        setReviews(Array.isArray(res.data.data) ? res.data.data : (res.data.data?.reviews || []));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  useEffect(() => {
    loadSkillsData();
    loadReviewsData();
  }, [user?._id]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        bio: profileForm.bio.trim(),
        location: {
          city: profileForm.city.trim()
        },
        availability: profileForm.availabilityDays.map((day) => ({
          day,
          timeSlots: profileForm.availabilitySlots
        }))
      };

      const res = await api.put('/users/me', payload);
      if (res.data?.success) {
        updateUser(res.data.data);
        success('Profile and availability settings updated!');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Skill Submit
  const handleAddSkillSubmit = async (e) => {
    e.preventDefault();
    if (!addSkillForm.skillId) {
      toastError('Please choose a skill from the catalog.');
      return;
    }

    setIsSubmittingSkill(true);
    try {
      await api.post('/users/me/skills', {
        skillId: addSkillForm.skillId,
        type: addSkillForm.type,
        proficiency: addSkillForm.proficiency,
        description: addSkillForm.description
      });

      success(`Added skill to your ${addSkillForm.type} portfolio!`);
      setIsAddSkillOpen(false);
      setAddSkillForm({
        skillId: '',
        type: 'TEACH',
        proficiency: 'Intermediate',
        description: ''
      });
      loadSkillsData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add user skill');
    } finally {
      setIsSubmittingSkill(false);
    }
  };

  // Handle Delete Skill
  const handleDeleteSkill = async (userSkillId, skillName) => {
    if (!window.confirm(`Are you sure you want to remove "${skillName}" from your portfolio?`)) {
      return;
    }
    try {
      await api.delete(`/users/me/skills/${userSkillId}`);
      success(`Removed "${skillName}".`);
      loadSkillsData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete skill');
    }
  };

  // Handle Propose New Custom Skill
  const handleProposeSkillSubmit = async (e) => {
    e.preventDefault();
    if (!proposeForm.name.trim()) {
      toastError('Skill name is required.');
      return;
    }

    setIsSubmittingPropose(true);
    try {
      await api.post('/skills', {
        name: proposeForm.name.trim(),
        category: proposeForm.category,
        description: proposeForm.description.trim()
      });

      success('Skill suggested! It has been submitted for admin approval.');
      setIsProposeOpen(false);
      setProposeForm({ name: '', category: 'Coding', description: '' });
      loadSkillsData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to suggest skill');
    } finally {
      setIsSubmittingPropose(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlotsList = ['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-9pm)'];

  const toggleDay = (day) => {
    setProfileForm((prev) => {
      const exists = prev.availabilityDays.includes(day);
      const updated = exists
        ? prev.availabilityDays.filter((d) => d !== day)
        : [...prev.availabilityDays, day];
      return { ...prev, availabilityDays: updated };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.photoUrl}
            name={user?.name || 'User'}
            size="xl"
            className="ring-4 ring-white/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.name}
              </h1>
              <Badge variant="credit" size="sm">
                ⚡ {user?.creditBalance ?? 0} Credits
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                {user?.location?.city || 'Location unlisted'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {user?.ratingAverage > 0 ? user.ratingAverage.toFixed(1) : 'New Member'} ({user?.ratingCount || 0} reviews)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddSkillOpen(true)}
          >
            Add New Skill
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'skills'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Skills Portfolio ({skills.teach.length} Teach / {skills.learn.length} Learn)</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-slate-500" />
          <span>Edit Profile & Availability</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'reviews'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>My Reviews ({reviews.length})</span>
        </button>
      </div>

      {/* TAB 1: SKILLS PORTFOLIO */}
      {activeTab === 'skills' && (
        <div className="space-y-8">
          {/* TEACH SKILLS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  Skills I Can TEACH ({skills.teach.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Other users can request to learn these skills from you in exchange for credits or mutual teaching.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setAddSkillForm((prev) => ({ ...prev, type: 'TEACH' }));
                  setIsAddSkillOpen(true);
                }}
              >
                Add Teaching Skill
              </Button>
            </div>

            {skills.teach.length === 0 ? (
              <Card className="text-center py-10 bg-slate-50/50 border-dashed border-slate-300">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No teaching skills listed yet.</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  Adding skills you excel at is essential for appearing in peer searches and earning credits.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.teach.map((item) => (
                  <Card key={item._id} className="relative p-5 border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {item.skill?.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {item.skill?.category}
                        </span>
                      </div>
                      <Badge variant="primary" size="sm">
                        {item.proficiency}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                        "{item.description}"
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-indigo-600 font-semibold text-[11px]">
                        +1 Credit / Hour Taught
                      </span>
                      <button
                        onClick={() => handleDeleteSkill(item._id, item.skill?.name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* LEARN SKILLS */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  Skills I Want to LEARN ({skills.learn.length})
                </h2>
                <p className="text-xs text-slate-500">
                  The matching engine ranks peers who teach these skills highest in your recommendations.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setAddSkillForm((prev) => ({ ...prev, type: 'LEARN' }));
                  setIsAddSkillOpen(true);
                }}
              >
                Add Learning Goal
              </Button>
            </div>

            {skills.learn.length === 0 ? (
              <Card className="text-center py-10 bg-slate-50/50 border-dashed border-slate-300">
                <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No learning goals listed yet.</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  Tell us what you want to master so we can pair you with expert mentors.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.learn.map((item) => (
                  <Card key={item._id} className="relative p-5 border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {item.skill?.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {item.skill?.category}
                        </span>
                      </div>
                      <Badge variant="warning" size="sm">
                        Desired: {item.proficiency}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                        "{item.description}"
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-amber-700 font-semibold text-[11px]">
                        Target Learning Goal
                      </span>
                      <button
                        onClick={() => handleDeleteSkill(item._id, item.skill?.name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Propose Custom Skill Callout */}
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Can't find a skill in the catalog?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Suggest custom skills to our platform directory. Once approved by admins, anyone can teach or learn it.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsProposeOpen(true)}
            >
              Suggest Custom Skill
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE & AVAILABILITY */}
      {activeTab === 'profile' && (
        <Card className="max-w-3xl">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your city and bio are publicly displayed to potential swap partners.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />

              <Input
                label="City / Location"
                placeholder="e.g. San Francisco, New York, London"
                icon={MapPin}
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                helperText="Boosts your matching algorithm score for nearby swap candidates"
                required
              />

              <Input
                label="Personal Bio & Learning Vision"
                rows={4}
                placeholder="Share a short introduction about your hobbies, passions, or background..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>

            {/* Availability Days */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Available Days for Skill Swapping
              </h4>
              <p className="text-xs text-slate-500">
                Overlapping days with other members grant a +15 bonus in the matching engine.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {daysOfWeek.map((day) => {
                  const isChecked = profileForm.availabilityDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {day} {isChecked && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingProfile}
                icon={Save}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: COMMUNITY REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Verified Reviews & Ratings</h2>
              <p className="text-xs text-slate-500">
                Submitted by peers upon completion of mutual or credit-based learning sessions.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-base font-extrabold text-amber-900">
                {user?.ratingAverage > 0 ? user.ratingAverage.toFixed(1) : '5.0'}
              </span>
              <span className="text-xs text-amber-700">({reviews.length} reviews)</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <Card className="text-center py-16 space-y-3">
              <Star className="w-10 h-10 text-amber-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No reviews yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you complete your first learning session, your partner will be invited to leave a verified rating.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <Card key={rev._id} className="p-5 space-y-3 border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={rev.reviewer?.photoUrl}
                        name={rev.reviewer?.name || 'Peer'}
                        size="sm"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {rev.reviewer?.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Skill to Portfolio Modal */}
      <Modal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        title="Add Skill to Portfolio"
        subtitle="List what you can teach or what you want to learn."
      >
        <form onSubmit={handleAddSkillSubmit} className="space-y-4">
          {/* Type Selector (TEACH or LEARN) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Portfolio Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAddSkillForm({ ...addSkillForm, type: 'TEACH' })}
                className={`p-3 rounded-xl border text-xs font-bold ${
                  addSkillForm.type === 'TEACH'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                🎓 I Can TEACH This
              </button>
              <button
                type="button"
                onClick={() => setAddSkillForm({ ...addSkillForm, type: 'LEARN' })}
                className={`p-3 rounded-xl border text-xs font-bold ${
                  addSkillForm.type === 'LEARN'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                📖 I Want to LEARN This
              </button>
            </div>
          </div>

          {/* Select Catalog Skill */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Choose Skill from Catalog *
            </label>
            <select
              required
              value={addSkillForm.skillId}
              onChange={(e) => setAddSkillForm({ ...addSkillForm, skillId: e.target.value })}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">Select a skill...</option>
              {catalogSkills.map((sk) => (
                <option key={sk._id} value={sk._id}>
                  {sk.name} ({sk.category})
                </option>
              ))}
            </select>
          </div>

          {/* Proficiency */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Proficiency Level *
            </label>
            <select
              value={addSkillForm.proficiency}
              onChange={(e) => setAddSkillForm({ ...addSkillForm, proficiency: e.target.value })}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="Beginner">Beginner (Foundations & Basics)</option>
              <option value="Intermediate">Intermediate (Practical Application)</option>
              <option value="Expert">Expert (Advanced Mastery & Mentorship)</option>
            </select>
          </div>

          {/* Description */}
          <Input
            label="Specific Focus or Notes (Optional)"
            rows={2}
            placeholder="e.g. Specializing in React, Tailwind, and REST APIs..."
            value={addSkillForm.description}
            onChange={(e) => setAddSkillForm({ ...addSkillForm, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsAddSkillOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingSkill}
            >
              Add to Portfolio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Propose New Custom Skill Modal */}
      <Modal
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        title="Suggest a Custom Skill"
        subtitle="Submit a new skill to be reviewed and approved by administrators."
      >
        <form onSubmit={handleProposeSkillSubmit} className="space-y-4">
          <Input
            label="Skill Name *"
            placeholder="e.g. 3D Modeling with Blender"
            value={proposeForm.name}
            onChange={(e) => setProposeForm({ ...proposeForm, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Category *
            </label>
            <select
              value={proposeForm.category}
              onChange={(e) => setProposeForm({ ...proposeForm, category: e.target.value })}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="Coding">Coding & Tech</option>
              <option value="Languages">Languages</option>
              <option value="Music">Music & Instruments</option>
              <option value="Cooking">Cooking & Culinary</option>
              <option value="Sports">Sports & Fitness</option>
              <option value="Art">Art & Design</option>
              <option value="Academics">Academics & Science</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Description (Optional)"
            rows={2}
            placeholder="Briefly describe what this skill encompasses..."
            value={proposeForm.description}
            onChange={(e) => setProposeForm({ ...proposeForm, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsProposeOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingPropose}
            >
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
