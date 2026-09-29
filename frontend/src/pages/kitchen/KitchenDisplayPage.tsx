import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Clock, CheckCircle2, AlertCircle, RefreshCw, ChefHat, Filter,
  CheckSquare, Square, BellRing, BellOff, Sparkles, Lock, ArrowRight,
  Activity, Timer, ShieldAlert, Check, Ban, UtensilsCrossed
} from 'lucide-react';
import { useToast } from '../../components/feedback/ToastContainer';
import { orderService } from '../../services/order.service';
import { OrderCancelModal } from '../../components/orders/OrderCancelModal';
import { OrderItemCancelModal } from '../../components/orders/OrderItemCancelModal';

interface KDSItem {
  name: string;
  quantity: number;
  notes?: string;
  status?: string;
  isPrepared?: boolean;
  cancelReason?: string;
}

interface KDSTicket {
  id: string; // Order ID (e.g. ORD-1234)
  _id: string; // DB ID
  tableId: string;
  createdAt: string;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  items: KDSItem[];
}

interface CancelItemTarget {
  orderId: string;
  tableId: string;
  itemIndex: number;
  itemName: string;
  itemQuantity: number;
}

export const KitchenDisplayPage: React.FC = () => {
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'received' | 'preparing'>('ALL');
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cancelModalTicket, setCancelModalTicket] = useState<{ id: string; tableId: string } | null>(null);
  const [cancelItemTarget, setCancelItemTarget] = useState<CancelItemTarget | null>(null);

  // Track individual item check state: `${ticketId}-${itemIndex}` -> boolean
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const prevTicketsRef = useRef<KDSTicket[]>([]);

  // Web Audio API Chime for New Order Notification
  const playAudioChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio policy catch
    }
  };

  const fetchActiveOrders = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const data = await orderService.getActiveOrders();

      // Kitchen KDS shows active tickets needing kitchen preparation ('received' and 'preparing').
      const activeKitchenData = data.filter((ord: any) => ord.status === 'received' || ord.status === 'preparing');

      const newTicketList: KDSTicket[] = activeKitchenData.map((order: any) => ({
        id: order.orderId,
        _id: order._id,
        tableId: order.tableId,
        createdAt: order.createdAt,
        status: order.status,
        items: (order.items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity || i.qty || 1,
          notes: i.notes,
          status: i.status || 'received',
          isPrepared: !!i.isPrepared,
          cancelReason: i.cancelReason,
        })),
      }));

      // Detect new incoming tickets
      if (prevTicketsRef.current.length > 0) {
        const prevIds = new Set(prevTicketsRef.current.map((t) => t.id));
        const newlyArrived = newTicketList.filter((t) => !prevIds.has(t.id));

        if (newlyArrived.length > 0) {
          playAudioChime();
          showToast(`🔔 ${newlyArrived.length} New Kitchen Ticket Received!`, 'success', 'New Kitchen Order');
        }
      }

      prevTicketsRef.current = newTicketList;
      setTickets(newTicketList);
      if (isManual) showToast('Kitchen KDS stream synced', 'info');
    } catch (error) {
      console.error('Failed to fetch kitchen orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    const pollInterval = setInterval(() => fetchActiveOrders(false), 3000);
    const clockInterval = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'preparing');
      showToast(`Order #${orderId} accepted: cooking started!`, 'success');
      fetchActiveOrders();
    } catch (error) {
      showToast(`Failed to start order #${orderId}`, 'error');
    }
  };

  const handleConfirmAllReady = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'ready');
      showToast(`Order #${orderId} ready: dispatched to service pass!`, 'success');
      fetchActiveOrders();
    } catch (error) {
      showToast(`Failed to confirm order #${orderId}`, 'error');
    }
  };

  const toggleItemDone = async (ticketId: string, itemIndex: number, currentStatus?: string, currentIsPrepared?: boolean) => {
    if (currentStatus === 'served') return;
    const key = `${ticketId}-${itemIndex}`;
    const nextState = !currentIsPrepared && !checkedItems[key];
    setCheckedItems((prev) => ({ ...prev, [key]: nextState }));

    try {
      await orderService.checkOrderItem(ticketId, itemIndex, nextState);
    } catch (e) {
      // Silence background error
    }
  };

  const getElapsedSeconds = (createdAt: string) => {
    const diffMs = Math.max(0, nowTimestamp - new Date(createdAt).getTime());
    return Math.floor(diffMs / 1000);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getUrgencyConfig = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    if (mins < 8) {
      return {
        badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        cardBorder: 'border-slate-800 hover:border-emerald-500/50',
        accentColor: 'text-emerald-400',
        label: 'ON TIME'
      };
    }
    if (mins < 15) {
      return {
        badgeStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        cardBorder: 'border-amber-500/40 hover:border-amber-500',
        accentColor: 'text-amber-400',
        label: 'RUSH'
      };
    }
    return {
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse font-black',
      cardBorder: 'border-rose-500 ring-2 ring-rose-500/30',
      accentColor: 'text-rose-400',
      label: 'CRITICAL OVERDUE'
    };
  };

  const filteredTickets = tickets.filter(
    (t) => filterStatus === 'ALL' || t.status === filterStatus
  );

  const activeCount = tickets.length;
  const receivedCount = tickets.filter((t) => t.status === 'received').length;
  const preparingCount = tickets.filter((t) => t.status === 'preparing').length;
  const overdueCount = tickets.filter((t) => getElapsedSeconds(t.createdAt) > 900).length;

  const now = new Date(nowTimestamp);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="page-theme-kitchen flex flex-col h-full min-h-0 w-full font-sans text-theme-text bg-theme-bg overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          TOP STATION CONTROL BAR (Compact, Glare-Resistant, Full Width)
      ───────────────────────────────────────────────────────────────── */}
      <div className="bg-theme-surface/95 backdrop-blur-md border-b border-theme-border px-3 sm:px-6 py-2.5 space-y-2.5 flex-shrink-0 z-20 shadow-sm">
        {/* Row 1: Station Identity, Live Station Clock, Audio Alarm & Sync */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-4 h-4 text-theme-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="font-serif text-sm sm:text-base font-black text-white tracking-wide truncate">
                  KITCHEN DISPLAY
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              </div>
              <p className="text-[10px] text-emerald-400 font-mono font-bold hidden sm:block">LIVE • 3s Stream • MAIN PASS</p>
            </div>
          </div>

          {/* Station Clock */}
          <div className="px-3 py-1 bg-theme-bg rounded-xl border border-theme-border text-center hidden md:flex items-center space-x-2 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-theme-primary" />
            <span className="font-mono text-base font-black text-theme-primary tracking-widest">{timeStr}</span>
            <span className="text-[10px] text-theme-muted font-mono uppercase">• {dateStr}</span>
          </div>

          {/* Right Controls: Alarm & Refresh */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-theme-bg text-slate-400 border-slate-800'
              }`}
              title={soundEnabled ? 'Kitchen Alarm ON' : 'Alarm Muted'}
            >
              {soundEnabled ? (
                <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'Alarm ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => fetchActiveOrders(true)}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold cursor-pointer shadow-sm"
              title="Sync Kitchen Pass"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline text-[11px]">Sync</span>
            </button>
          </div>
        </div>

        {/* Row 2: Queue Filter Tabs & Live Station Metrics */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1.5 pt-0.5">
          {/* Filter Pills */}
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white border-slate-600 shadow-md font-black'
                : 'bg-theme-bg text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>All Active</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-800 font-bold">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('received')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              filterStatus === 'received'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                : 'bg-theme-bg text-blue-400 border-blue-500/30 hover:bg-blue-500/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Incoming</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-950/60 border border-blue-800 text-blue-300 font-bold">
              {receivedCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              filterStatus === 'preparing'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md font-black'
                : 'bg-theme-bg text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cooking Now</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 font-bold">
              {preparingCount}
            </span>
          </button>

          <div className="h-4 w-px bg-theme-border flex-shrink-0 mx-1" />

          {/* Quick Metrics Badges */}
          <div className="flex items-center space-x-1.5 text-[11px] font-mono whitespace-nowrap">
            <span className="px-2 py-1 rounded-lg bg-theme-bg border border-theme-border text-slate-300 font-bold">
              Orders: <strong className="text-white font-mono">{activeCount}</strong>
            </span>
            <span className="px-2 py-1 rounded-lg bg-theme-bg border border-blue-500/30 text-blue-400 font-bold">
              New: <strong className="font-mono">{receivedCount}</strong>
            </span>
            <span className="px-2 py-1 rounded-lg bg-theme-bg border border-amber-500/30 text-amber-400 font-bold">
              Cooking: <strong className="font-mono">{preparingCount}</strong>
            </span>
            {overdueCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-rose-950/30 border border-rose-500/60 text-rose-400 font-bold animate-pulse">
                Overdue: <strong className="font-mono">{overdueCount}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MAIN PANEL: High-Contrast Aviation Ticket Grid (Full Screen Width)
      ───────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="font-serif text-lg font-bold text-white tracking-wide">
              {filterStatus === 'ALL'
                ? 'Live Cooking Pass'
                : filterStatus === 'received'
                ? 'New Incoming Orders'
                : 'Active Cooking Line'}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold">
              {filteredTickets.length} Tickets
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>High-Contrast Glare Resistant Terminal</span>
          </div>
        </div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 sm:py-24 text-center space-y-4 bg-[#0A0D15] rounded-3xl border border-slate-800 p-6 sm:p-8 max-w-md mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <ChefHat className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-xl font-bold text-white">Kitchen Line Clear</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              No tickets in the <span className="text-amber-400 font-bold uppercase">{filterStatus}</span> queue. All dishes prepped and dispatched!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {filteredTickets.map((ticket) => {
              const elapsedSecs = getElapsedSeconds(ticket.createdAt);
              const timerFormatted = formatTimer(elapsedSecs);
              const urgency = getUrgencyConfig(elapsedSecs);

              const activeItems = ticket.items.filter((it) => it.status !== 'cancelled');
              const checkedCount = activeItems.filter(
                (it) => {
                  const originalIdx = ticket.items.indexOf(it);
                  return checkedItems[`${ticket.id}-${originalIdx}`] || it.status === 'served' || it.isPrepared;
                }
              ).length;
              const totalItems = activeItems.length;
              const isAllChecked = totalItems > 0 && checkedCount === totalItems;

              return (
                <div
                  key={ticket.id}
                  className={`bg-[#0A0D15] border rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden ${
                    ticket.status === 'preparing'
                      ? isAllChecked
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : urgency.cardBorder
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3 sm:space-y-4">
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-serif text-2xl font-black text-white tracking-tight">
                            Table {ticket.tableId}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              ticket.status === 'received'
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {ticket.status === 'received' ? 'NEW' : 'IN PREP'}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          #{ticket.id}
                        </span>
                      </div>

                      <div className="text-right space-y-1">
                        <div
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${urgency.badgeStyle}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timerFormatted}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {new Date(ticket.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Item Checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider px-1">
                        <span>
                          Active Dishes ({totalItems}
                          {ticket.items.length !== totalItems ? ` • ${ticket.items.length - totalItems} Cancelled` : ''})
                        </span>
                        <span className={isAllChecked ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {totalItems === 0 ? 'All 86\'d' : `${checkedCount}/${totalItems} Done`}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {ticket.items.map((item, idx) => {
                          const itemKey = `${ticket.id}-${idx}`;
                          const isCancelled = item.status === 'cancelled';
                          const isServed = item.status === 'served';
                          const isDone = isServed || item.isPrepared || !!checkedItems[itemKey];

                          if (isCancelled) {
                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300/80 flex items-start justify-between space-x-2 select-none"
                              >
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-5 h-5 bg-rose-500/20 text-rose-400 text-xs font-mono font-bold rounded flex items-center justify-center flex-shrink-0 border border-rose-500/40">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-bold text-xs leading-tight truncate line-through text-rose-300/70">
                                      {item.name}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[9px] font-bold shrink-0 uppercase">
                                      86'D / CANCELLED
                                    </span>
                                  </div>
                                  {item.cancelReason && (
                                    <p className="text-[10px] text-rose-400/90 font-medium italic pl-7">
                                      Reason: {item.cancelReason}
                                    </p>
                                  )}
                                </div>
                                <Ban className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                              </div>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (ticket.status !== 'received' && !isServed) {
                                  toggleItemDone(ticket.id, idx, item.status, item.isPrepared);
                                }
                              }}
                              className={`p-3 rounded-xl border transition-all flex items-start justify-between space-x-2 select-none ${
                                isServed
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300/80 cursor-default opacity-80'
                                  : ticket.status === 'received'
                                  ? 'bg-[#07090E] border-slate-800 text-slate-300 cursor-not-allowed opacity-90'
                                  : isDone
                                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through cursor-pointer'
                                  : 'bg-[#07090E] border-slate-800/90 text-white hover:border-slate-700 cursor-pointer'
                              }`}
                            >
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="w-5 h-5 bg-amber-500/15 text-amber-400 text-xs font-mono font-bold rounded flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold text-xs leading-tight truncate">{item.name}</span>
                                </div>
                                {item.notes && (
                                  <div className="flex items-center space-x-1 pt-1 text-[10px] text-amber-400 font-medium italic">
                                    <Flame className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                    <span>Note: {item.notes}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                {/* Chef 86 / Cancel Dish Action */}
                                {!isServed && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCancelItemTarget({
                                        orderId: ticket.id,
                                        tableId: ticket.tableId,
                                        itemIndex: idx,
                                        itemName: item.name,
                                        itemQuantity: item.quantity,
                                      });
                                    }}
                                    title="Cancel / 86 this dish"
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {isServed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                ) : ticket.status !== 'received' ? (
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isDone ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-600" />
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Controls */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    {/* Accept Order */}
                    {ticket.status === 'received' && (
                      <button
                        onClick={() => handleAcceptOrder(ticket.id)}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Accept &amp; Fire Cook</span>
                      </button>
                    )}

                    {/* Dispatch Order */}
                    {ticket.status === 'preparing' && (
                      <div className="space-y-1.5">
                        {!isAllChecked ? (
                          <div className="space-y-1">
                            <button
                              disabled
                              className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed opacity-70"
                            >
                              <Lock className="w-4 h-4 text-amber-400" />
                              <span>Check Off All ({checkedCount}/{totalItems})</span>
                            </button>
                            <p className="text-[10px] text-amber-400/90 text-center font-mono">
                              Check off all dishes above to unlock dispatch
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmAllReady(ticket.id)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-emerald-900/30 animate-pulse cursor-pointer"
                          >
                            <Check className="w-4 h-4 font-black" />
                            <span>Dispatch to Waiter Pass</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cancel Order */}
                    <button
                      onClick={() => setCancelModalTicket({ id: ticket.id, tableId: ticket.tableId })}
                      className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Void / Cancel Ticket</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Authority Order Cancel Modal */}
      {cancelModalTicket && (
        <OrderCancelModal
          isOpen={!!cancelModalTicket}
          orderId={cancelModalTicket.id}
          tableNumber={cancelModalTicket.tableId}
          cancelledBy="Head Chef"
          onClose={() => setCancelModalTicket(null)}
          onSuccess={() => fetchActiveOrders(true)}
        />
      )}

      {/* Chef Item Cancel Modal */}
      {cancelItemTarget && (
        <OrderItemCancelModal
          isOpen={!!cancelItemTarget}
          orderId={cancelItemTarget.orderId}
          tableNumber={cancelItemTarget.tableId}
          itemIndex={cancelItemTarget.itemIndex}
          itemName={cancelItemTarget.itemName}
          itemQuantity={cancelItemTarget.itemQuantity}
          cancelledBy="Executive Chef"
          onClose={() => setCancelItemTarget(null)}
          onSuccess={() => fetchActiveOrders(true)}
        />
      )}
    </div>
  );
};

export default KitchenDisplayPage;
