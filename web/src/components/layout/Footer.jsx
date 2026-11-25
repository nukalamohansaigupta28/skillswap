import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Skill<span className="text-indigo-400">Swap</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Skill-Swap is an equitable peer-to-peer knowledge exchange platform. Share what you excel at, learn what you love—powered by an algorithmic credit balance.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/matches" className="hover:text-white transition-colors">
                  Find Matches
                </Link>
              </li>
              <li>
                <Link to="/requests" className="hover:text-white transition-colors">
                  Swap Requests
                </Link>
              </li>
              <li>
                <Link to="/sessions" className="hover:text-white transition-colors">
                  Live Sessions
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-white transition-colors">
                  Credit Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Skill Categories
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-400">Coding & Web Dev</li>
              <li className="text-slate-400">Languages & Fluency</li>
              <li className="text-slate-400">Music & Instruments</li>
              <li className="text-slate-400">Culinary & Cooking</li>
              <li className="text-slate-400">Academics & Science</li>
            </ul>
          </div>

          {/* Community & Safety */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Community & Safety
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-400">Mutual Review System</li>
              <li className="text-slate-400">Starting 2 Skill Credits</li>
              <li className="text-slate-400">Atomic Dual-Verification</li>
              <li className="text-slate-400">Admin Moderation & Safety</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Skill-Swap Platform. Built for Capstone Engineering Project.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> by Full-Stack Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

