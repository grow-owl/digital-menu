import React, { useState } from 'react';
import { CartItem } from '../../types/menu.types';
import { Coffee, ShieldCheck, X, Clock, Loader2, Phone, User as UserIcon, Sparkles, CheckCircle2, Edit2 } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useAuthStore } from '../../store/use-auth-store';
import { authService } from '../../services/auth.service';
import { useToast } from '../feedback/ToastContainer';

interface OrderConfirmationModalProps {
  tableId: string;
  isOpen: boolean;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  onConfirm: (phone?: string, name?: string) => Promise<void> | void;
  onCancel: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  tableId,
  isOpen,
  items,
  subtotal,
  gstAmount,
  grandTotal,
  onConfirm,
  onCancel,
}) => {
  const { user, setAuth } = useAuthStore();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [name, setName] = useState(user?.name || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  const cleanDigits = phone.replace(/\D/g, '').slice(-10);
  const isPhoneValid = cleanDigits.length === 10;
  const isIdentified = !!user?.phone && !isEditingPhone;

  const handleConfirmClick = async () => {
    if (isSubmitting) return;

    // Strict validation: Mobile number is mandatory to place order
    if (!isIdentified && !isPhoneValid) {
      showToast('A valid 10-digit mobile number is mandatory to place your order.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhone = user?.phone || cleanDigits;
      let finalName = user?.name || name.trim() || undefined;

      // If user wasn't logged in, log in / enroll with number only
      if (!user?.phone || isEditingPhone) {
        const authData = await authService.loginWithPhone(cleanDigits, name.trim() || undefined);
        setAuth(authData.user, authData.token || authData.accessToken, tableId, authData.refreshToken);
        finalPhone = authData.user.phone;
        finalName = authData.user.name;

        if (authData.isNewUser) {
          showToast(`Welcome to Siliguri's Chai Addaa, ${authData.user.name || 'guest'}!`, 'success');
        }
      }

      await onConfirm(finalPhone, finalName);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[92vh] overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full disabled:opacity-40 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0C831F] flex items-center justify-center text-white shadow-md shadow-emerald-900/15 shrink-0">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Confirm Table Order</h3>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full mt-0.5">
              Ordering for Table {tableId}
            </span>
          </div>
        </div>

        {/* Customer Mobile Number Section (Formatted cleanly for mobile without wrapping) */}
        {isIdentified ? (
          <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-[#0C831F] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                    +91 {user?.phone}
                  </span>
                  {user?.name && (
                    <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[120px] whitespace-nowrap">
                      ({user.name})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditingPhone(true);
                setPhone(user?.phone || '');
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change</span>
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center space-x-1.5 text-xs font-black text-slate-900 uppercase tracking-wide">
                <Phone className="w-3.5 h-3.5 text-[#0C831F]" />
                <span>Mobile Number</span>
                <span className="text-red-500 text-[10px] font-bold">* Required</span>
              </label>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug">
              Required for live kitchen updates &amp; digital table receipt.
            </p>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-black text-slate-600 font-mono select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-11 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all tracking-wider font-mono shadow-sm"
                />
              </div>

              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Order Items Preview */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item, idx) => {
            const itemTotal = (item.unitPrice ?? item.menuItem.price) * item.quantity;
            return (
              <div key={idx} className="p-2.5 sm:p-3 bg-slate-50/90 border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-2xs">
                {/* Item Name & Item Total Price on Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {item.quantity}x {item.menuItem.name}
                    </p>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        (₹{(item.unitPrice ?? item.menuItem.price).toFixed(2)} each)
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[#0C831F] font-black text-xs sm:text-sm shrink-0">
                    ₹{itemTotal.toFixed(2)}
                  </span>
                </div>

                {/* Add-ons Chips or Notes Display Below */}
                {item.addonNames && item.addonNames.length > 0 ? (
                  <div className="p-2 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-800 block">
                      Customized Add-ons:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.addonNames.map((addon, aIdx) => (
                        <span
                          key={aIdx}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-semibold border border-emerald-200/80 break-words"
                        >
                          {addon}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : item.specialNotes ? (
                  <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[10px] text-amber-900 font-medium leading-relaxed break-words">
                    <span className="font-bold text-amber-800">Note: </span>
                    <span>{item.specialNotes}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Tax & Discount Breakdown */}
        <div className="border-t border-slate-200 pt-2.5 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-mono text-slate-700">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>GST (5%)</span>
            <span className="font-mono text-slate-700">₹{gstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Total Active Bill</span>
            <span className="font-mono text-[#0C831F] font-black text-xl">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmClick}
            disabled={isSubmitting || (!isIdentified && !isPhoneValid)}
            className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 bg-[#0C831F] hover:bg-[#0a6f1a] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl sm:rounded-2xl text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider transition-all shadow-md shadow-emerald-900/15 flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer active:scale-95 whitespace-nowrap min-w-0"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-1.5 whitespace-nowrap">
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white shrink-0" />
                <span className="whitespace-nowrap">Sending to Kitchen...</span>
              </div>
            ) : !isIdentified && !isPhoneValid ? (
              <span className="whitespace-nowrap">Enter Mobile Number</span>
            ) : (
              <div className="flex items-center justify-center space-x-1.5 whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="whitespace-nowrap font-black">CONFIRM ORDER</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default OrderConfirmationModal;
