import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Coins,
  Repeat,
  ShieldCheck,
  Award,
  Users,
  Compass,
  Code,
  Music,
  Languages,
  Utensils,
  BookOpen,
  Palette,
  Dumbbell
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const categories = [
    { name: 'Coding & Tech', icon: Code, count: '12+ skills', color: 'from-blue-500 to-indigo-600' },
    { name: 'Languages', icon: Languages, count: '10+ skills', color: 'from-emerald-500 to-teal-600' },
    { name: 'Music & Instruments', icon: Music, count: '8+ skills', color: 'from-amber-500 to-orange-600' },
    { name: 'Culinary & Cooking', icon: Utensils, count: '6+ skills', color: 'from-rose-500 to-pink-600' },
    { name: 'Academics & Science', icon: BookOpen, count: '7+ skills', color: 'from-purple-500 to-indigo-600' },
    { name: 'Art & Design', icon: Palette, count: '5+ skills', color: 'from-fuchsia-500 to-pink-600' },
    { name: 'Sports & Fitness', icon: Dumbbell, count: '6+ skills', color: 'from-cyan-500 to-blue-600' }
  ];

  const steps = [
    {
      num: '01',
      title: 'List Your Skills',
      desc: 'Tell us what you can TEACH and what you want to LEARN, choosing your proficiency level.',
      icon: BookOpen
    },
    {
      num: '02',
      title: 'Smart Matching Engine',
      desc: 'Our scoring algorithm finds complementary partners: mutual two-way swaps or credit-based one-way learning.',
      icon: Compass
    },
    {
      num: '03',
      title: 'Earn & Spend Credits',
      desc: '1 hour taught = +1 credit earned. 1 hour learned = 1 credit spent. No monetary payments required.',
      icon: Coins
    },
    {
      num: '04',
      title: 'Verified Dual-Signoff',
      desc: 'Both parties confirm session completion, credits transfer atomically, and mutual reviews build trust.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-amber-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-xs animate-fadeIn">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Peer-to-Peer Knowledge Economy • Get 2 Free Starting Credits</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none max-w-4xl mx-auto">
            Trade What You Know. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500">
              Learn What You Love.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Skill-Swap connects curious minds. Exchange coding for cooking, guitar for French, or math for fitness without paying money. Every new member receives <strong>2 starting credits</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.02]"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4" />
                  Join Now (2 Free Credits)
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-200 shadow-sm transition-all"
                >
                  Log In & Demo Accounts
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-black text-indigo-600">45+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Verified Skills</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-black text-emerald-600">100%</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Cashless Exchange</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-black text-amber-600">2 Credits</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Welcome Bonus</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-black text-purple-600">Real-Time</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Socket Chat & Alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-bold tracking-widest text-indigo-600">
              Simple 4-Step Process
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              How Skill-Swap Works
            </p>
            <p className="text-sm text-slate-500 mt-2">
              No subscription fees, no credit cards. Just honest peer-to-peer knowledge sharing.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-indigo-600/30 group-hover:text-indigo-600 transition-colors">
                      {st.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{st.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credit Economy Highlight */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-tr from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-4">
                  ⚡ Skill-Credit System
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  What if You Don’t Have a Perfect Mutual Match?
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Most platforms fail if User A teaches what User B wants, but User B can't teach what User A wants. Skill-Swap solves this with <strong>Skill Credits</strong>!
                </p>
                <div className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">✓</div>
                    <span><strong>1 Hour Taught = +1 Credit Earned</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">✓</div>
                    <span><strong>1 Hour Learned = -1 Credit Spent</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">✓</div>
                    <span><strong>Dual-Confirmation:</strong> Credits move only when both confirm</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs uppercase font-bold text-slate-300">Atomic Flow</span>
                  <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Safe Transaction</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>1. Propose & Confirm Session</span>
                    <span className="text-indigo-300 font-semibold">Accepted</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>2. Teacher & Learner Meet (Online/In-person)</span>
                    <span className="text-amber-300 font-semibold">1 Hour</span>
                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-between text-emerald-200">
                    <span>3. Both Mark "Completed"</span>
                    <span className="font-bold">+1 / -1 Transferred</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-bold tracking-widest text-indigo-600">
              Explore Our Catalog
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Popular Skill Categories
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer bg-slate-50/50 hover:bg-white"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </h4>
                    <span className="text-xs text-slate-500">{cat.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-100 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Ready to exchange skills with peers?
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Sign up in under 60 seconds and start with 2 credits on your balance.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
