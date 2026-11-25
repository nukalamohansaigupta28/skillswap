import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Star,
  ExternalLink,
  Coins,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const SessionsPage = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('confirmed'); // 'confirmed' | 'proposed' | 'completed' | 'cancelled'
  const [sessions, setSessions] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Propose Modal State
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    matchRequestId: searchParams.get('requestId') || '',
    skillId: '',
    scheduledAt: '',
    durationMinutes: 60,
    mode: 'online',
    meetingLink: 'https://meet.google.com/',
    locationAddress: ''
  });
  const [isSubmittingPropose, setIsSubmittingPropose] = useState(false);

  // Reschedule Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleTargetSession, setRescheduleTargetSession] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewTargetSession, setReviewTargetSession] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch accepted match requests for proposing sessions
  useEffect(() => {
    const fetchAccepted = async () => {
      try {
        const [receivedRes, sentRes] = await Promise.all([
          api.get('/requests?type=received&status=accepted'),
          api.get('/requests?type=sent&status=accepted')
        ]);
        const list = [
          ...(receivedRes.data?.data || []),
          ...(sentRes.data?.data || [])
        ];
        setAcceptedRequests(list);

        // Auto open propose if requestId in query
        const reqIdParam = searchParams.get('requestId');
        if (reqIdParam && list.some((r) => r._id === reqIdParam)) {
          setProposeForm((prev) => ({ ...prev, matchRequestId: reqIdParam }));
          setIsProposeOpen(true);
        }
      } catch (err) {
        console.error('Failed to load accepted requests:', err);
      }
    };
    fetchAccepted();
  }, [searchParams]);

  // Fetch sessions for active tab
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/sessions?status=${activeTab}&limit=50`);
      if (res.data?.success) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  // Handle Propose Submit
  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!proposeForm.matchRequestId) {
      toastError('Please select an accepted match partner.');
      return;
    }
    if (!proposeForm.scheduledAt) {
      toastError('Please choose a session date and time.');
      return;
    }

    setIsSubmittingPropose(true);
    try {
      await api.post('/sessions', {
        matchRequestId: proposeForm.matchRequestId,
        skillId: proposeForm.skillId || undefined,
        scheduledAt: new Date(proposeForm.scheduledAt).toISOString(),
        durationMinutes: Number(proposeForm.durationMinutes),
        mode: proposeForm.mode,
        meetingLink: proposeForm.mode === 'online' ? proposeForm.meetingLink : '',
        locationAddress: proposeForm.mode === 'offline' ? proposeForm.locationAddress : ''
      });

      success('Session proposed successfully! Waiting for the other party to confirm.');
      setIsProposeOpen(false);
      setActiveTab('proposed');
      fetchSessions();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to propose session');
    } finally {
      setIsSubmittingPropose(false);
    }
  };

  // Confirm Proposed Session
  const handleConfirm = async (sessionId) => {
    setActionInProgress(sessionId);
    try {
      await api.patch(`/sessions/${sessionId}/confirm`);
      success('Session confirmed! It is now scheduled on your calendar.');
      fetchSessions();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to confirm session');
    } finally {
      setActionInProgress(null);
    }
  };

  // Reschedule Submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) {
      toastError('Please select a new date and time.');
      return;
    }

    setIsSubmittingReschedule(true);
    try {
      await api.patch(`/sessions/${rescheduleTargetSession._id}/reschedule`, {
        scheduledAt: new Date(rescheduleDate).toISOString()
      });
      success('Reschedule proposed! Waiting for confirmation.');
      setIsRescheduleOpen(false);
      fetchSessions();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Cancel Session
  const handleCancel = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session? Zero credits will be moved.')) {
      return;
    }
    setActionInProgress(sessionId);
    try {
      await api.patch(`/sessions/${sessionId}/cancel`, { reason: 'User requested cancellation' });
      success('Session cancelled safely. Credits remain intact.');
      fetchSessions();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel session');
    } finally {
      setActionInProgress(null);
    }
  };

  // Mark Completed Dual-Signoff
  const handleComplete = async (sessionId) => {
    setActionInProgress(sessionId);
    try {
      const res = await api.patch(`/sessions/${sessionId}/complete`);
      success('Session completion verified!');
      refreshUser(); // update credit balance
      fetchSessions();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to complete session');
    } finally {
      setActionInProgress(null);
    }
  };

  // Submit Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        sessionId: reviewTargetSession._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      success('Review submitted! Thank you for fostering a trusted community.');
      setIsReviewOpen(false);
      fetchSessions();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Skill Sessions & Calendar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Propose dates, meet online or in person, and dual-verify completions for atomic credit transfer.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsProposeOpen(true)}
        >
          Propose New Session
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'confirmed'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Upcoming & Confirmed</span>
        </button>

        <button
          onClick={() => setActiveTab('proposed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'proposed'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Proposals</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'completed'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Completed Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'cancelled'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-4 h-4 text-slate-400" />
          <span>Cancelled</span>
        </button>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No {activeTab} sessions
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'confirmed'
              ? 'You have no confirmed sessions on the calendar. Propose a time with your accepted swap partners!'
              : `There are currently no sessions in "${activeTab}" status.`}
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsProposeOpen(true)}
            >
              Propose a Session
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isTeacher = session.teacher?._id === user?._id;
            const isLearner = session.learner?._id === user?._id;
            const partner = isTeacher ? session.learner : session.teacher;
            const isProposer = session.proposedBy === user?._id;
            const isProcessing = actionInProgress === session._id;

            const teacherConfirmed = session.completionConfirmation?.teacherConfirmed;
            const learnerConfirmed = session.completionConfirmation?.learnerConfirmed;
            const bothConfirmed = teacherConfirmed && learnerConfirmed;
            const userConfirmed = isTeacher ? teacherConfirmed : learnerConfirmed;

            return (
              <Card
                key={session._id}
                className="hover:border-slate-300 transition-all border-slate-200"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left Section: Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">
                        {session.skill?.name || 'Skill Session'}
                      </span>
                      <Badge variant="primary" size="sm">
                        {session.skill?.category}
                      </Badge>
                      <Badge
                        variant={
                          session.status === 'confirmed'
                            ? 'success'
                            : session.status === 'completed'
                            ? 'credit'
                            : session.status === 'proposed'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {session.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Role & Partner Banner */}
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Avatar
                          src={partner?.photoUrl}
                          name={partner?.name || 'Partner'}
                          size="xs"
                        />
                        <span>
                          {isTeacher ? 'Learner:' : 'Teacher:'} {partner?.name}
                        </span>
                      </div>
                      <span>•</span>
                      <span className="text-indigo-600 font-bold">
                        {isTeacher ? '🎓 You are Teaching (+1 Credit)' : '📖 You are Learning (-1 Credit)'}
                      </span>
                    </div>

                    {/* Date, Time & Mode */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {new Date(session.scheduledAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>

                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {new Date(session.scheduledAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}{' '}
                        ({session.durationMinutes} min)
                      </span>

                      {session.mode === 'online' ? (
                        <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                          <Video className="w-3.5 h-3.5" />
                          Online Video
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
                          <MapPin className="w-3.5 h-3.5" />
                          In-Person
                        </span>
                      )}
                    </div>

                    {/* Meeting Link or Physical Address */}
                    {session.mode === 'online' && session.meetingLink && (
                      <div className="text-xs flex items-center gap-2">
                        <span className="font-semibold text-slate-500">Meeting Link:</span>
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center gap-1 truncate max-w-xs"
                        >
                          {session.meetingLink}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {session.mode === 'offline' && session.locationAddress && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Venue:</span>
                        <span>{session.locationAddress}</span>
                      </div>
                    )}

                    {/* Dual Verification Checklist Box (When Confirmed or Completed) */}
                    {(session.status === 'confirmed' || session.status === 'completed') && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                        <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                          Atomic Dual-Signoff Progress:
                        </span>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                teacherConfirmed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {teacherConfirmed ? '✓' : '•'}
                            </span>
                            <span className={teacherConfirmed ? 'font-bold text-emerald-800' : 'text-slate-500'}>
                              Teacher Signoff {teacherConfirmed ? 'Done' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                learnerConfirmed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {learnerConfirmed ? '✓' : '•'}
                            </span>
                            <span className={learnerConfirmed ? 'font-bold text-emerald-800' : 'text-slate-500'}>
                              Learner Signoff {learnerConfirmed ? 'Done' : 'Pending'}
                            </span>
                          </div>

                          {bothConfirmed && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">
                              ⚡ Credits Transferred
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Section: Action Controls */}
                  <div className="flex flex-wrap lg:flex-col items-center gap-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Proposed Status Actions */}
                    {session.status === 'proposed' && (
                      <>
                        {!isProposer ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            isLoading={isProcessing}
                            icon={CheckCircle2}
                            onClick={() => handleConfirm(session._id)}
                          >
                            Confirm Time
                          </Button>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-center">
                            Awaiting partner confirmation
                          </span>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-slate-600"
                          onClick={() => {
                            setRescheduleTargetSession(session);
                            setIsRescheduleOpen(true);
                          }}
                        >
                          Reschedule
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-rose-600 hover:bg-rose-50"
                          onClick={() => handleCancel(session._id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {/* Confirmed Status Actions */}
                    {session.status === 'confirmed' && (
                      <>
                        {!userConfirmed ? (
                          <Button
                            variant="credit"
                            size="sm"
                            className="w-full shadow-xs"
                            isLoading={isProcessing}
                            icon={CheckCircle2}
                            onClick={() => handleComplete(session._id)}
                          >
                            Mark Completed
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                            Signed Off (Waiting for partner)
                          </span>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-slate-600"
                          onClick={() => {
                            setRescheduleTargetSession(session);
                            setIsRescheduleOpen(true);
                          }}
                        >
                          Reschedule
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-rose-600 hover:bg-rose-50"
                          onClick={() => handleCancel(session._id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {/* Completed Status: Review button */}
                    {session.status === 'completed' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        icon={Star}
                        onClick={() => {
                          setReviewTargetSession(session);
                          setIsReviewOpen(true);
                        }}
                      >
                        Rate & Review
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Propose Session Modal */}
      <Modal
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        title="Propose a Live Skill Session"
        subtitle="Coordinate date, time, and meeting mode with an accepted partner."
      >
        <form onSubmit={handleProposeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Accepted Partner & Match *
            </label>
            {acceptedRequests.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                You do not have any accepted swap matches yet. First send a swap request and wait for approval!
              </div>
            ) : (
              <select
                required
                value={proposeForm.matchRequestId}
                onChange={(e) => setProposeForm({ ...proposeForm, matchRequestId: e.target.value })}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              >
                <option value="">Select a match partner...</option>
                {acceptedRequests.map((req) => {
                  const partner = req.sender?._id === user?._id ? req.receiver : req.sender;
                  return (
                    <option key={req._id} value={req._id}>
                      {partner?.name} — {req.skillRequested?.name} ({req.matchType})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={proposeForm.scheduledAt}
                onChange={(e) => setProposeForm({ ...proposeForm, scheduledAt: e.target.value })}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Duration *
              </label>
              <select
                value={proposeForm.durationMinutes}
                onChange={(e) => setProposeForm({ ...proposeForm, durationMinutes: e.target.value })}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              >
                <option value="30">30 minutes (0.5 credit)</option>
                <option value="45">45 minutes (0.75 credit)</option>
                <option value="60">60 minutes (1.0 credit)</option>
                <option value="90">90 minutes (1.5 credits)</option>
                <option value="120">120 minutes (2.0 credits)</option>
              </select>
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Session Mode *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProposeForm({ ...proposeForm, mode: 'online' })}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  proposeForm.mode === 'online'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Video className="w-4 h-4" />
                Online Video
              </button>
              <button
                type="button"
                onClick={() => setProposeForm({ ...proposeForm, mode: 'offline' })}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  proposeForm.mode === 'offline'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <MapPin className="w-4 h-4" />
                In-Person
              </button>
            </div>
          </div>

          {proposeForm.mode === 'online' ? (
            <Input
              label="Meeting Link (Google Meet, Zoom, etc.)"
              placeholder="https://meet.google.com/xyz-abc"
              value={proposeForm.meetingLink}
              onChange={(e) => setProposeForm({ ...proposeForm, meetingLink: e.target.value })}
            />
          ) : (
            <Input
              label="Meeting Venue / Location Address"
              placeholder="e.g. Central Library, Study Room B"
              value={proposeForm.locationAddress}
              onChange={(e) => setProposeForm({ ...proposeForm, locationAddress: e.target.value })}
            />
          )}

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
              Propose Session
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Session"
        subtitle="Propose a new date and time for this session."
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              New Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingReschedule}
            >
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rate & Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Leave a Review & Rating"
        subtitle="Help maintain a high-trust peer-to-peer exchange community."
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Rating (1 to 5 Stars) *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="p-1 text-2xl focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= reviewForm.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-black text-slate-700 ml-2">
                {reviewForm.rating} / 5 Stars
              </span>
            </div>
          </div>

          <Input
            label="Feedback & Testimonial"
            rows={3}
            placeholder="Share how the session went, what you learned, and their teaching style..."
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingReview}
              icon={Star}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionsPage;
