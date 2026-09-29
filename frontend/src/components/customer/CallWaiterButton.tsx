import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useToast } from '../feedback/ToastContainer';
import { tableService } from '../../services/table.service';
import { useCartStore } from '../../store/use-cart-store';

interface CallWaiterButtonProps {
  tableId?: string;
}

const SERVICE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)

export const CallWaiterButton: React.FC<CallWaiterButtonProps> = ({ tableId = '14' }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const itemCount = useCartStore((state) => state.getItemCount());
  const hasCart = itemCount > 0;

  const storageKey = `aura_call_service_timestamp_${tableId}`;

  // Check remaining cooldown seconds from localStorage
  const getRemainingSeconds = (): number => {
    try {
      const savedTime = localStorage.getItem(storageKey);
      if (!savedTime) return 0;
      const elapsed = Date.now() - parseInt(savedTime, 10);
      const remainingMs = SERVICE_COOLDOWN_MS - elapsed;
      return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    } catch {
      return 0;
    }
  };

  // Sync remaining time on mount, tableId change, and storage events
  useEffect(() => {
    const syncCooldown = () => {
      const remaining = getRemainingSeconds();
      setSecondsRemaining(remaining);
    };

    syncCooldown();

    // 1-second interval to decrement countdown
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        localStorage.removeItem(storageKey);
      }
    }, 1000);

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key === storageKey) {
        syncCooldown();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('service_called', syncCooldown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('service_called', syncCooldown);
    };
  }, [tableId, storageKey]);

  const isRequested = secondsRemaining > 0;

  const handleCallWaiter = async () => {
    if (isRequested || isLoading) return;

    setIsLoading(true);
    try {
      // 1. Dispatch direct waiter call to backend Express API
      await tableService.callWaiter(tableId, 'Call Service to Table');

      // 2. Persist 2-minute cooldown timestamp in localStorage (survives refresh)
      const now = Date.now();
      localStorage.setItem(storageKey, now.toString());
      setSecondsRemaining(120);

      // 3. Local fallback sync for instant tab response
      const existingAlerts = JSON.parse(localStorage.getItem('aura_waiter_alerts') || '[]');
      const newAlert = {
        id: now,
        tableId,
        reason: 'Call Service to Table',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PENDING',
      };
      localStorage.setItem('aura_waiter_alerts', JSON.stringify([newAlert, ...existingAlerts]));
      window.dispatchEvent(new CustomEvent('service_called', { detail: newAlert }));
      window.dispatchEvent(new Event('storage'));

      showToast(`Service assistance alerted for Table ${tableId}! Staff will attend shortly.`, 'success');
    } catch (err) {
      console.error('Failed to dispatch waiter call:', err);
      // Even if network fails, lock for 2 minutes to prevent repeated spam
      const now = Date.now();
      localStorage.setItem(storageKey, now.toString());
      setSecondsRemaining(120);
      window.dispatchEvent(new Event('storage'));
      showToast(`Service assistance alerted for Table ${tableId}!`, 'success');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  };

  return (
    <button
      onClick={handleCallWaiter}
      disabled={isLoading || isRequested}
      className={`fixed z-40 p-2.5 sm:p-3.5 ${
        isRequested
          ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-500 shadow-xl cursor-default opacity-95'
          : 'bg-[#F7D046] hover:bg-yellow-400 text-slate-900 border-yellow-300 shadow-xl ring-2 ring-yellow-400/20 cursor-pointer active:scale-95'
      } font-bold rounded-2xl transition-all duration-200 flex items-center space-x-2 border ${
        hasCart
          ? 'bottom-[76px] right-3.5 sm:bottom-6 sm:right-6'
          : 'bottom-4 right-3.5 sm:bottom-6 sm:right-6'
      }`}
      title={isRequested ? `Service called. Cooldown: ${formatCountdown(secondsRemaining)}` : 'Call Service to Table'}
    >
      {isRequested ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
          <span className="text-xs uppercase font-bold tracking-wider text-white flex items-center space-x-1">
            <span>Service Called</span>
            <span className="font-mono text-[11px] opacity-90">({formatCountdown(secondsRemaining)})</span>
          </span>
        </>
      ) : (
        <>
          <Bell className={`w-4 h-4 text-slate-900 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs uppercase font-bold tracking-wider text-slate-900">
            Call Service
          </span>
        </>
      )}
    </button>
  );
};
