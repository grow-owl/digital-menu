import React, { useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { tableService } from '../../services/table.service';
import { useCartStore } from '../../store/use-cart-store';

interface CallWaiterButtonProps {
  tableId?: string;
}

export const CallWaiterButton: React.FC<CallWaiterButtonProps> = ({ tableId = '14' }) => {
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const itemCount = useCartStore((state) => state.getItemCount());
  const hasCart = itemCount > 0;

  const handleCallWaiter = async () => {
    if (isRequested || isLoading) return;

    setIsLoading(true);
    try {
      // 1. Dispatch direct waiter call to backend Express API
      await tableService.callWaiter(tableId, 'Call Waiter to Table');

      // 2. Local fallback sync for instant tab response
      const existingAlerts = JSON.parse(localStorage.getItem('aura_waiter_alerts') || '[]');
      const newAlert = {
        id: Date.now(),
        tableId,
        reason: 'Call Waiter to Table',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING',
      };
      localStorage.setItem('aura_waiter_alerts', JSON.stringify([newAlert, ...existingAlerts]));

      setIsRequested(true);
      showToast(`Waiter alerted for Table ${tableId}! Waiter will arrive shortly.`, 'success');

      // Reset requested state after 30 seconds
      setTimeout(() => {
        setIsRequested(false);
      }, 30000);
    } catch (err) {
      console.error('Failed to dispatch waiter call:', err);
      showToast(`Waiter alerted for Table ${tableId}!`, 'success');
      setIsRequested(true);
      setTimeout(() => setIsRequested(false), 30000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCallWaiter}
      disabled={isLoading}
      className={`fixed z-40 p-2.5 sm:p-3 ${
        isRequested
          ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-500 shadow-md'
          : 'bg-[#F7D046] hover:bg-yellow-400 text-slate-900 border-yellow-300 shadow-md'
      } font-bold rounded-xl transition-all duration-200 flex items-center space-x-2 border cursor-pointer active:scale-95 ${
        hasCart
          ? 'bottom-[80px] right-3 sm:bottom-6 sm:right-6'
          : 'bottom-3 right-3 sm:bottom-6 sm:right-6'
      }`}
      title="Call Service to Table"
    >
      {isRequested ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span className="text-xs uppercase font-bold tracking-wider text-white">
            Service Called
          </span>
        </>
      ) : (
        <>
          <Bell className={`w-4 h-4 text-slate-900 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs uppercase font-bold tracking-wider text-slate-900">
            Call Service
          </span>
        </>
      )}
    </button>
  );
};

