import React, { useState, useEffect } from 'react';
import { 
  X, Award, Sparkles, TrendingUp, History, ShieldCheck, Gift, Star, 
  ChevronRight, ArrowUpRight, ArrowDownLeft, RefreshCw, Zap, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/use-auth-store';
import { loyaltyService, LoyaltyBalanceResponse } from '../../services/loyalty.service';
import { useToast } from '../feedback/ToastContainer';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { motion, AnimatePresence } from 'framer-motion';

interface LoyaltyPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const LoyaltyPointsModal: React.FC<LoyaltyPointsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'passbook' | 'perks'>('passbook');
  const [loading, setLoading] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyBalanceResponse | null>(null);

  const fetchLoyaltyData = async (isManual = false) => {
    if (!user?.phone) return;
    setLoading(true);
    try {
      const data = await loyaltyService.getLoyaltyBalance(user.phone);
      setLoyaltyData(data);
      if (isManual) {
        showToast('Loyalty wallet refreshed!', 'success');
      }
    } catch (error) {
      console.error('Failed to load loyalty wallet', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.phone) {
      fetchLoyaltyData();
    }
  }, [isOpen, user?.phone]);

  if (!isOpen) return null;

  const currentPoints = loyaltyData?.loyaltyPoints ?? (user?.loyaltyPoints ?? 0);
  const cashVal = loyaltyData?.cashValue ?? (currentPoints * 0.5);
  const tierName = loyaltyData?.tierMeta?.name ?? 'Standard Guest';
  const tierMultiplier = loyaltyData?.tierMeta?.multiplier ?? 1.0;
  const progressPct = loyaltyData?.tierMeta?.progressPct ?? 20;
  const pointsNeeded = loyaltyData?.tierMeta?.pointsNeeded ?? 400;
  const nextTier = loyaltyData?.tierMeta?.nextTier ?? 'SILVER';

  const getTxBadge = (type: string) => {
    switch (type) {
      case 'WELCOME_BONUS':
        return { label: 'WELCOME GIFT', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <Gift className="w-3 h-3" /> };
      case 'EARNED_DINING':
        return { label: 'DINING SPEND', color: 'bg-emerald-100 text-[#0C831F] border-emerald-300', icon: <ArrowUpRight className="w-3 h-3" /> };
      case 'EARNED_FEEDBACK':
        return { label: 'REVIEW REWARD', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: <Star className="w-3 h-3 fill-amber-500" /> };
      case 'REDEEMED_ORDER':
        return { label: 'BILL DISCOUNT', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <ArrowDownLeft className="w-3 h-3" /> };
      case 'REFUND_DEDUCTION':
        return { label: 'REFUND REVERSAL', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: <ArrowDownLeft className="w-3 h-3" /> };
      case 'ORDER_CANCEL_RESTORE':
        return { label: 'RESTORED', color: 'bg-sky-100 text-sky-800 border-sky-300', icon: <RefreshCw className="w-3 h-3" /> };
      default:
        return { label: 'ADJUSTMENT', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: <ShieldCheck className="w-3 h-3" /> };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[92vh] flex flex-col custom-scrollbar overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Siliguri Chai Adda Rewards</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-full">
                  PASSBOOK
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Artisan Tea House Loyalty &amp; Instant Points Ledger</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {isAuthenticated && (
              <button
                onClick={() => fetchLoyaltyData(true)}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                title="Refresh Wallet"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3.5 pr-0.5 custom-scrollbar">
          {/* Member Card */}
          <div className="relative rounded-3xl p-5 sm:p-6 text-white overflow-hidden shadow-xl border border-amber-400/30 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
            {/* Card Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#0C831F]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-widest text-amber-300 font-bold uppercase block">
                    Exclusive Dining Tier
                  </span>
                  <h3 className="text-lg font-black text-white tracking-wide">
                    {tierName}
                  </h3>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{tierMultiplier}x Multiplier</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300 block">
                  Available Wallet Balance
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="font-mono font-black text-3xl sm:text-4xl text-amber-400 tracking-tight">
                    {currentPoints.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-extrabold text-white/80 uppercase tracking-wider">
                    POINTS
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-xs text-emerald-300 font-mono font-bold">
                  <span>≈ ₹{cashVal.toFixed(2)} Bill Discount Value</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60 font-sans text-[11px]">1 PT = ₹0.50</span>
                </div>
              </div>

              {/* Tier Progress Bar */}
              {nextTier && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-sans">
                    <span className="text-slate-300 font-medium">Progress to {nextTier} Tier</span>
                    <span className="text-amber-300 font-mono font-bold">{pointsNeeded} PTS needed</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-[#0C831F] rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isAuthenticated && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">Sign Up &amp; Get +100 Points Free</p>
                <p className="text-[11px] text-slate-500">Instant ₹50 dining credit towards today's meal!</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="px-3.5 py-1.5 bg-[#0C831F] hover:bg-[#096918] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Join Free
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('passbook')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'passbook'
                  ? 'border-[#0C831F] text-[#0C831F]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Points Passbook</span>
            </button>
            <button
              onClick={() => setActiveTab('perks')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'perks'
                  ? 'border-[#0C831F] text-[#0C831F]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Tiers &amp; Rules</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'passbook' ? (
            <div className="space-y-2.5">
              {loyaltyData?.recentTransactions && loyaltyData.recentTransactions.length > 0 ? (
                loyaltyData.recentTransactions.map((tx) => {
                  const badge = getTxBadge(tx.type);
                  const isPositive = tx.points > 0;

                  return (
                    <div 
                      key={tx._id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                          {badge.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate leading-snug">{tx.description}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-600">Bal: {tx.balanceAfter} PTS</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className={`font-mono font-black text-sm block ${isPositive ? 'text-[#0C831F]' : 'text-rose-600'}`}>
                          {isPositive ? `+${tx.points}` : tx.points} PTS
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isPositive ? `+₹${(tx.points * 0.5).toFixed(1)}` : `-₹${(Math.abs(tx.points) * 0.5).toFixed(1)}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 space-y-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Award className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Transactions Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Dine at Siliguri's Chai Addaa, complete meal reviews, or redeem points during checkout to see your passbook activity here.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>How Points Work at Siliguri's Chai Addaa</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Earn points every time you dine. Redeem points directly from your cart drawer for an instant rupee discount on your food bill.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#0C831F] uppercase tracking-wider block">Dining Spend</span>
                  <p className="font-bold text-slate-900">1 PT per ₹10</p>
                  <p className="text-[10px] text-slate-500">Calculated automatically on settled food bills.</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Redemption Value</span>
                  <p className="font-bold text-slate-900">100 PTS = ₹50</p>
                  <p className="text-[10px] text-slate-500">Redeem up to 50% of your cart total.</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Welcome Gift</span>
                  <p className="font-bold text-slate-900">+100 Points Free</p>
                  <p className="text-[10px] text-slate-500">Credited to wallet upon account creation.</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Dining Review</span>
                  <p className="font-bold text-slate-900">+50 Points Bonus</p>
                  <p className="text-[10px] text-slate-500">Awarded each time you rate your table meal.</p>
                </div>
              </div>

              {/* Tier Multipliers */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                <div className="p-2.5 bg-slate-100/70 font-bold text-slate-700 flex justify-between">
                  <span>Tier Multipliers</span>
                  <span>Spend Threshold</span>
                </div>
                <div className="p-2.5 flex justify-between items-center text-slate-800">
                  <div>
                    <span className="font-bold">Standard Guest</span>
                    <span className="text-[10px] text-slate-400 block">1.0x Base Earn Rate</span>
                  </div>
                  <span className="font-mono font-bold text-slate-600">0 - 499 PTS</span>
                </div>
                <div className="p-2.5 flex justify-between items-center text-slate-800">
                  <div>
                    <span className="font-bold text-slate-800">Silver Member</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">1.2x Earn Multiplier</span>
                  </div>
                  <span className="font-mono font-bold text-slate-600">500 - 1,499 PTS</span>
                </div>
                <div className="p-2.5 flex justify-between items-center text-slate-800">
                  <div>
                    <span className="font-bold text-amber-700">Gold Member</span>
                    <span className="text-[10px] text-amber-600 font-bold block">1.5x Earn Multiplier</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700">1,500 - 2,999 PTS</span>
                </div>
                <div className="p-2.5 flex justify-between items-center text-slate-800">
                  <div>
                    <span className="font-bold text-purple-900">Platinum VIP</span>
                    <span className="text-[10px] text-purple-700 font-bold block">2.0x Double Earn Multiplier</span>
                  </div>
                  <span className="font-mono font-bold text-purple-800">3,000+ PTS</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 mt-2 text-center">
          <p className="text-[10px] text-slate-400">
            Siliguri's Chai Addaa Points System • Guaranteed Fairness &amp; Transparent Ledger
          </p>
        </div>
      </div>
    </div>
  );
};
