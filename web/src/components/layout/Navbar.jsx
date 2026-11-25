import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import api from '../../services/api';
import {
  Sparkles,
  Coins,
  Bell,
  MessageSquare,
  Calendar,
  Users,
  Compass,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch unread notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications?limit=6');
      if (res.data?.success && res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // quiet fail on background fetch
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, location.pathname]);

  // Listen to socket notification events to update count
  useEffect(() => {
    if (!socket) return;
    const handleNewNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 5)]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, [socket]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = isAuthenticated
    ? [
        { name: 'Find Matches', path: '/matches', icon: Compass },
        { name: 'Requests', path: '/requests', icon: Users },
        { name: 'Messages', path: '/chat', icon: MessageSquare },
        { name: 'Sessions', path: '/sessions', icon: Calendar }
      ]
    : [
        { name: 'How It Works', path: '/#how-it-works' },
        { name: 'Categories', path: '/#categories' }
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Skill<span className="text-indigo-600">Swap</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 -mt-1">
                  Exchange Skills
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {Icon && <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Credit balance badge */}
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 transition-colors shadow-xs group"
                  title="Your Skill-Credit Balance. Click to manage."
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center font-black text-xs shadow-xs">
                    ⚡
                  </div>
                  <span className="text-sm font-bold tracking-tight">
                    {user?.creditBalance ?? 0}
                  </span>
                  <span className="text-xs text-amber-700 font-medium hidden sm:inline">
                    credits
                  </span>
                </Link>

                {/* Notifications dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-3 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <Badge variant="credit" size="sm">
                              {unreadCount} new
                            </Badge>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id || notif.id}
                              className={`p-3.5 hover:bg-slate-50 transition-colors text-xs flex gap-3 ${
                                !notif.isRead ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-800">{notif.title}</p>
                                <p className="text-slate-600 mt-0.5">{notif.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <Avatar
                      src={user?.photoUrl}
                      name={user?.name || 'User'}
                      size="sm"
                    />
                    <span className="text-sm font-semibold text-slate-700 hidden lg:inline max-w-[120px] truncate">
                      {user?.name}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <Compass className="w-4 h-4 text-slate-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          My Profile & Skills
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <Coins className="w-4 h-4 text-slate-400" />
                          Wallet ({user?.creditBalance ?? 0} credits)
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 font-semibold"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all shadow-indigo-100 hover:shadow-indigo-200"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign Up (Free 2 Credits)
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <Link
                to="/wallet"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold"
              >
                ⚡ {user?.creditBalance ?? 0}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-6 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/matches"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Find Matches
              </Link>
              <Link
                to="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Swap Requests
              </Link>
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Messages
              </Link>
              <Link
                to="/sessions"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sessions
              </Link>
              <Link
                to="/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Wallet ({user?.creditBalance ?? 0} credits)
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                My Profile & Skills
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  Admin Console
                </Link>
              )}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Sign Up (Free 2 Credits)
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

