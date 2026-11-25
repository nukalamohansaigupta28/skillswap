import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import api from '../services/api';
import {
  Compass,
  Coins,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Star,
  BookOpen,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    upcomingSessions: 0,
    teachSkillsCount: 0,
    learnSkillsCount: 0
  });
  const [mySkills, setMySkills] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Run queries in parallel
      const [skillsRes, requestsRes, sessionsRes] = await Promise.all([
        api.get('/users/me/skills').catch(() => ({ data: { data: [] } })),
        api.get('/requests?status=pending').catch(() => ({ data: { data: [] } })),
        api.get('/sessions?status=confirmed&limit=3').catch(() => ({ data: { data: [] } }))
      ]);

      const userSkills = skillsRes.data?.data || skillsRes.data?.skills || [];
      setMySkills(userSkills);

      const teach = userSkills.filter((s) => s.type === 'TEACH');
      const learn = userSkills.filter((s) => s.type === 'LEARN');

      const requests = requestsRes.data?.data || [];
      const sessions = Array.isArray(sessionsRes.data?.data)
        ? sessionsRes.data.data
        : (sessionsRes.data?.data?.sessions || sessionsRes.data?.sessions || []);
      setUpcomingSessions(sessions);

      setStats({
        pendingRequests: requests.length,
        upcomingSessions: sessions.length,
        teachSkillsCount: teach.length,
        learnSkillsCount: learn.length
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const teachSkills = mySkills.filter((s) => s.type === 'TEACH');
  const learnSkills = mySkills.filter((s) => s.type === 'LEARN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
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
                Welcome, {user?.name}!
              </h1>
              {user?.role === 'admin' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                {user?.location?.city || 'Location not set'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                {user?.ratingAverage > 0 ? user.ratingAverage.toFixed(1) : 'New Member'} ({user?.ratingCount || 0} reviews)
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/matches">
            <Button variant="primary" icon={Compass}>
              Find Matches
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="secondary">
              Edit Skills
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Credits Card */}
        <Card className="hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Skill Credits
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              ⚡
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{user?.creditBalance ?? 0}</span>
            <span className="text-xs text-slate-500">available</span>
          </div>
          <Link
            to="/wallet"
            className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>View transactions</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Active Requests */}
        <Card className="hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Swap Requests
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.pendingRequests}</span>
            <span className="text-xs text-slate-500">pending</span>
          </div>
          <Link
            to="/requests"
            className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>Manage requests</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Sessions */}
        <Card className="hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmed Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.upcomingSessions}</span>
            <span className="text-xs text-slate-500">scheduled</span>
          </div>
          <Link
            to="/sessions"
            className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            <span>View calendar</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Skills Listed */}
        <Card className="hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My Listed Skills
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats.teachSkillsCount + stats.learnSkillsCount}
            </span>
            <span className="text-xs text-slate-500">
              ({stats.teachSkillsCount} teach / {stats.learnSkillsCount} learn)
            </span>
          </div>
          <Link
            to="/profile"
            className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800"
          >
            <span>Add or edit skills</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Main Grid: Skills breakdown & Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Skills Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Skill Portfolio</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The matching engine pairs your teaching skills with others' learning desires.
                </p>
              </div>
              <Link to="/profile">
                <Button size="sm" variant="outline">
                  Manage Skills
                </Button>
              </Link>
            </div>

            <div className="mt-6 space-y-6">
              {/* Teaching skills */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Skills I Can Teach ({teachSkills.length})
                  </span>
                </div>
                {teachSkills.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    No teaching skills listed yet. Add what you know to start matching!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teachSkills.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs flex items-center gap-2"
                      >
                        <span className="font-semibold text-indigo-900">
                          {item.skill?.name || 'Skill'}
                        </span>
                        <Badge variant="primary" size="sm">
                          {item.proficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Learning skills */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Skills I Want to Learn ({learnSkills.length})
                  </span>
                </div>
                {learnSkills.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    No learning goals listed yet. Add what you wish to learn!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {learnSkills.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-center gap-2"
                      >
                        <span className="font-semibold text-amber-900">
                          {item.skill?.name || 'Skill'}
                        </span>
                        <Badge variant="warning" size="sm">
                          {item.proficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Discover CTA Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-lg flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Find Your Ideal Swap Partner
              </h4>
              <p className="text-xs text-indigo-100 max-w-md">
                Our matching algorithm evaluates mutual teaching fits, location proximity, and schedule overlaps.
              </p>
            </div>
            <Link to="/matches">
              <Button variant="secondary" className="whitespace-nowrap shadow-sm">
                Explore Matches
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Col: Upcoming Sessions & System rules */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Sessions</h3>
              <Link to="/sessions" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View all
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No sessions scheduled yet. Accept a swap request to book a session!
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session._id || session.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {session.skill?.name || 'Skill Session'}
                      </span>
                      <Badge variant="success" size="sm">
                        Confirmed
                      </Badge>
                    </div>
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(session.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.durationMinutes}m)
                    </p>
                    <div className="text-[11px] text-slate-600">
                      Mode: <span className="font-semibold uppercase">{session.mode}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-slate-50 border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Skill-Credit Safeguards
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• <strong>Atomic dual-verification:</strong> Credits never move until both teacher & learner sign off.</li>
              <li>• <strong>Cancellation protection:</strong> Cancelled sessions never debit credits.</li>
              <li>• <strong>Fair-trade matching:</strong> Mutual swaps receive top algorithmic priority.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
