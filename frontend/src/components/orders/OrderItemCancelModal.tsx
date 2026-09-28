import React, { useState } from 'react';
import { AlertTriangle, X, Check, UtensilsCrossed } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { useToast } from '../feedback/ToastContainer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface OrderItemCancelModalProps {
  isOpen: boolean;
  orderId: string;
  tableNumber?: string | number;
  itemIndex: number;
  itemName: string;
  itemQuantity: number;
  cancelledBy?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CHEF_PRESET_REASONS = [
  "86'd / Out of Fresh Ingredients",
  'Kitchen Station Delay / Equipment Issue',
  'Preparation / Quality Standard Defect',
  'Customer Requested Dish Cancellation',
  'Chef Pass Allocation Change',
];

export const OrderItemCancelModal: React.FC<OrderItemCancelModalProps> = ({
  isOpen,
  orderId,
  tableNumber,
  itemIndex,
  itemName,
  itemQuantity,
  cancelledBy = 'Executive Chef',
  onClose,
  onSuccess,
}) => {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string>(CHEF_PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmCancelItem = async () => {
    const finalReason = selectedReason === 'Other' ? (customReason || 'Cancelled by Chef') : selectedReason;
    setIsSubmitting(true);
    try {
      const res = await orderService.cancelOrderItem(orderId, itemIndex, finalReason, cancelledBy);
      showToast(res.message || `Cancelled "${itemName}" successfully`, 'success', 'Kitchen Pass Updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel dish', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0A0D15] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl">
              <UtensilsCrossed className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 uppercase tracking-wider">
                  Chef 86 / Cancel Dish
                </span>
              </div>
              <h2 className="font-serif text-lg font-bold text-white mt-1">
                Cancel {itemQuantity}x {itemName}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Order #{orderId} {tableNumber && `• Table ${tableNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3 text-xs text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Immediate Bill & Kitchen Recalculation</p>
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              Cancelling this dish will remove its charge from the customer's bill, recalculate GST, and notify the floor waiter and customer tracking screen immediately.
            </p>
          </div>
        </div>

        {/* Reason Select */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
            Select Kitchen Cancellation Reason:
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {CHEF_PRESET_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                  selectedReason === reason
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{reason}</span>
                {selectedReason === reason && <Check className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedReason('Other')}
              className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                selectedReason === 'Other'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>Other Custom Reason...</span>
              {selectedReason === 'Other' && <Check className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            </button>
          </div>

          {selectedReason === 'Other' && (
            <input
              type="text"
              placeholder="e.g. Broken ramekin, allergen cross-contact risk..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Keep Dish
          </button>
          <button
            type="button"
            onClick={handleConfirmCancelItem}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Updating...</span>
            ) : (
              <>
                <UtensilsCrossed className="w-4 h-4" />
                <span>Confirm Dish Cancel</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
