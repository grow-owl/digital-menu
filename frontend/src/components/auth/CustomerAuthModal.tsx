import React, { useState } from 'react';
import { X, User, Phone, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { useAuthStore } from '../../store/use-auth-store';
import { authService } from '../../services/auth.service';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ isOpen, onClose, tableId }) => {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuth } = useAuthStore();

  if (!isOpen) return null;

  const cleanDigits = phone.replace(/\D/g, '').slice(-10);
  const isValidPhone = cleanDigits.length === 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authService.loginWithPhone(cleanDigits, name.trim() || undefined);
      setAuth(data.user, data.token || data.accessToken, tableId, data.refreshToken);

      if (data.isNewUser) {
        showToast(`Welcome to Siliguri Chai Adda, ${data.user.name}!`, 'success');
      } else {
        showToast(`Welcome back, ${data.user.name}!`, 'success');
      }
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Quick login failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-slate-900 font-extrabold text-xl">
            Quick Mobile Access
          </h3>
          <p className="text-xs text-slate-500">
            Log in with your number only: no password required.
          </p>
        </div>

        {/* Benefits badge */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1.5 text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Digital Dining Experience</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-tight">
            Order directly from your table, track live kitchen preparation, and settle bills seamlessly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-slate-500 select-none">
                +91
              </span>
              <input
                type="tel"
                required
                autoFocus
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:bg-white transition-all tracking-wider font-mono"
              />
            </div>
            {phone.length > 0 && !isValidPhone && (
              <p className="text-[10px] text-red-500 mt-1">Please enter a complete 10-digit number</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Your Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidPhone || isSubmitting}
            className="w-full py-3.5 bg-[#0C831F] hover:bg-[#096918] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Verifying...' : 'PROCEED WITH NUMBER'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your number is used strictly for dining service and order updates.</span>
        </div>
      </div>
    </div>
  );
};
export default CustomerAuthModal;
