import React, { useState } from 'react';
import { AlertTriangle, X, Check, Ban } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { useToast } from '../feedback/ToastContainer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface OrderCancelModalProps {
  isOpen: boolean;
  orderId: string;
  tableNumber?: string | number;
  cancelledBy?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_REASONS = [
  'Table issue / Guest reassigned',
  'Out of stock item',
  'Customer changed mind',
  'Kitchen response timeout',
  'Duplicate order mistake',
];

export const OrderCancelModal: React.FC<OrderCancelModalProps> = ({
  isOpen,
  orderId,
  tableNumber,
  cancelledBy = 'Staff',
  onClose,
  onSuccess,
}) => {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    const finalReason = selectedReason === 'Other' ? (customReason || 'Cancelled by staff') : selectedReason;
    setIsSubmitting(true);
    try {
      await orderService.cancelOrder(orderId, finalReason, cancelledBy);
      showToast(`Order #${orderId} cancelled successfully`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-aura-obsidian border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl">
              <Ban className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-aura-ivory">Cancel Order #{orderId}</h2>
              {tableNumber && <p className="text-xs text-aura-slate">Table {tableNumber}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-aura-slate hover:text-aura-ivory rounded-xl hover:bg-aura-container">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-xs text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p>Cancelling this order will notify the customer. The table session will be cleared of this pending order so a new order can be placed smoothly.</p>
        </div>

        {/* Preset Reasons */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-aura-slate block">Select Reason for Cancellation:</label>
          <div className="space-y-2">
            {PRESET_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                  selectedReason === reason
                    ? 'bg-red-500/20 border-red-500 text-red-200'
                    : 'bg-aura-container/60 border-aura-border/60 text-aura-ivory hover:border-aura-border'
                }`}
              >
                <span>{reason}</span>
                {selectedReason === reason && <Check className="w-4 h-4 text-red-400" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedReason('Other')}
              className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                selectedReason === 'Other'
                  ? 'bg-red-500/20 border-red-500 text-red-200'
                  : 'bg-aura-container/60 border-aura-border/60 text-aura-ivory hover:border-aura-border'
              }`}
            >
              <span>Other Reason...</span>
              {selectedReason === 'Other' && <Check className="w-4 h-4 text-red-400" />}
            </button>
          </div>

          {selectedReason === 'Other' && (
            <input
              type="text"
              placeholder="Type specific reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border/80 rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-red-500"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-aura-container border border-aura-border text-aura-slate font-bold text-xs uppercase tracking-wider rounded-xl hover:text-aura-ivory transition-all"
          >
            Go Back
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmCancel}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>

      </div>
    </div>
  );
};
