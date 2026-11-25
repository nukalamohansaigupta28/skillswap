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
import { Skeleton, CardSkeleton } from '../components/common/Skeleton';
import {
  Compass,
  Sparkles,
  Star,
  MapPin,
  Calendar,
  Filter,
  Send,
  ArrowRightLeft,
  Coins,
  CheckCircle2,
  BookOpen,
  Info
} from 'lucide-react';

const MatchesPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [matches, setMatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myTeachSkills, setMyTeachSkills] = useState([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedMatchType, setSelectedMatchType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [requestForm, setRequestForm] = useState({
    skillRequestedId: '',
    skillOfferedId: '',
    matchType: 'MUTUAL',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's own skills for offering in requests
  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const res = await api.get('/users/me/skills');
        const teach = (res.data?.data || []).filter((s) => s.type === 'TEACH');
        setMyTeachSkills(teach);
      } catch (err) {
        console.error('Failed to load user skills:', err);
      }
    };
    fetchUserSkills();
  }, []);

  // Fetch skill categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/skills?limit=100');
        const skills = res.data?.data || [];
        const cats = Array.from(new Set(skills.map((s) => s.category))).filter(Boolean);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch ranked matches
  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedMatchType) params.append('matchType', selectedMatchType);

      const res = await api.get(`/matches?${params.toString()}`);
      if (res.data?.success) {
        setMatches(res.data.matches || res.data.data || []);
        setTotalPages(res.data.totalPages || res.data.pagination?.totalPages || 1);
        setTotalMatches(res.data.total || res.data.pagination?.total || 0);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load match suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [page, selectedCategory, selectedCity, selectedMatchType]);

  const handleOpenRequestModal = (match) => {
    setSelectedCandidate(match);

    // Auto-select candidate's first complementary skill they teach that user wants
    const candidateTeachSkills = match.complementarySkills?.candidateTeaches ||
      (match.complementarySkills?.bTeachesWhatAWants || []).map((sk) => ({ skill: sk, proficiency: 'General' }));
    const firstRequested = candidateTeachSkills[0]?.skill?._id || candidateTeachSkills[0]?._id || '';

    // Auto-select user's first skill candidate wants if mutual
    const userTeachSkills = match.complementarySkills?.userTeaches ||
      (match.complementarySkills?.aTeachesWhatBWants || []).map((sk) => ({ skill: sk, proficiency: 'General' }));
    const firstOffered = userTeachSkills[0]?.skill?._id || userTeachSkills[0]?._id || (myTeachSkills[0]?.skill?._id || '');

    const initialType = match.matchType === 'MUTUAL' ? 'MUTUAL' : 'ONE_WAY_CREDIT';
    const partner = match.user || match.candidate || {};

    setRequestForm({
      skillRequestedId: firstRequested,
      skillOfferedId: initialType === 'MUTUAL' ? firstOffered : '',
      matchType: initialType,
      message: `Hi ${partner.name || 'Partner'}, I found your profile on Skill-Swap and would love to exchange skills with you!`
    });
    setIsModalOpen(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.skillRequestedId) {
      toastError('Please choose the skill you want to learn.');
      return;
    }
    if (requestForm.matchType === 'MUTUAL' && !requestForm.skillOfferedId) {
      toastError('Please choose the skill you are offering to teach for a mutual swap.');
      return;
    }

    const partner = selectedCandidate?.user || selectedCandidate?.candidate || {};
    if (!partner._id) {
      toastError('Partner information is missing.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/requests', {
        receiverId: partner._id,
        skillRequestedId: requestForm.skillRequestedId,
        skillOfferedId: requestForm.matchType === 'MUTUAL' ? requestForm.skillOfferedId : undefined,
        matchType: requestForm.matchType,
        message: requestForm.message
      });

      success(`Swap request sent to ${partner.name || 'Partner'}!`);
      setIsModalOpen(false);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to send swap request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Skill-Swap Recommendations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Algorithmic matches ranked by mutual skill complementarity, location, and rating.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Badge variant="credit" size="lg">
            ⚡ {user?.creditBalance ?? 0} Credits Available
          </Badge>
          <span className="text-slate-400">|</span>
          <span>{totalMatches} potential partners found</span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="p-4" className="bg-white">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 min-w-max">
            <Filter className="w-4 h-4 text-slate-400" />
            Filter Matches:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Match Type Filter */}
            <select
              value={selectedMatchType}
              onChange={(e) => {
                setSelectedMatchType(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">All Match Types</option>
              <option value="MUTUAL">Mutual Swaps Only (Top Score)</option>
              <option value="ONE_WAY">Credit-Based Learning (One-Way)</option>
            </select>

            {/* City Search */}
            <input
              type="text"
              placeholder="Filter by City (e.g. New York)"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : matches.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Matches Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your category or city filters, or list more skills you want to LEARN and TEACH in your profile!
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSelectedCity('');
                setSelectedMatchType('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((item, idx) => {
            const candidate = item.user || item.candidate || {};
            const isMutual = item.matchType === 'MUTUAL';
            const breakdown = item.scoreBreakdown || {};
            const explanationText = typeof item.explanation === 'string'
              ? item.explanation
              : (item.explanation?.summary || 'Complementary skills fit');
            const candidateTeachList = item.complementarySkills?.candidateTeaches ||
              (item.complementarySkills?.bTeachesWhatAWants || []).map((sk) => ({
                skill: sk,
                proficiency: 'General'
              }));
            const candidateKey = candidate._id || `match-${idx}`;

            return (
              <Card
                key={candidateKey}
                hover
                className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group"
              >
                {/* Top Match Score Pill Banner */}
                <div
                  className={`-mx-6 -mt-6 px-6 py-2.5 mb-4 flex items-center justify-between border-b ${
                    isMutual
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/60 border-indigo-200/80 text-indigo-900'
                      : 'bg-gradient-to-r from-amber-50 to-amber-100/60 border-amber-200/80 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isMutual ? (
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{isMutual ? 'Mutual Swap' : 'Credit Learning'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 font-medium">Match:</span>
                    <span className="text-sm font-black tracking-tight">{item.score}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Candidate Profile Info */}
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      src={candidate.photoUrl}
                      name={candidate.name || 'User'}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">
                        {candidate.name || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {candidate.location?.city || 'Worldwide'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {candidate.ratingAverage > 0
                            ? candidate.ratingAverage.toFixed(1)
                            : 'New'}
                          <span className="text-slate-400 font-normal">
                            ({candidate.ratingCount || 0})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {candidate.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{candidate.bio}"
                    </p>
                  )}

                  {/* Algorithmic Explanation Text */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-snug">
                    <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Why it's a match:
                    </p>
                    <p className="text-[11px] text-slate-600">{explanationText}</p>
                  </div>

                  {/* Scoring Bonus Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {breakdown.locationBonus > 0 && (
                      <Badge variant="primary" size="sm">
                        📍 Same City (+{breakdown.locationBonus})
                      </Badge>
                    )}
                    {breakdown.availabilityBonus > 0 && (
                      <Badge variant="success" size="sm">
                        🕒 Schedule Match (+{breakdown.availabilityBonus})
                      </Badge>
                    )}
                    {breakdown.ratingBonus > 0 && (
                      <Badge variant="credit" size="sm">
                        ⭐ Top Rated (+{breakdown.ratingBonus})
                      </Badge>
                    )}
                    {breakdown.proficiencyBonus > 0 && (
                      <Badge variant="info" size="sm">
                        🎓 Proficiency Fit (+{breakdown.proficiencyBonus})
                      </Badge>
                    )}
                  </div>

                  {/* Skills Candidate Can Teach */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      They Can Teach:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidateTeachList.map((sk, skIdx) => {
                        const skName = sk.skill?.name || sk.name || 'Skill';
                        const skKey = sk.skill?._id || sk._id || `sk-${skIdx}`;
                        return (
                          <span
                            key={skKey}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3 text-indigo-600" />
                            {skName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Send Request Action Button */}
                <div className="pt-5 mt-4 border-t border-slate-100">
                  <Button
                    variant={isMutual ? 'primary' : 'credit'}
                    size="sm"
                    className="w-full shadow-xs"
                    icon={Send}
                    onClick={() => handleOpenRequestModal(item)}
                  >
                    {isMutual ? 'Send Mutual Swap Request' : 'Propose Credit Swap'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-slate-600 px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Send Swap Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Request Skill Swap with ${selectedCandidate?.user?.name || 'Partner'}`}
        subtitle="Propose which skills to exchange or spend 1 skill-credit per hour."
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          {/* Match Type Radio / Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Exchange Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestForm((prev) => ({ ...prev, matchType: 'MUTUAL' }))}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  requestForm.matchType === 'MUTUAL'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200 font-semibold text-indigo-950'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  Mutual Swap
                </div>
                <p className="text-[11px] text-slate-500">
                  Teach them a skill in return. Zero credits spent.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRequestForm((prev) => ({ ...prev, matchType: 'ONE_WAY_CREDIT' }))}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  requestForm.matchType === 'ONE_WAY_CREDIT'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200 font-semibold text-amber-950'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Coins className="w-4 h-4 text-amber-600" />
                  Credit-Based
                </div>
                <p className="text-[11px] text-slate-500">
                  Learn from them. Costs 1 credit per hour taught.
                </p>
              </button>
            </div>
          </div>

          {/* Skill Requested Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Skill You Want to Learn (They Teach) *
            </label>
            <select
              required
              value={requestForm.skillRequestedId}
              onChange={(e) => setRequestForm({ ...requestForm, skillRequestedId: e.target.value })}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">Select a skill...</option>
              {((selectedCandidate?.complementarySkills?.candidateTeaches) ||
                (selectedCandidate?.complementarySkills?.bTeachesWhatAWants || []).map((sk) => ({ skill: sk, proficiency: 'General' }))).map((s, idx) => {
                const skId = s.skill?._id || s._id || `cand-sk-${idx}`;
                const skName = s.skill?.name || s.name || 'Skill';
                const prof = s.proficiency || 'General';
                return (
                  <option key={skId} value={skId}>
                    {skName} ({prof})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Skill Offered Selection (if Mutual) */}
          {requestForm.matchType === 'MUTUAL' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Skill You Will Teach in Return *
              </label>
              {myTeachSkills.length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  You have not listed any TEACH skills yet. Please add skills to your profile or switch to Credit-Based.
                </div>
              ) : (
                <select
                  required
                  value={requestForm.skillOfferedId}
                  onChange={(e) => setRequestForm({ ...requestForm, skillOfferedId: e.target.value })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="">Select a skill you teach...</option>
                  {myTeachSkills.map((s) => (
                    <option key={s.skill?._id} value={s.skill?._id}>
                      {s.skill?.name} ({s.proficiency})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Introductory Message */}
          <Input
            label="Personal Introduction / Swap Note"
            rows={3}
            placeholder="Introduce yourself, share your learning goals or preferred days..."
            value={requestForm.message}
            onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              icon={Send}
            >
              Send Swap Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MatchesPage;
