import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Sparkles, Mail, Lock, User, MapPin, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: 'New York',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!formData.city.trim()) errs.city = 'City is required for location matching';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        city: formData.city.trim(),
        bio: formData.bio.trim()
      });
      success('Welcome to Skill-Swap! You received 2 free starting credits.');
      navigate('/dashboard');
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Registration failed');
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
            Create your account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Join the community and receive 2 complimentary skill-credits.
          </p>
        </div>

        {/* Free Credits Callout Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-900 flex items-center justify-center font-black text-sm shadow-xs">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Welcome Bonus
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Every new user starts with <strong>2 free credits</strong> so you can book your first learning session immediately!
            </p>
          </div>
        </div>

        <Card padding="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="e.g. Alex Rivera"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="alex@example.com"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <Input
              label="City / Location"
              name="city"
              placeholder="e.g. New York, London, Tokyo"
              icon={MapPin}
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
              helperText="Used to boost scores for local in-person swaps"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            </div>

            <Input
              label="Short Bio (Optional)"
              name="bio"
              rows={2}
              placeholder="Briefly describe what you are passionate about learning or teaching..."
              value={formData.bio}
              onChange={handleChange}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={UserPlus}
            >
              Get Started with 2 Credits
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
