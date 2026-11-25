import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Sparkles, Mail, Lock, LogIn, UserCheck, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email, password);
      success('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
      success(`Logged in as demo user (${demoEmail})!`);
      navigate(from, { replace: true });
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              Skill<span className="text-indigo-600">Swap</span>
            </span>
          </Link>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage your swap requests, chats, and credit wallet.
          </p>
        </div>

        <Card padding="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Demo Accounts (Click to Login)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alice@example.com', 'Password123!')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-medium text-slate-700 transition-all text-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Alice (Coder)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('bob@example.com', 'Password123!')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-medium text-slate-700 transition-all text-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Bob (Chef)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@skillswap.com', 'AdminPass123!')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-xs font-bold text-purple-700 transition-all text-center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create an account (2 credits free)
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
