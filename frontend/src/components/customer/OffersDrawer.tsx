import React, { useState, useEffect } from 'react';
import { X, Tag, Copy, Loader, Sparkles } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { couponService } from '../../services/coupon.service';
import { Coupon } from '../../types/menu.types';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { motion, AnimatePresence } from 'framer-motion';

interface OffersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OffersDrawer: React.FC<OffersDrawerProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const { showToast } = useToast();
  const [offers, setOffers] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
    }
  }, [isOpen]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await couponService.getAllCoupons();
      setOffers(data);
    } catch (error) {
      console.error('Failed to load Offers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon "${code}" copied to clipboard!`, 'success');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="offers-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.div
            key="offers-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-full md:max-w-md bg-white md:border-l border-slate-200 h-full flex flex-col shadow-2xl relative text-slate-800"
          >
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#0C831F] shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Active Offers &amp; Deals</h2>
              <p className="text-xs text-slate-500">Exclusive dining discounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#0C831F]" /></div>
          ) : offers.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No active offers currently</p>
              <p className="text-xs text-slate-400">Check back soon for seasonal specials and chef promotions!</p>
            </div>
          ) : (
            offers.map((offer, i) => (
              <div key={i} className="relative bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all rounded-2xl p-5 overflow-hidden shadow-sm group">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0C831F] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider font-extrabold">Instant Savings</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1">{offer.description}</h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-4">Min Order: ₹{offer.minOrderAmount}</p>
                
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5 pl-4 shadow-inner">
                  <span className="font-mono font-black text-[#0C831F] tracking-widest text-sm">{offer.code}</span>
                  <button 
                    onClick={() => handleCopy(offer.code)}
                    className="bg-emerald-50 hover:bg-[#0C831F] text-[#0C831F] hover:text-white border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer active:scale-95 text-xs font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default OffersDrawer;
