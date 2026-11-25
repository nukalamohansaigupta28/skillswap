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
import { Skeleton } from '../components/common/Skeleton';
import {
  ShieldCheck,
  BarChart3,
  Users,
  BookOpen,
  AlertTriangle,
  Coins,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  UserCheck,
  UserX,
  FileText,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const AdminPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'skills' | 'reports'

  // Tab 1: Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Tab 2: Users Management State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userActionInProgress, setUserActionInProgress] = useState(null);

  // Tab 3: Skills Moderation State
  const [pendingSkills, setPendingSkills] = useState([]);
  const [approvedSkillsCount, setApprovedSkillsCount] = useState(0);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillActionInProgress, setSkillActionInProgress] = useState(null);

  // Tab 4: Reports Moderation State
  const [reportsList, setReportsList] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('open');
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Fetch Platform Analytics
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({ page: usersPage, limit: 12 });
      if (userSearch) params.append('search', userSearch);
      if (userStatusFilter) params.append('status', userStatusFilter);
      if (userRoleFilter) params.append('role', userRoleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsersList(res.data.data || []);
        setUsersTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load user list');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Skills Queue
  const fetchSkillsQueue = async () => {
    setIsLoadingSkills(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        api.get('/skills?status=pending&limit=50'),
        api.get('/skills?status=approved&limit=1')
      ]);

      setPendingSkills(pendingRes.data?.data || []);
      setApprovedSkillsCount(approvedRes.data?.pagination?.total || 0);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load skills queue');
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Fetch Reports
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (reportStatusFilter !== 'all') params.append('status', reportStatusFilter);

      const res = await api.get(`/admin/reports?${params.toString()}`);
      if (res.data?.success) {
        setReportsList(res.data.data || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load safety reports');
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Run on tab switch
  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'skills') fetchSkillsQueue();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [usersPage, userStatusFilter, userRoleFilter]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [reportStatusFilter]);

  // Handle User Status Update (Suspend / Activate)
  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      nextStatus === 'suspended'
        ? `Are you sure you want to suspend "${targetUser.name}"? They will lose access to trading.`
        : `Reactivate account for "${targetUser.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUserActionInProgress(targetUser._id);
    try {
      await api.patch(`/admin/users/${targetUser._id}/status`, { status: nextStatus });
      success(`User account status updated to ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUserActionInProgress(null);
    }
  };

  // Handle Skill Approval / Rejection
  const handleSkillDecision = async (skillId, decision) => {
    setSkillActionInProgress(skillId);
    try {
      await api.patch(`/skills/${skillId}/approve`, { status: decision });
      success(`Custom skill ${decision === 'approved' ? 'approved' : 'rejected'}.`);
      fetchSkillsQueue();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to process skill decision');
    } finally {
      setSkillActionInProgress(null);
    }
  };

  // Handle Report Resolve / Dismiss
  const handleReportAction = async (status) => {
    if (!selectedReport) return;
    setIsSubmittingReport(true);
    try {
      await api.patch(`/admin/reports/${selectedReport._id}`, {
        status,
        resolutionNotes
      });
      success(`Report marked as ${status}.`);
      setIsResolveModalOpen(false);
      setSelectedReport(null);
      setResolutionNotes('');
      fetchReports();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Color palette for Recharts
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

  // Prepare PieChart data from top 10 skills categories
  const categoryMap = (analytics?.top10Skills || []).reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + curr.userCount;
    return acc;
  }, {});
  const categoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat]
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                System Administration Console
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500 text-white">
                SuperAdmin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              Platform telemetry, algorithmic integrity, user trust governance, and skill approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <Badge variant="credit" size="lg">
            ⚡ {analytics?.credits?.totalCirculated ?? 0} Credits Circulated
          </Badge>
          {analytics?.moderation?.openReports > 0 && (
            <Badge variant="danger" size="lg">
              ⚠️ {analytics.moderation.openReports} Open Reports
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'analytics'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Analytics & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'users'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'skills'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Skill Approval Queue ({pendingSkills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'reports'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Safety Reports</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Members
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {analytics?.users?.total ?? 0}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  ({analytics?.users?.activeLast30Days ?? 0} active 30d)
                </span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Exchange Sessions
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {analytics?.sessions?.total ?? 0}
                </span>
                <span className="text-xs text-slate-500">
                  ({analytics?.sessions?.completed ?? 0} completed)
                </span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Credit Velocity
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  ⚡
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {analytics?.credits?.totalCirculated ?? 0}
                </span>
                <span className="text-xs text-slate-500">transferred</span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Platform Rating
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-purple-400 text-purple-400" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {analytics?.ratings?.platformAverage ?? 0}
                </span>
                <span className="text-xs text-slate-500">
                  ({analytics?.ratings?.totalReviews ?? 0} reviews)
                </span>
              </div>
            </Card>
          </div>

          {/* Recharts Data Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Sessions per Week Trend */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Weekly Sessions Activity
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total sessions booked vs completed over the last 4 weeks.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                {analytics?.sessions?.sessionsPerWeek?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.sessions.sessionsPerWeek}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="total" name="Total Scheduled" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed & Settled" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No weekly sessions data recorded yet.
                  </div>
                )}
              </div>
            </Card>

            {/* Chart 2: Top 10 Popular Skills */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Top 10 Most In-Demand Skills
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by total user listings (teaching + learning).
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                {analytics?.top10Skills?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={analytics.top10Skills}
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="userCount" name="Active Members" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No skills participation data recorded yet.
                  </div>
                )}
              </div>
            </Card>

            {/* Chart 3: Skill Category Distribution */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    Skill Category Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proportional share of user interest by academic and practical disciplines.
                  </p>
                </div>
              </div>

              <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No skill distribution data available yet.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: USER GOVERNANCE & MODERATION */}
      {activeTab === 'users' && (
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Member Directory</h3>
              <p className="text-xs text-slate-500">
                Inspect user accounts, manage trust badges, or suspend bad actors.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, email, city..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="text-xs rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <Button variant="outline" size="sm" onClick={fetchUsers}>
                Search
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {isLoadingUsers ? (
              <div className="py-8 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No users found matching your search filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usersList.map((target) => {
                    const isSelf = target._id === user?._id;
                    const isProcessing = userActionInProgress === target._id;

                    return (
                      <tr key={target._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={target.photoUrl}
                              name={target.name}
                              size="sm"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{target.name}</p>
                              <p className="text-[11px] text-slate-400">{target.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {target.location?.city || 'Worldwide'}
                        </td>

                        <td className="py-3 px-4 font-bold text-amber-900">
                          ⚡ {target.creditBalance ?? 0}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{target.ratingAverage > 0 ? target.ratingAverage.toFixed(1) : '—'}</span>
                            <span className="text-slate-400 font-normal">({target.ratingCount || 0})</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={target.role === 'admin' ? 'purple' : 'neutral'} size="sm">
                            {target.role}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={target.status === 'active' ? 'success' : 'danger'} size="sm">
                            {target.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isSelf ? (
                            <Button
                              variant={target.status === 'active' ? 'danger' : 'outline'}
                              size="sm"
                              isLoading={isProcessing}
                              icon={target.status === 'active' ? UserX : UserCheck}
                              onClick={() => handleToggleUserStatus(target)}
                            >
                              {target.status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Current Admin</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {usersTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={usersPage <= 1}
                onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-600 px-3">
                Page {usersPage} of {usersTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={usersPage >= usersTotalPages}
                onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: SKILL CATALOG APPROVAL QUEUE */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Community Skill Submissions Queue
              </h3>
              <p className="text-xs text-slate-500">
                Skills suggested by users must be approved before they become visible to other members.
              </p>
            </div>
            <Badge variant="primary" size="md">
              {approvedSkillsCount} Approved in Catalog
            </Badge>
          </div>

          {isLoadingSkills ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : pendingSkills.length === 0 ? (
            <Card className="text-center py-16 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">All caught up!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No custom skills are currently awaiting approval. When members submit new skills, they appear here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingSkills.map((sk) => {
                const isProcessing = skillActionInProgress === sk._id;

                return (
                  <Card key={sk._id} className="p-5 flex flex-col justify-between border-slate-200">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{sk.name}</h4>
                        <Badge variant="warning" size="sm">
                          Pending
                        </Badge>
                      </div>

                      <Badge variant="primary" size="sm">
                        {sk.category}
                      </Badge>

                      {sk.description && (
                        <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{sk.description}"
                        </p>
                      )}

                      <div className="text-[11px] text-slate-400 pt-1">
                        Suggested by: <span className="font-semibold text-slate-600">{sk.createdBy?.name || 'User'}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        isLoading={isProcessing}
                        icon={CheckCircle2}
                        onClick={() => handleSkillDecision(sk._id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-rose-600 hover:bg-rose-50 border-rose-200"
                        isLoading={isProcessing}
                        icon={XCircle}
                        onClick={() => handleSkillDecision(sk._id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SAFETY REPORTS & MODERATION */}
      {activeTab === 'reports' && (
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Community Safety & Incident Reports
              </h3>
              <p className="text-xs text-slate-500">
                Moderation incidents filed by members regarding no-shows, harassment, or safety concerns.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter:
              </span>
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="open">Open (Action Needed)</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All Reports</option>
              </select>
            </div>
          </div>

          {isLoadingReports ? (
            <div className="py-8 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : reportsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-medium">No {reportStatusFilter} safety reports.</p>
              <p className="text-[11px] text-slate-400">Community integrity is running clean.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportsList.map((rep) => (
                <div
                  key={rep._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        {rep.reason || 'General Report'}
                      </span>
                      <Badge
                        variant={
                          rep.status === 'open'
                            ? 'danger'
                            : rep.status === 'investigating'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {rep.status.toUpperCase()}
                      </Badge>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Filed on {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                        Reporter:
                      </span>
                      <span className="font-bold text-slate-800">
                        {rep.reporter?.name} ({rep.reporter?.email})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                        Reported User:
                      </span>
                      <span className="font-bold text-slate-800">
                        {rep.reportedUser?.name} ({rep.reportedUser?.email}) •{' '}
                        <span
                          className={
                            rep.reportedUser?.status === 'active'
                              ? 'text-emerald-600 font-bold'
                              : 'text-rose-600 font-bold'
                          }
                        >
                          {rep.reportedUser?.status}
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    "{rep.description}"
                  </p>

                  {rep.resolutionNotes && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900">
                      <strong>Admin Resolution Note:</strong> {rep.resolutionNotes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                    {rep.reportedUser && rep.reportedUser.status === 'active' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleToggleUserStatus(rep.reportedUser)}
                      >
                        Suspend Reported User
                      </Button>
                    )}

                    {rep.status === 'open' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(rep);
                          setIsResolveModalOpen(true);
                        }}
                      >
                        Resolve / Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Resolve Report Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Incident Report"
        subtitle="Document administrative findings and update incident state."
      >
        <div className="space-y-4">
          <Input
            label="Resolution Notes & Actions Taken *"
            rows={4}
            placeholder="Document actions taken (e.g. user warned, session credit restored, account suspended)..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmittingReport}
              onClick={() => handleReportAction('dismissed')}
            >
              Dismiss (No Violation)
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingReport}
              onClick={() => handleReportAction('resolved')}
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;
