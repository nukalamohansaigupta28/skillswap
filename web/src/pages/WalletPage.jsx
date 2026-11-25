import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';

const WalletPage = () => {
  const { user, refreshUser } = useAuth();
  const { error: toastError } = useToast();

  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/wallet?page=${page}&limit=15`);
      if (res.data?.success) {
        setWallet(res.data);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load wallet ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    fetchWallet();
  }, [page]);

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'EARN':
        return (
          <Badge variant="success" icon={ArrowUpRight}>
            EARN
          </Badge>
        );
      case 'SPEND':
        return (
          <Badge variant="warning" icon={ArrowDownLeft}>
            SPEND
          </Badge>
        );
      case 'BONUS':
        return (
          <Badge variant="primary" icon={Gift}>
            BONUS
          </Badge>
        );
      case 'REFUND':
        return (
          <Badge variant="info" icon={RotateCcw}>
            REFUND
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Balance Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-white text-xs font-bold">
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Skill-Swap Sovereign Credit Balance</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {wallet?.creditBalance ?? user?.creditBalance ?? 0}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-amber-200">Credits</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100 max-w-md">
              1 credit allows you to book 1 hour of personalized 1-on-1 tutoring from any peer across the globe.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link to="/matches" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full whitespace-nowrap shadow-md text-amber-950 font-bold"
              >
                Spend Credits (Book Session)
              </Button>
            </Link>
            <Link to="/profile" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full whitespace-nowrap border-white/40 text-white hover:bg-white/10"
              >
                Earn Credits (List Teaching Skills)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Rules of Skill Credit System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              +1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Earn by Teaching</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every 1 hour you spend teaching another member awards you <strong>+1 skill credit</strong> automatically upon dual-signoff.
          </p>
        </Card>

        <Card className="bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              -1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Spend to Learn</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you want to learn a skill without offering a mutual swap, spend <strong>1 credit per hour</strong> from your balance.
          </p>
        </Card>

        <Card className="bg-white border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Protected Settlement</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Credits never transfer if a session is cancelled or if only one party signs off. All transfers are atomically guaranteed.
          </p>
        </Card>
      </div>

      {/* Transactions Ledger Card */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Transaction Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete audited history of all earned, spent, and credited transactions.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Records: {wallet?.pagination?.total || 0}
          </span>
        </div>

        {/* Ledger Table */}
        <div className="mt-4 overflow-x-auto">
          {isLoading ? (
            <div className="py-8 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !wallet?.transactions || wallet.transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium">No credit transactions recorded yet.</p>
              <p className="text-[11px] text-slate-400">
                Complete a session or sign up to record your first ledger entry!
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Session Info</th>
                  <th className="py-3 px-4">Change</th>
                  <th className="py-3 px-4">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {wallet.transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTransactionBadge(tx.type)}
                      </td>

                      <td className="py-3.5 px-4">
                        {tx.session ? (
                          <span className="text-slate-600 font-medium">
                            Session ({tx.session.durationMinutes}m • {tx.session.mode})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            {tx.type === 'BONUS' ? 'Account Welcome Credit' : 'System Credit'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold">
                        <span
                          className={
                            isPositive ? 'text-emerald-600' : 'text-amber-600'
                          }
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount} credits
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        ⚡ {tx.balanceAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {wallet?.pagination?.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-600 px-3">
              Page {page} of {wallet.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= wallet.pagination.totalPages}
              onClick={() => setPage((p) => Math.min(wallet.pagination.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WalletPage;
