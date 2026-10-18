import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Utensils, CheckCircle2, Clock, ArrowLeft, Plus, Minus, ChefHat, ShoppingBag, Receipt,
  Sparkles, Zap, Star, Coffee, Heart, MessageCircle, Flame, CupSoda,
  ArrowRight, Wifi, Check, Award
} from 'lucide-react';
import { CallWaiterButton } from '../../components/customer/CallWaiterButton';
import { DishDetailModal } from '../../components/menu/DishDetailModal';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { useCartStore } from '../../store/use-cart-store';
import { useAuthStore } from '../../store/use-auth-store';
import { useTableStore } from '../../store/use-table-store';
import { useToast } from '../../components/feedback/ToastContainer';
import { orderService } from '../../services/order.service';
import { menuService } from '../../services/menu.service';
import { MenuItem } from '../../types/menu.types';
import { SILIGURI_MENU_ITEMS } from '../../data/siliguriMenuData';
import { parseItemAddonsAndNotes } from '../../utils/addonParser';
import { calculateTicketCookingPipeline, getDishCookMinutes } from '../../utils/kitchenScheduler';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  addonNames?: string[];
  status?: string;
  cancelReason?: string;
}

interface OrderData {
  _id: string;
  orderId: string;
  tableId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  createdAt: string;
}

// Suggested add-ons when order is in kitchen matching Chai Addaa categories
const QUICK_ADD_SUGGESTIONS = [
  { id: 'FRIES', icon: Flame, label: 'Crispy Fries', categorySlug: 'crispy-fries-appetisers', keywords: ['fries', 'crispy', 'appetiser', 'pakora', 'potato'] },
  { id: 'TEA', icon: Coffee, label: 'Hot Chai', categorySlug: 'chai-hot-teas', keywords: ['tea', 'chai', 'brew', 'hot', 'ginger', 'darjeeling'] },
  { id: 'DRINK', icon: CupSoda, label: 'Cold Drinks', categorySlug: 'matcha-boba-shakes', keywords: ['boba', 'shake', 'cold', 'coffee', 'cooler', 'lassi', 'matcha', 'frappe'] },
  { id: 'BITES', icon: Utensils, label: 'Quick Bites', categorySlug: 'burgers-sandwiches', keywords: ['burger', 'sandwich', 'pasta', 'maggie', 'noodles', 'chowmein'] },
];




export const OrderTrackingPage: React.FC = () => {
  const { tableId: paramTableId, orderId } = useParams<{ tableId?: string; orderId?: string }>();
  const activeStoreTableId = useTableStore((state) => state.activeTableId);
  const tableId = activeStoreTableId || paramTableId || '10';
  const navigate = useNavigate();
  const { items, addItem, updateQuantity, clearCart, getItemCount } = useCartStore();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedItems, setSuggestedItems] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [selectedWaitFilter, setSelectedWaitFilter] = useState<'ALL' | 'FRIES' | 'TEA' | 'DRINK' | 'BITES'>('ALL');

  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const suggestedScrollRef = useRef<HTMLDivElement>(null);

  const scrollSuggested = (dir: 'left' | 'right') => {
    if (suggestedScrollRef.current) {
      suggestedScrollRef.current.scrollBy({
        left: dir === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  // Always open page at the very top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [orderId, tableId]);

  // Fetch real menu items
  useEffect(() => {
    menuService.getMenuItems({}).then((menuItems) => {
      const available = menuItems.filter((it) => it.isAvailable !== false);
      setAllMenuItems(available);
      setSuggestedItems(available.slice(0, 6));
    }).catch(() => {});
  }, []);

  const handleSelectWaitFilter = (filterId: 'FRIES' | 'TEA' | 'DRINK' | 'BITES') => {
    if (selectedWaitFilter === filterId) {
      setSelectedWaitFilter('ALL');
      setSuggestedItems(allMenuItems.slice(0, 6));
      return;
    }

    setSelectedWaitFilter(filterId);
    const suggestion = QUICK_ADD_SUGGESTIONS.find((s) => s.id === filterId);
    if (!suggestion) return;

    const matched = allMenuItems.filter((it) => {
      const cat = (it.categoryName || '').toLowerCase();
      const name = (it.name || '').toLowerCase();
      const desc = (it.description || '').toLowerCase();
      return suggestion.keywords.some((kw) => cat.includes(kw) || name.includes(kw) || desc.includes(kw));
    });

    if (matched.length > 0) {
      setSuggestedItems(matched);
    } else {
      setSuggestedItems(allMenuItems.slice(0, 6));
    }
  };

  const [tickTime, setTickTime] = useState(Date.now());

  // Fetch active orders for this table's session
  const fetchTableOrders = async () => {
    try {
      const activeTable = activeStoreTableId || paramTableId || '10';
      const promises: Promise<any>[] = [orderService.getOrdersByTable(activeTable)];
      
      // If tracking a specific order ID, fetch it directly as well to guarantee sync
      if (orderId && orderId !== 'active') {
        promises.push(orderService.getOrder(orderId).catch(() => null));
      }

      const [tableData, specificOrder] = await Promise.all(promises);

      let combined: any[] = Array.isArray(tableData) ? [...tableData] : [];
      if (specificOrder && specificOrder.orderId) {
        const alreadyExists = combined.some(
          (o) => o.orderId === specificOrder.orderId || o._id === specificOrder._id
        );
        if (!alreadyExists) {
          combined.unshift(specificOrder);
        } else {
          // Replace with freshly fetched specific order data
          combined = combined.map((o) =>
            o.orderId === specificOrder.orderId || o._id === specificOrder._id ? specificOrder : o
          );
        }
      }

      const activeSessionOrders = combined.filter(
        (ord: any) => ord.status !== 'cancelled' && ord.paymentStatus !== 'PAID'
      );
      const recentlyCancelled = combined.filter((ord: any) => ord.status === 'cancelled');
      setOrders(activeSessionOrders);
      setCancelledOrders(recentlyCancelled);
    } catch (err) {
      console.error('Failed to fetch table orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableOrders();
    // 5-second polling for responsive live kitchen sync without exhausting rate limits
    const pollInterval = setInterval(fetchTableOrders, 5000);
    // 1-second clock tick for smooth timer / progress progression
    const clockInterval = setInterval(() => setTickTime(Date.now()), 1000);

    const handleSync = () => {
      fetchTableOrders();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('order_status_updated', handleSync);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('order_status_updated', handleSync);
    };
  }, [tableId, orderId, activeStoreTableId]);




  // 3-step live kitchen progress (Received -> Preparing -> Ready)
  const steps = [
    { key: 'received', label: 'Received', desc: 'Sent to kitchen', icon: '1' },
    { key: 'preparing', label: 'Preparing', desc: 'Chef cooking fresh', icon: '2' },
    { key: 'ready', label: 'Ready', desc: 'Ready for table delivery', icon: '3' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'received': return 0;
      case 'preparing': return 1;
      case 'ready':
      case 'completed': return 2;
      default: return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received': return { label: 'Received', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'preparing': return { label: 'In Kitchen', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'ready':
      case 'completed': return { label: 'Ready', color: 'bg-emerald-100 text-[#0C831F] border-emerald-300 font-black' };
      default: return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const resolveOrderStatus = (ord: OrderData | null): string => {
    if (!ord) return 'received';
    if (['ready', 'completed'].includes(ord.status)) return 'ready';
    if (ord.status === 'cancelled') return 'cancelled';
    
    // Check if dishes are prepared or if multi-chef kitchen cooking time has completed
    const activeItems = (ord.items || []).filter((it) => it.status !== 'cancelled');
    if (activeItems.length > 0) {
      const allDone = activeItems.every((it) => it.status === 'ready' || (it as any).isPrepared);
      if (allDone) return 'ready';

      const elapsedSecs = ord.createdAt ? Math.floor((tickTime - new Date(ord.createdAt).getTime()) / 1000) : 0;
      const pipeline = calculateTicketCookingPipeline(ord.items as any, 3);
      if (elapsedSecs >= pipeline.totalEstimatedSeconds) return 'ready';
    }
    return ord.status || 'received';
  };

  const grandSessionTotal = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const targetedOrder = (orderId && orderId !== 'active')
    ? orders.find((o) => o.orderId === orderId || (o as any)._id === orderId) || orders[0] || null
    : orders[0] || null;
  const latestOrder = targetedOrder;
  const latestOrderEffectiveStatus = resolveOrderStatus(latestOrder);

  // Live multi-chef kitchen pipeline computation for customer tracking
  const latestPipeline = latestOrder ? calculateTicketCookingPipeline(latestOrder.items as any, 3) : null;
  const latestElapsedSecs = latestOrder && latestOrder.createdAt ? Math.floor((tickTime - new Date(latestOrder.createdAt).getTime()) / 1000) : 0;
  const latestRemainingSecs = latestPipeline ? Math.max(0, latestPipeline.totalEstimatedSeconds - latestElapsedSecs) : 0;
  const latestRemainingMins = Math.ceil(latestRemainingSecs / 60);

  return (
    <div className="page-theme-customer min-h-screen bg-[#F4F6F8] text-slate-800 pb-36 font-sans">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-sm gap-2">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center space-x-1 sm:space-x-1.5 text-xs font-bold text-slate-600 hover:text-[#0C831F] transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back<span className="hidden xs:inline"> to Menu</span></span>
        </button>

        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-2 h-2 bg-[#0C831F] rounded-full animate-pulse shrink-0" />
          <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
            <span>Table {tableId}</span>
            <span className="hidden sm:inline">: Live Kitchen Tracker</span>
          </h1>
        </div>

        <div className="flex items-center space-x-1 text-[10px] font-bold text-[#0C831F] uppercase tracking-wider shrink-0 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <Wifi className="w-3 h-3" />
          <span>Live Sync</span>
        </div>
      </header>

      <div className="p-3 sm:p-4 max-w-2xl mx-auto space-y-4 pt-3 sm:pt-4">
        {/* Cancelled Order Notice */}
        {cancelledOrders.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 text-xs">Order Update</span>
              <button onClick={() => setCancelledOrders([])} className="text-xs text-rose-600 hover:underline">
                Dismiss
              </button>
            </div>
            {cancelledOrders.map((cOrd: any) => (
              <p key={cOrd._id || cOrd.orderId} className="text-xs text-rose-700">
                Order #{cOrd.orderId} was cancelled ({cOrd.cancelReason || 'Kitchen update'}).
              </p>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <ChefHat className="w-10 h-10 text-[#0C831F] animate-bounce mx-auto" />
            <p className="font-bold text-sm text-slate-700">Connecting to Kitchen Display Systems...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="space-y-4">
            {/* Empty Active Orders */}
            <div className="py-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">No Active Kitchen Orders</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Your Table {tableId} session is currently clear. Ready to order something delicious?
                </p>
              </div>
              <button
                onClick={() => navigate('/menu')}
                className="px-6 py-3 bg-[#0C831F] hover:bg-[#096918] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Open Table Menu</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* === 1. LIVE ORDER TRACKER STEPPER === */}
            {latestOrder && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
                {/* Status color bar */}
                <div
                  className={`h-1.5 w-full transition-all duration-700 ${
                    latestOrderEffectiveStatus === 'received' ? 'bg-amber-400' :
                    latestOrderEffectiveStatus === 'preparing' ? 'bg-[#0C831F]' :
                    latestOrderEffectiveStatus === 'ready' ? 'bg-[#0C831F] animate-pulse' :
                    'bg-purple-500'
                  }`}
                />

                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-[#0C831F] shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#0C831F] uppercase tracking-wider">Live Tracker</span>
                        <h2 className="text-sm sm:text-base font-black text-slate-900">Order #{latestOrder.orderId}</h2>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusBadge(latestOrderEffectiveStatus).color}`}
                    >
                      {getStatusBadge(latestOrderEffectiveStatus).label}
                    </span>
                  </div>

                  {/* Timeline Stepper */}
                  <div className="py-2">
                    <div className="relative flex items-start justify-between">
                      <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 z-0" />
                      <div
                        className="absolute top-4 left-0 h-1 bg-[#0C831F] z-0 transition-all duration-700"
                        style={{ width: `${(getStepIndex(latestOrderEffectiveStatus) / (steps.length - 1)) * 100}%` }}
                      />

                      {steps.map((step, idx) => {
                        const currentStep = getStepIndex(latestOrderEffectiveStatus);
                        const isPassed = idx <= currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-sm ${
                                isPassed
                                  ? 'bg-[#0C831F] text-white border-[#0C831F]'
                                  : 'bg-white text-slate-400 border-slate-300'
                              } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                            >
                              {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="font-mono text-xs font-bold">{step.icon}</span>}
                            </div>
                            <div className="text-center">
                              <span className={`text-[9px] font-bold uppercase tracking-wider block ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[8px] text-emerald-600 font-medium">{step.desc}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ready Banner vs Cooking Pipeline Estimated Wait Banner */}
                  {latestOrderEffectiveStatus === 'ready' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-2.5 text-xs text-[#0C831F] font-bold animate-in fade-in duration-300">
                      <CheckCircle2 className="w-4 h-4 text-[#0C831F] shrink-0" />
                      <span>Order is Ready! Kitchen has freshly prepared all your dishes.</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-medium animate-in fade-in duration-300 gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                          <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-amber-950 text-xs">
                            {latestRemainingMins > 0
                              ? `Estimated Wait: ~${latestRemainingMins} mins`
                              : 'Finishing up your fresh dishes...'}
                          </p>
                          <p className="text-[10px] text-amber-700 truncate">
                            Parallel kitchen stations cooking fresh dishes & sides
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-800 shrink-0">
                        ~{latestPipeline?.totalEstimatedMinutes || 10}m total
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* === 3. WHILE YOU WAIT: QUICK ADD SUGGESTIONS (Chai Addaa Themed & Full Text Visible) === */}
            {latestOrder && ['received', 'preparing'].includes(latestOrder.status) && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider min-w-0">
                    <ShoppingBag className="w-4 h-4 text-[#0C831F] shrink-0" />
                    <span className="truncate">While You Wait: Add More</span>
                  </div>
                  <button
                    onClick={() => navigate('/menu')}
                    className="text-xs text-[#0C831F] font-bold flex items-center space-x-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                  >
                    <span>Browse all</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ADD_SUGGESTIONS.map((s) => {
                    const isSelected = selectedWaitFilter === s.id;
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectWaitFilter(s.id as any)}
                        className={`flex items-center space-x-2 sm:space-x-2.5 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-emerald-50 border-2 border-[#0C831F] shadow-sm ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#0C831F] text-white' : 'bg-emerald-100/80 text-[#0C831F]'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-bold whitespace-nowrap leading-tight ${isSelected ? 'text-[#0C831F]' : 'text-slate-900'}`}>
                              {s.label}
                            </p>

                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[#0C831F] shrink-0 ml-1" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 4. SUGGESTED DISHES CAROUSEL === */}
            {suggestedItems.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide truncate">
                      {selectedWaitFilter === 'ALL'
                        ? 'Popular Specialties'
                        : `${QUICK_ADD_SUGGESTIONS.find((s) => s.id === selectedWaitFilter)?.label || 'Dishes'} (${suggestedItems.length})`}
                    </span>
                    {selectedWaitFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWaitFilter('ALL');
                          setSuggestedItems(allMenuItems.slice(0, 6));
                        }}
                        className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors shrink-0 whitespace-nowrap active:scale-95"
                      >
                        Reset ✕
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollSuggested('left')}
                      className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Scroll suggestions left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollSuggested('right')}
                      className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title="Scroll suggestions right"
                    >
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => {
                        const slug = QUICK_ADD_SUGGESTIONS.find((s) => s.id === selectedWaitFilter)?.categorySlug;
                        navigate(slug ? `/menu?category=${slug}` : '/menu');
                      }}
                      className="hidden sm:inline-flex text-[11px] text-[#0C831F] font-bold items-center space-x-0.5 hover:underline cursor-pointer shrink-0 ml-1 whitespace-nowrap"
                    >
                      <span>Browse all</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div
                  ref={suggestedScrollRef}
                  className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar select-none scroll-smooth"
                >
                  {suggestedItems.map((item) => {
                    const inCart = items.find((it) => it.menuItem.id === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedDish(item)}
                        className="flex-none w-44 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="h-32 w-full overflow-hidden bg-slate-900/5 relative flex items-center justify-center">
                          <img
                            src={item.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35 select-none pointer-events-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="relative z-1 w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
                          />
                          <span
                            className={`absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center bg-white/90 shadow-2xs ${
                              item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </span>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 font-mono">₹{item.price}</span>
                            <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium">
                              <Clock className="w-2.5 h-2.5 text-emerald-700" />
                              <span>{item.preparationTimeMinutes || 15}m</span>
                            </div>
                          </div>
                          <div className="pt-0.5">
                            {inCart ? (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="w-full flex items-center justify-between bg-[#0C831F] text-white px-2 py-0.5 rounded-lg shadow-2xs"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, inCart.quantity - 1);
                                  }}
                                  className="w-5 h-5 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3 stroke-[3]" />
                                </button>
                                <span className="font-mono font-black text-xs text-center min-w-[16px]">
                                  {inCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, inCart.quantity + 1);
                                  }}
                                  className="w-5 h-5 hover:bg-black/20 rounded flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDish(item);
                                }}
                                className="w-full py-1 bg-emerald-50 hover:bg-[#0C831F] text-[#0C831F] hover:text-white border border-[#0C831F] rounded-lg text-[10px] font-black transition-all flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <span>View &amp; Add</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 5. ORDER ITEMS BREAKDOWN === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Utensils className="w-4 h-4 text-[#0C831F]" />
                  <span>Session Items (Table {tableId})</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>

              {orders.map((ord, index) => {
                const effectiveStatus = resolveOrderStatus(ord);
                const badge = getStatusBadge(effectiveStatus);

                return (
                  <div key={ord._id || ord.orderId} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-slate-900">Order #{ord.orderId}</span>
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="space-y-2 divide-y divide-slate-100">
                      {ord.items.map((it, i) => {
                        const isCancelled = it.status === 'cancelled';
                        const mainMins = getDishCookMinutes(it.name);
                        return (
                          <div key={i} className={`pt-1.5 flex items-start justify-between text-xs ${isCancelled ? 'opacity-70' : ''}`}>
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                                <p className={`font-semibold ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {it.quantity}x {it.name}
                                </p>
                                {!isCancelled && (
                                  <span className="text-[9px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-semibold">
                                    ~{mainMins}m
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="px-1.5 py-0.2 bg-rose-100 border border-rose-300 text-rose-700 text-[9px] font-bold rounded">
                                    Cancelled by Kitchen
                                  </span>
                                )}
                              </div>
                              {(() => {
                                const parsed = parseItemAddonsAndNotes(it.notes, it.addonNames);
                                return (
                                  <>
                                    {parsed.hasAddons && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {parsed.addons.map((ad, adIdx) => {
                                          const adMins = getDishCookMinutes(ad.name);
                                          const isAdInstant = adMins === 0;
                                          return (
                                            <span
                                              key={adIdx}
                                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200"
                                            >
                                              <span>+{ad.quantity > 1 ? `${ad.quantity * it.quantity}x ` : `${it.quantity > 1 ? `${it.quantity}x ` : ''}`}{ad.name}</span>
                                              <span className="text-[9px] font-mono font-bold text-emerald-700/80">({isAdInstant ? 'Instant' : `~${adMins}m`})</span>
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {parsed.specialInstruction && (
                                      <p className="text-[10px] text-emerald-700 italic pt-0.5">Note: {parsed.specialInstruction}</p>
                                    )}
                                  </>
                                );
                              })()}
                              {isCancelled && (
                                <p className="text-[10px] text-rose-600 font-medium">
                                  {it.cancelReason || "Item 86'd / out of ingredients"}
                                </p>
                              )}
                            </div>
                            <span className={`font-mono font-bold ${isCancelled ? 'line-through text-rose-400' : 'text-slate-900'}`}>
                              ₹{(it.price * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Order Total</span>
                        <span className="font-mono font-bold text-slate-900">₹{ord.total ? ord.total.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* === 6. CUMULATIVE SESSION TOTAL === */}
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-emerald-800" />
                  <span className="font-bold text-xs text-emerald-900 uppercase">Table {tableId} Cumulative Total</span>
                </div>
                <span className="font-mono font-black text-lg text-emerald-900">
                  ₹{grandSessionTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* === 8. BIG CTA: ADD MORE DISHES === */}
            <button
              onClick={() => navigate('/menu')}
              className="w-full py-4 bg-[#0C831F] hover:bg-[#096918] text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Add More Dishes To Table {tableId}</span>
            </button>
          </>
        )}
      </div>

      {/* Floating Active Cart Bar when items > 0 */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 sm:px-6 bg-[#0C831F] hover:bg-[#096918] text-white font-black rounded-2xl text-xs sm:text-sm transition-all duration-150 shadow-[0_8px_30px_rgba(12,131,31,0.5)] flex items-center justify-between border-2 border-emerald-400 active:scale-95 cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 sm:w-7 sm:h-7 bg-white text-[#0C831F] rounded-full text-xs flex items-center justify-center font-black shrink-0 shadow-sm">
                {getItemCount()}
              </span>
              <span className="tracking-wide uppercase font-black text-white text-xs sm:text-sm">View Table Cart</span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono font-black text-sm sm:text-base text-white shrink-0">
              <span>₹{items.reduce((sum, it) => sum + (it.unitPrice ?? it.menuItem.price) * it.quantity, 0).toFixed(2)}</span>
              <span className="text-white/80">➔</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableId={tableId}
        onOrderPlaced={() => {
          fetchTableOrders();
        }}
      />

      {/* Dish Detail & Pairing Upsell Modal */}
      <DishDetailModal
        item={selectedDish}
        isOpen={!!selectedDish}
        onClose={() => setSelectedDish(null)}
      />

      {/* Floating Call Waiter Button */}
      <CallWaiterButton tableId={tableId} />
    </div>
  );
};

export default OrderTrackingPage;
