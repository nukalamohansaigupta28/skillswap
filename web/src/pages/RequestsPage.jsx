import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  Users,
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Coins,
  MessageSquare,
  Calendar,
  AlertCircle,
  Star,
  MapPin
} from 'lucide-react';

const RequestsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null); // requestId being processed

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/requests?${params.toString()}`);
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load swap requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab, statusFilter]);

  const handleAction = async (requestId, action) => {
    setActionInProgress(requestId);
    try {
      await api.patch(`/requests/${requestId}`, { action });
      const actionLabels = {
        accept: 'accepted',
        decline: 'declined',
        cancel: 'cancelled'
      };
      success(`Swap request ${actionLabels[action] || 'updated'} successfully!`);
      // Refresh requests list
      fetchRequests();
    } catch (err) {
      toastError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'declined':
        return <Badge variant="danger">Declined</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Swap Requests Inbox
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accept proposals to unlock real-time chat and coordinate live skill sessions.
          </p>
        </div>

        <Link to="/matches">
          <Button variant="primary" size="sm" icon={Send}>
            Find New Matches
          </Button>
        </Link>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Main Tabs (Received vs Sent) */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial ${
              activeTab === 'received'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Received Requests</span>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial ${
              activeTab === 'sent'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Sent Requests</span>
          </button>
        </div>

        {/* Status Sub-filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No {statusFilter !== 'all' ? statusFilter : ''} {activeTab} requests
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'received'
              ? 'When other users discover your listed skills and send proposals, they will appear here.'
              : 'You have not sent any swap proposals matching this criteria yet.'}
          </p>
          <div className="pt-2">
            <Link to="/matches">
              <Button variant="primary" size="sm">
                Explore Suggested Matches
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isReceived = activeTab === 'received';
            const partner = isReceived ? req.sender : req.receiver;
            const isMutual = req.matchType === 'MUTUAL';
            const isProcessing = actionInProgress === req._id;

            return (
              <Card
                key={req._id}
                className="hover:border-slate-300 transition-all border-slate-200"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left: Partner info & Swap description */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar
                      src={partner?.photoUrl}
                      name={partner?.name || 'User'}
                      size="lg"
                    />

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {partner?.name}
                        </h3>
                        {getStatusBadge(req.status)}
                        <Badge
                          variant={isMutual ? 'primary' : 'credit'}
                          size="sm"
                          icon={isMutual ? ArrowRightLeft : Coins}
                        >
                          {isMutual ? 'Mutual Swap' : 'Credit-Based'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {partner?.location?.city || 'Location unlisted'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {partner?.ratingAverage > 0
                            ? partner.ratingAverage.toFixed(1)
                            : 'New'}
                          <span className="text-slate-400 font-normal">
                            ({partner?.ratingCount || 0})
                          </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Skill Exchange Summary Box */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-500">
                            {isReceived ? 'They want to learn:' : 'You want to learn:'}
                          </span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                            {req.skillRequested?.name || 'Skill'}
                          </span>
                        </div>

                        {isMutual && req.skillOffered && (
                          <>
                            <span className="text-slate-300 font-bold">⇄</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-500">
                                {isReceived ? 'They offer in return:' : 'You offer in return:'}
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                {req.skillOffered?.name || 'Skill'}
                              </span>
                            </div>
                          </>
                        )}

                        {!isMutual && (
                          <span className="text-amber-800 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⚡ 1 credit / hour taught
                          </span>
                        )}
                      </div>

                      {/* Note Message */}
                      {req.message && (
                        <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 italic">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center gap-2 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Received Pending Actions */}
                    {isReceived && req.status === 'pending' && (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          isLoading={isProcessing}
                          icon={CheckCircle2}
                          onClick={() => handleAction(req._id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-rose-600 hover:bg-rose-50 border-rose-200"
                          isLoading={isProcessing}
                          icon={XCircle}
                          onClick={() => handleAction(req._id, 'decline')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {/* Sent Pending Action */}
                    {!isReceived && req.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-slate-600 hover:text-rose-600"
                        isLoading={isProcessing}
                        icon={XCircle}
                        onClick={() => handleAction(req._id, 'cancel')}
                      >
                        Cancel Request
                      </Button>
                    )}

                    {/* Accepted Actions (Unlock Chat & Session Scheduling) */}
                    {req.status === 'accepted' && (
                      <div className="flex items-center gap-2 w-full">
                        <Link
                          to={`/chat?partner=${partner?._id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full"
                            icon={MessageSquare}
                          >
                            Chat
                          </Button>
                        </Link>
                        <Link
                          to={`/sessions?requestId=${req._id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            icon={Calendar}
                          >
                            Schedule
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
