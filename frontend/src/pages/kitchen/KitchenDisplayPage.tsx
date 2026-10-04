import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Clock, CheckCircle2, AlertCircle, RefreshCw, ChefHat,
  BellRing, BellOff, Ban, LogOut
} from 'lucide-react';
import { useToast } from '../../components/feedback/ToastContainer';
import { useAuthStore } from '../../store/use-auth-store';
import { orderService } from '../../services/order.service';
import { OrderCancelModal } from '../../components/orders/OrderCancelModal';
import { OrderItemCancelModal } from '../../components/orders/OrderItemCancelModal';
import { SILIGURI_MENU_ITEMS } from '../../data/siliguriMenuData';
import { playRestaurantChime } from '../../utils/audioAlert';

// Dynamic Dish Preparation Time Catalog Lookup (Minutes)
const DISH_PREP_MAP = new Map<string, number>(
  SILIGURI_MENU_ITEMS.map((item) => [item.name.toLowerCase().trim(), item.preparationTimeMinutes || 5])
);

const getDishCookMinutes = (name: string, override?: number): number => {
  if (override && override > 0) return override;
  const clean = String(name || '').toLowerCase().trim();
  if (DISH_PREP_MAP.has(clean)) return DISH_PREP_MAP.get(clean)!;
  for (const [k, v] of DISH_PREP_MAP.entries()) {
    if (clean.includes(k) || k.includes(clean)) return v;
  }
  return 5; // standard fallback
};

interface KDSItem {
  name: string;
  quantity: number;
  notes?: string;
  status?: string;
  isPrepared?: boolean;
  cancelReason?: string;
  preparationTimeMinutes?: number;
}

interface KDSTicket {
  id: string; // Order ID (e.g. ORD-1234)
  _id: string; // DB ID
  tableId: string;
  createdAt: string;
  status: 'received' | 'preparing' | 'ready' | 'served' | 'completed';
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState<'cooking' | 'completed'>('cooking');
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cancelModalTicket, setCancelModalTicket] = useState<{ id: string; tableId: string } | null>(null);
  const [cancelItemTarget, setCancelItemTarget] = useState<CancelItemTarget | null>(null);
  const prevTicketsRef = useRef<KDSTicket[]>([]);
  const readySentRef = useRef<Set<string>>(new Set());

  // Retention: 6 Hours, Max 9 Past Completed Orders (FIFO)
  const COMPLETED_RETENTION_MS = 6 * 60 * 60 * 1000;
  const MAX_COMPLETED_ORDERS = 9;

  // Web Audio API Chime for New Order Notification
  const playAudioChime = () => {
    if (!soundEnabled) return;
    playRestaurantChime(0.85);
  };

  const fetchActiveOrders = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const res = await orderService.getKitchenOrders();
      const activeRaw = Array.isArray(res) ? res : (res?.data || []);
      const completedRaw = Array.isArray(res?.completed) ? res.completed : [];

      // Automatically accept any incoming 'received' orders into 'preparing'
      const unaccepted = activeRaw.filter((ord: any) => ord.status === 'received');
      if (unaccepted.length > 0) {
        Promise.all(
          unaccepted.map((ord: any) =>
            orderService.updateOrderStatus(ord.orderId, 'preparing').catch(() => {})
          )
        );
      }

      // Combine active and completed into a deduplicated list
      const combinedRaw = [...activeRaw, ...completedRaw];
      const seen = new Set<string>();
      const deduplicated: any[] = [];
      for (const ord of combinedRaw) {
        const key = ord.orderId || ord._id;
        if (key && !seen.has(key)) {
          seen.add(key);
          deduplicated.push(ord);
        }
      }

      const newTicketList: KDSTicket[] = deduplicated.map((order: any) => ({
        id: order.orderId,
        _id: order._id,
        tableId: order.tableId,
        createdAt: order.createdAt,
        status: order.status === 'received' ? 'preparing' : order.status,
        items: (order.items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity || i.qty || 1,
          notes: i.notes,
          status: i.status === 'received' ? 'preparing' : i.status || 'preparing',
          isPrepared: !!i.isPrepared,
          cancelReason: i.cancelReason,
          preparationTimeMinutes: i.preparationTimeMinutes,
        })),
      }));

      // Detect new incoming tickets (only notify for cooking tickets)
      if (prevTicketsRef.current.length > 0) {
        const prevIds = new Set(prevTicketsRef.current.map((t) => t.id));
        const newlyArrived = newTicketList.filter(
          (t) => !prevIds.has(t.id) && !isTicketReady(t) && t.status !== 'ready' && t.status !== 'served' && t.status !== 'completed'
        );

        if (newlyArrived.length > 0) {
          playAudioChime();
          showToast(`🔔 ${newlyArrived.length} New Order Auto-Accepted for Cooking!`, 'success', 'Kitchen Cooking Order');
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
    const pollInterval = setInterval(() => fetchActiveOrders(false), 5000);
    const clockInterval = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, []);

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

  const getTicketMaxCookSecs = (ticket: KDSTicket) => {
    const active = ticket.items.filter((it) => it.status !== 'cancelled');
    if (active.length === 0) return 0;
    return Math.max(...active.map((it) => getDishCookMinutes(it.name, it.preparationTimeMinutes) * 60));
  };

  const isTicketReady = (ticket: KDSTicket) => {
    const active = ticket.items.filter((it) => it.status !== 'cancelled');
    if (active.length === 0) return true;
    const elapsed = getElapsedSeconds(ticket.createdAt);
    return active.every((it) => {
      const cookSecs = getDishCookMinutes(it.name, it.preparationTimeMinutes) * 60;
      return it.status === 'served' || it.isPrepared || elapsed >= cookSecs;
    });
  };

  const isTicketCompleted = (ticket: KDSTicket) => {
    if (ticket.status === 'served' || ticket.status === 'completed' || ticket.status === 'ready') return true;
    return isTicketReady(ticket);
  };

  // Automatically sync ready tickets with backend
  useEffect(() => {
    tickets.forEach((ticket) => {
      if (isTicketReady(ticket)) {
        if (ticket.status !== 'ready' && ticket.status !== 'served' && ticket.status !== 'completed' && !readySentRef.current.has(ticket.id)) {
          readySentRef.current.add(ticket.id);
          orderService.updateOrderStatus(ticket.id, 'ready')
            .then(() => {
              setTickets((prev) =>
                prev.map((t) => (t.id === ticket.id ? { ...t, status: 'ready' } : t))
              );
              try {
                localStorage.setItem('aura_last_order_status_update', JSON.stringify({
                  orderId: ticket.id,
                  tableId: ticket.tableId,
                  status: 'ready',
                  timestamp: Date.now()
                }));
                window.dispatchEvent(new CustomEvent('order_status_updated', {
                  detail: { orderId: ticket.id, tableId: ticket.tableId, status: 'ready' }
                }));
                window.dispatchEvent(new Event('storage'));
              } catch (e) {
                console.warn('Storage sync err:', e);
              }
            })
            .catch((err) => {
              console.warn('Auto ready ticket err:', err);
              readySentRef.current.delete(ticket.id);
            });
        }
      }
    });
  }, [nowTimestamp, tickets]);


  // 1. Cooking Tickets: Active cooking dishes only (leaves as soon as ready)
  const cookingTickets = tickets.filter((t) => !isTicketCompleted(t));

  // 2. Completed Tickets: Retained for up to 6 hours, max 9 orders (FIFO)
  const completedTickets = tickets
    .filter((t) => {
      if (!isTicketCompleted(t)) return false;
      const ageMs = Math.max(0, nowTimestamp - new Date(t.createdAt).getTime());
      return ageMs <= COMPLETED_RETENTION_MS;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_COMPLETED_ORDERS);

  const displayedTickets = filterStatus === 'cooking' ? cookingTickets : completedTickets;

  const now = new Date(nowTimestamp);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="page-theme-kitchen flex flex-col h-full min-h-0 w-full font-sans text-theme-text bg-theme-bg overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          TOP STATION CONTROL BAR (Compact, Glare-Resistant, Full Width)
      ───────────────────────────────────────────────────────────────── */}
      <div className="bg-theme-surface/95 backdrop-blur-md border-b border-theme-border px-3 sm:px-6 pt-3 pb-3.5 sm:py-3.5 space-y-3 flex-shrink-0 z-20 shadow-sm">
        {/* Row 1: Station Identity, Live Station Clock, Audio Alarm & Sync */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-4 h-4 text-theme-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="font-serif text-sm sm:text-base font-black text-white tracking-wide truncate">
                  KITCHEN
                </h1>
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
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  playRestaurantChime(0.85);
                  showToast('🔔 Kitchen alarm enabled & sound tested!', 'info');
                } else {
                  showToast('🔇 Kitchen alarm muted', 'info');
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-theme-bg text-slate-400 border-slate-800'
              }`}
              title={soundEnabled ? 'Kitchen Alarm ON (Tap to Mute)' : 'Alarm Muted (Tap to Enable)'}
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

            <button
              onClick={() => {
                useAuthStore.getState().logout();
                navigate('/');
                showToast('Kitchen signed out', 'info');
              }}
              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold cursor-pointer shadow-sm"
              title="Sign Out Kitchen"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline text-[11px]">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Row 2: Queue Filter Tabs */}
        <div className="flex items-center">
          {/* Filter Pills — 2 equal columns: Cooking Now (Default), Completed */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:space-x-2 py-0.5">
            <button
              onClick={() => setFilterStatus('cooking')}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 border cursor-pointer ${
                filterStatus === 'cooking'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-theme-bg text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>Cooking Now</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                {cookingTickets.length}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 border cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-black ring-1 ring-emerald-400/50'
                  : 'bg-theme-bg text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Completed</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MAIN PANEL: High-Contrast Aviation Ticket Grid (Full Screen Width)
      ───────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-6 space-y-3 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {filterStatus === 'cooking' ? (
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            )}
            <h2 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide truncate">
              {filterStatus === 'cooking' ? 'Active Cooking Line' : 'Completed Dishes'}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] sm:text-xs font-bold shrink-0">
              {displayedTickets.length} Tickets
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-slate-400">
            {filterStatus === 'completed' ? (
              <span className="text-emerald-400 font-semibold">Past 9 Completed Orders (6h Retention)</span>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live Active Cooking Pass</span>
              </>
            )}
          </div>
        </div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="py-16 sm:py-24 text-center space-y-4 bg-[#0A0D15] rounded-3xl border border-slate-800 p-4 sm:p-8 max-w-md mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              {filterStatus === 'cooking' ? (
                <ChefHat className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <h2 className="font-serif text-xl font-bold text-white">
              {filterStatus === 'cooking' ? 'Cooking Line Clear' : 'No Completed Orders Yet'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {filterStatus === 'cooking'
                ? 'All active orders are prepped! No pending dishes on the stove.'
                : 'Completed dishes will appear here (retained for up to 6 hours, max past 9 orders).'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {displayedTickets.map((ticket) => {
              const elapsedSecs = getElapsedSeconds(ticket.createdAt);
              const urgency = getUrgencyConfig(elapsedSecs);
              const isTicketDone = isTicketCompleted(ticket);

              // Map each dish with its cooking duration and auto-done calculation
              const itemsWithStatus = ticket.items.map((item, originalIdx) => {
                const cookMins = getDishCookMinutes(item.name, item.preparationTimeMinutes);
                const cookSecs = cookMins * 60;
                const isCancelled = item.status === 'cancelled';
                const isAutoDone = !isCancelled && elapsedSecs >= cookSecs;
                const isDone = isTicketDone || isCancelled ? false : (item.status === 'served' || item.isPrepared || isAutoDone);
                const finalDone = isCancelled ? false : (isTicketDone || isDone);
                const remainingSecs = Math.max(0, cookSecs - elapsedSecs);
                return {
                  item,
                  originalIdx,
                  cookMins,
                  cookSecs,
                  isCancelled,
                  isAutoDone,
                  isDone: finalDone,
                  remainingSecs
                };
              });

              const activeItemsWithStatus = itemsWithStatus.filter((x) => !x.isCancelled);
              const doneCount = activeItemsWithStatus.filter((x) => x.isDone).length;
              const totalItems = activeItemsWithStatus.length;

              return (
                <div
                  key={ticket.id}
                  className={`bg-[#0A0D15] border rounded-2xl p-3 sm:p-5 space-y-3 sm:space-y-4 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden ${
                    isTicketDone
                      ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                      : urgency.cardBorder
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
                              isTicketDone
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isTicketDone ? 'COMPLETED' : 'IN PREP'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-xs text-slate-400 font-bold">
                            #{ticket.id}
                          </span>
                          {isTicketDone && (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                              • Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-xs text-slate-300 block font-mono font-bold">
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
                          {isTicketDone ? 'Dishes' : 'Active Dishes'} ({totalItems}
                          {ticket.items.length !== totalItems ? ` • ${ticket.items.length - totalItems} Cancelled` : ''})
                        </span>
                        <span className={isTicketDone ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {totalItems === 0 ? 'All 86\'d' : isTicketDone ? 'All Done' : `${doneCount}/${totalItems} Done`}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {itemsWithStatus.map(({ item, originalIdx, cookMins, isCancelled, isDone, remainingSecs }) => {
                          if (isCancelled) {
                            return (
                              <div
                                key={originalIdx}
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
                              key={originalIdx}
                              className={`p-3 rounded-xl border transition-all flex items-start justify-between space-x-2 select-none ${
                                isDone
                                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                  : 'bg-[#07090E] border-slate-800/90 text-white'
                              }`}
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className={`w-5 h-5 text-xs font-mono font-bold rounded flex items-center justify-center flex-shrink-0 border ${
                                    isDone
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  }`}>
                                    {item.quantity}x
                                  </span>
                                  <span className={`font-bold text-xs leading-tight truncate ${isDone ? 'text-emerald-300/90' : 'text-white'}`}>
                                    {item.name}
                                  </span>
                                  {isDone ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] font-bold shrink-0 uppercase flex items-center space-x-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Done ({cookMins}m)</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[9px] font-bold shrink-0 uppercase flex items-center space-x-1">
                                      <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                                      <span>Cooking ({cookMins}m)</span>
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <div className="flex items-center space-x-1 pt-0.5 text-[10px] text-amber-400 font-medium italic">
                                    <Flame className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                    <span>Note: {item.notes}</span>
                                  </div>
                                )}
                              </div>

                              {!isTicketDone && (
                                <div className="flex items-center space-x-2 shrink-0">
                                  {/* Chef 86 / Cancel Dish Action */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCancelItemTarget({
                                        orderId: ticket.id,
                                        tableId: ticket.tableId,
                                        itemIndex: originalIdx,
                                        itemName: item.name,
                                        itemQuantity: item.quantity,
                                      });
                                    }}
                                    title="Cancel / 86 this dish"
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Controls: Only for cooking tickets */}
                  {!isTicketDone && (
                    <div className="pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => setCancelModalTicket({ id: ticket.id, tableId: ticket.tableId })}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Void / Cancel Ticket</span>
                      </button>
                    </div>
                  )}
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
