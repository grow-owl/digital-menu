import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, User, Utensils, Clock, History, Heart, Tag, BookOpen, HelpCircle, LogIn, LogOut, Edit2, Star, FileText, ChevronRight, Sparkles, ShieldCheck, Bell, Zap, Award, Phone
} from 'lucide-react';
import { useAuthStore } from '../../store/use-auth-store';
import { useOrderStore } from '../../store/use-order-store';
import { useCartStore } from '../../store/use-cart-store';
import { useTableStore } from '../../store/use-table-store';
import { tableService } from '../../services/table.service';
import { useToast } from '../feedback/ToastContainer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenHistory: () => void;
  onOpenWishlist?: () => void;
  onOpenReservations?: () => void;
  onOpenOffers: () => void;
  onOpenGallery: () => void;
  onOpenFaq: () => void;
  onOpenProfile: () => void;
  onOpenFeedback?: () => void;
  onOpenLoyalty?: () => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  isOpen,
  onClose,
  tableId,
  onOpenAuth,
  onOpenProfile,
  onOpenCart,
  onOpenHistory,
  onOpenWishlist,
  onOpenOffers,
  onOpenGallery,
  onOpenFaq,
  onOpenFeedback,
  onOpenLoyalty,
}) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activeOrderId } = useOrderStore();
  const { getItemCount } = useCartStore();
  const { activeSessionId } = useTableStore();
  const { showToast } = useToast();

  const handleRequestBill = async () => {
    try {
      const res = await tableService.checkoutSession(tableId || activeSessionId || '10');
      showToast(res.message || 'Bill requested! Waiter will bring invoice to table.', 'success');
      onClose();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Cannot request bill at this time.';
      showToast(errMsg, 'error');
    }
  };

  const handleCallWaiter = async (reason: string) => {
    try {
      await tableService.callWaiter(tableId, reason);
      showToast(`Waiter notified: "${reason}"`, 'success');
      onClose();
    } catch (e) {
      showToast('Waiter alert sent to floor staff.', 'info');
      onClose();
    }
  };

  const cartCount = getItemCount();

  const links = [
    {
      label: 'View Table Cart',
      badge: cartCount > 0 ? `${cartCount} Items` : undefined,
      badgeColor: 'bg-[#0C831F] text-white font-black',
      icon: <Utensils className="w-4 h-4 text-[#0C831F]" />,
      action: () => {
        onClose();
        onOpenCart();
      },
    },
    {
      label: 'Live Order Tracker',
      badge: activeOrderId ? 'LIVE' : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse font-mono',
      icon: <Clock className="w-4 h-4 text-emerald-700" />,
      action: () => {
        if (activeOrderId) {
          onClose();
          navigate(`/order/${activeOrderId}`);
        } else {
          showToast('No active orders to track currently.', 'info');
        }
      },
    },
    {
      label: 'Request Final Bill',
      badge: '1-TAP',
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-300 font-mono',
      icon: <FileText className="w-4 h-4 text-rose-600" />,
      action: () => {
        handleRequestBill();
      },
    },
    {
      label: 'Rate Dining Experience',
      icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
      action: () => {
        if (onOpenFeedback) onOpenFeedback();
      },
    },
    {
      label: 'Order History',
      icon: <History className="w-4 h-4 text-slate-600" />,
      action: () => {
        onClose();
        onOpenHistory();
      },
    },
    {
      label: 'Offers & Coupons',
      badge: 'OFFERS',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono',
      icon: <Tag className="w-4 h-4 text-[#0C831F]" />,
      action: () => {
        onClose();
        onOpenOffers();
      },
    },
    {
      label: 'Restaurant Story & Gallery',
      icon: <BookOpen className="w-4 h-4 text-slate-600" />,
      action: () => {
        onClose();
        onOpenGallery();
      },
    },
    {
      label: 'FAQs & Dining Support',
      icon: <HelpCircle className="w-4 h-4 text-slate-600" />,
      action: () => {
        onClose();
        onOpenFaq();
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-start"
          onClick={onClose}
        >
          <motion.div
            key="sidebar-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-full md:max-w-md bg-white md:border-r border-slate-200 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden text-slate-800"
          >
        {/* Top Header Card */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 relative z-10 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-500 to-[#0C831F] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                {isAuthenticated ? <User className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-sm text-slate-900 tracking-tight">SILIGURI'S</span>
                  <span className="font-extrabold text-[11px] text-[#0C831F] uppercase tracking-wider">CHAI ADDAA</span>
                </div>
                <h3 className="font-bold text-xs text-slate-700 truncate mt-1">
                  {isAuthenticated ? (user?.name || `+91 ${user?.phone}`) : `Table ${tableId} Guest`}
                </h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <div className="px-2 py-0.5 bg-emerald-100/90 text-[9px] uppercase tracking-wider text-emerald-900 rounded-full font-bold flex items-center space-x-1 select-none">
                    <ShieldCheck className="w-3 h-3 text-[#0C831F] inline mr-0.5" />
                    <span>TABLE {tableId} ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {isAuthenticated && (
                <button
                  onClick={() => onOpenProfile()}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-white hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer shadow-2xs active:scale-95"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Waiter Call Shortcuts */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px] font-bold">
            <button
              onClick={() => handleCallWaiter('Water Refill')}
              className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-[#0C831F] rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              <span>Water Refill</span>
            </button>

            <button
              onClick={() => handleCallWaiter('Call Waiter')}
              className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-[#0C831F] rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call Waiter</span>
            </button>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <div className="p-2.5 sm:p-4 flex-1 overflow-y-auto space-y-1 relative z-10 custom-scrollbar">
          {links.map((link, idx) => (
            <button
              key={idx}
              onClick={() => link.action()}
              className="w-full flex items-center justify-between p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-1.5 bg-slate-100 group-hover:bg-white rounded-lg border border-slate-200 shrink-0">
                  {link.icon}
                </div>
                <span className="text-xs font-bold truncate group-hover:text-slate-900">{link.label}</span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {link.badge && (
                  <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Auth / Account Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 space-y-2">
          {!isAuthenticated ? (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-2.5 px-4 bg-[#0C831F] hover:bg-[#096918] text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Quick Login (Number Only)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                logout();
                onClose();
                showToast('Signed out successfully', 'info');
              }}
              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}

          <p className="text-[10px] text-slate-400 font-medium text-center">
            Siliguri's Chai Addaa • Artisan Tea House &amp; Dining
          </p>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default CustomerSidebar;
