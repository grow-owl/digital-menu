import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/data-display/StatusBadge';
import { adminService, AdminMetrics, ExecutiveAnalyticsData } from '../../services/admin.service';
import { menuService } from '../../services/menu.service';
import { orderService } from '../../services/order.service';
import { tableService } from '../../services/table.service';
import { TableQrStandsModal } from '../../components/tables/TableQrStandsModal';
import { MenuItem, Category } from '../../types/menu.types';
import { useToast } from '../../components/feedback/ToastContainer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { OrderRefundModal } from '../../components/orders/OrderRefundModal';
import {
  DollarSign, ShoppingBag, LayoutGrid, ChefHat, TrendingUp, RefreshCw, Layers, ShieldCheck,
  Calendar, Users, AlertTriangle, Sparkles, Clock, Award, Utensils, Receipt, CheckCircle2,
  Plus, Edit, Trash2, Flame, Search, Filter, X, Check, Eye, CreditCard, Printer, RotateCcw, QrCode,
  Download, ArrowUpRight, BarChart3, Bell, CheckSquare, Square, ToggleLeft, ToggleRight, Smartphone,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ─────────────────────────────────────────────────────────────
  // 4 PRIMARY ADMIN PARTS (As Requested by User)
  // 1. TABLE_BILLING: Billing for each table with instant checkout
  // 2. BILLING_HISTORY: Total billed (All-Time, Whole Month, Today's Earn) & settled invoice log
  // 3. MENU_MANAGEMENT: Adding, editing, and deleting items in the menu
  // 4. DAILY_AVAILABILITY: Instant one-tick today's availability / 86'd manager
  // ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'TABLE_BILLING' | 'BILLING_HISTORY' | 'MENU_MANAGEMENT' | 'DAILY_AVAILABILITY'>('TABLE_BILLING');

  // Shared Data States
  const [allTables, setAllTables] = useState<any[]>([]);
  const [realActiveOrders, setRealActiveOrders] = useState<any[]>([]);
  const [realSettledOrders, setRealSettledOrders] = useState<any[]>([]);
  const [realRefundedOrders, setRealRefundedOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // PART 1: TABLE BILLING STATE
  // ─────────────────────────────────────────────────────────────
  const [selectedTableForBilling, setSelectedTableForBilling] = useState<any | null>(null);
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<'UPI' | 'CARD_SWIPE' | 'CASH'>('UPI');
  const [billingDiscountPercent, setBillingDiscountPercent] = useState<number>(0);
  const [isSettlingBill, setIsSettlingBill] = useState(false);
  const [settledSuccessData, setSettledSuccessData] = useState<{ invoiceNumber: string; tableNumber: number; total: number } | null>(null);

  // ─────────────────────────────────────────────────────────────
  // PART 2: BILLING HISTORY STATE
  // ─────────────────────────────────────────────────────────────
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<'ALL' | 'UPI' | 'CARD' | 'CASH'>('ALL');
  const [viewBillOrder, setViewBillOrder] = useState<any | null>(null);
  const [refundTargetOrder, setRefundTargetOrder] = useState<any | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // PART 3: MENU MANAGEMENT STATE (Add / Edit / Delete)
  // ─────────────────────────────────────────────────────────────
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [menuSelectedCategory, setMenuSelectedCategory] = useState<string>('');
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState<number | string>(450);
  const [dishCategoryId, setDishCategoryId] = useState<number>(1);
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishSpiceLevel, setDishSpiceLevel] = useState<number>(0);
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishIsNonVeg, setDishIsNonVeg] = useState(false);
  const [dishIsGlutenFree, setDishIsGlutenFree] = useState(false);
  const [dishIsJain, setDishIsJain] = useState(false);
  const [dishIsChefSpecial, setDishIsChefSpecial] = useState(false);
  const [dishIsBestSeller, setDishIsBestSeller] = useState(false);
  const [dishIsAvailable, setDishIsAvailable] = useState(true);
  const [dishPrepTime, setDishPrepTime] = useState<number>(15);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState<number>(1);

  // ─────────────────────────────────────────────────────────────
  // PART 4: DAILY AVAILABILITY STATE (One-Tick Toggle)
  // ─────────────────────────────────────────────────────────────
  const [availFilter, setAvailFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'IN_STOCK'>('ALL');
  const [availSearchQuery, setAvailSearchQuery] = useState('');
  const [togglingDishId, setTogglingDishId] = useState<string | number | null>(null);

  // ─────────────────────────────────────────────────────────────
  // CALL SERVICE MODAL ALERT (Blurred Background Backdrop)
  // ─────────────────────────────────────────────────────────────
  const [activeServiceCall, setActiveServiceCall] = useState<any | null>(null);
  const activeServiceCallRef = useRef<any | null>(null);
  activeServiceCallRef.current = activeServiceCall;

  // Lock background body scroll when any modal is open
  useBodyScrollLock(
    isDishModalOpen ||
    isCategoryModalOpen ||
    viewBillOrder !== null ||
    selectedTableForBilling !== null ||
    isRefundModalOpen ||
    activeServiceCall !== null
  );

  // Fetch all live data from database
  const fetchData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [tables, active, settled, refunded, cats, items] = await Promise.all([
        tableService.getAllTables().catch(() => []),
        orderService.getActiveOrders().catch(() => []),
        orderService.getSettledOrders().catch(() => []),
        orderService.getRefundedOrders().catch(() => []),
        menuService.getCategories().catch(() => []),
        menuService.getMenuItems().catch(() => []),
      ]);

      setAllTables(tables || []);
      setRealActiveOrders(active || []);
      setRealSettledOrders(Array.isArray(settled) ? settled : (settled?.data || []));
      setRealRefundedOrders(refunded || []);
      setCategories(cats || []);
      setMenuItems(items || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Audio chime for urgent Call Service alert
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  const checkServiceCalls = async () => {
    try {
      const remoteCalls = await tableService.getWaiterCalls().catch(() => []);
      const localCalls = JSON.parse(localStorage.getItem('aura_waiter_alerts') || '[]');
      const combined = [...(Array.isArray(remoteCalls) ? remoteCalls : []), ...localCalls];
      const pendingCalls = combined.filter((c: any) => c.status === 'PENDING');

      if (pendingCalls.length > 0) {
        const newest = pendingCalls[0];
        if (!activeServiceCallRef.current || activeServiceCallRef.current.id !== newest.id) {
          setActiveServiceCall(newest);
          playAlertChime();
        }
      }
    } catch (e) {}
  };

  const handleDismissServiceCall = async () => {
    if (!activeServiceCall) return;
    const alertId = activeServiceCall.id;
    const tableId = activeServiceCall.tableId || activeServiceCall.tableNumber;
    setActiveServiceCall(null);

    try {
      const localCalls = JSON.parse(localStorage.getItem('aura_waiter_alerts') || '[]');
      const updated = localCalls.map((c: any) => (c.id === alertId ? { ...c, status: 'RESOLVED' } : c));
      localStorage.setItem('aura_waiter_alerts', JSON.stringify(updated));
    } catch (e) {}

    try {
      await tableService.resolveWaiterCall(alertId);
    } catch (e) {}

    showToast(`Service assistance for Table ${tableId} acknowledged!`, 'success');
  };

  useEffect(() => {
    fetchData(true);
    checkServiceCalls();

    const interval = setInterval(() => {
      fetchData(false);
      checkServiceCalls();
    }, 3000);

    const handleServiceEvent = (e: any) => {
      const alert = e?.detail;
      if (alert) {
        setActiveServiceCall(alert);
        playAlertChime();
      } else {
        checkServiceCalls();
      }
    };

    window.addEventListener('service_called', handleServiceEvent);
    window.addEventListener('storage', checkServiceCalls);

    return () => {
      clearInterval(interval);
      window.removeEventListener('service_called', handleServiceEvent);
      window.removeEventListener('storage', checkServiceCalls);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // FINANCIAL CALCULATIONS (Today, Whole Month, Whole/All-Time)
  // ─────────────────────────────────────────────────────────────
  const financialTotals = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const todayDateStr = now.toDateString();

    let todayEarned = 0;
    let todayOrdersCount = 0;

    let monthBilled = 0;
    let monthOrdersCount = 0;

    let wholeTotalBilled = 0;
    let wholeOrdersCount = realSettledOrders.length;

    realSettledOrders.forEach((ord) => {
      const ordDate = ord.paidAt ? new Date(ord.paidAt) : (ord.createdAt ? new Date(ord.createdAt) : new Date());
      const net = ord.netAmount !== undefined ? ord.netAmount : Math.max(0, (ord.total || 0) - (ord.refundAmount || 0));

      wholeTotalBilled += net;

      if (ordDate.getFullYear() === curYear && ordDate.getMonth() === curMonth) {
        monthBilled += net;
        monthOrdersCount++;
      }

      if (ordDate.toDateString() === todayDateStr) {
        todayEarned += net;
        todayOrdersCount++;
      }
    });

    const totalRefunds = realRefundedOrders.reduce((sum, o) => sum + (o.refundAmount || o.total || 0), 0);
    const todayAov = todayOrdersCount > 0 ? Math.round(todayEarned / todayOrdersCount) : 0;
    const gstCollectedToday = Math.round((todayEarned * 0.05) / 1.05);

    return {
      todayEarned,
      todayOrdersCount,
      monthBilled,
      monthOrdersCount,
      wholeTotalBilled,
      wholeOrdersCount,
      totalRefunds,
      todayAov,
      gstCollectedToday,
    };
  }, [realSettledOrders, realRefundedOrders]);

  // Map active orders to tables for Table Billing (Part 1)
  const activeTablesBillingData = useMemo(() => {
    // Group active orders by table number
    const map = new Map<number, any[]>();
    realActiveOrders.forEach((ord) => {
      let num = Number(ord.tableNumber || ord.tableId);
      if (isNaN(num) || num <= 0) {
        const match = String(ord.tableId || '').match(/\d+/);
        num = match ? parseInt(match[0], 10) : 1;
      }
      if (!map.has(num)) map.set(num, []);
      map.get(num)!.push(ord);
    });

    // Build array of tables that have active dining orders
    const result: any[] = [];
    map.forEach((orders, tableNum) => {
      const allItems = orders.flatMap((o) => o.items || []);
      const computedSubtotal = allItems.reduce(
        (sum, it) => sum + ((it.quantity || it.qty || 1) * (it.price || it.unitPrice || 0)),
        0
      );
      const subtotal = computedSubtotal > 0 ? computedSubtotal : orders.reduce((s, o) => s + (o.subtotal || o.total || 0), 0);
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;

      const tableInDb = allTables.find((t) => Number(t.tableNumber) === tableNum);

      result.push({
        tableNumber: tableNum,
        guestCount: tableInDb?.guestCount || 2,
        orders,
        items: allItems,
        subtotal,
        tax,
        total,
        orderIds: orders.map((o) => o.orderId || o._id).filter(Boolean),
      });
    });

    return result.sort((a, b) => a.tableNumber - b.tableNumber);
  }, [realActiveOrders, allTables]);

  // Settle table bill action
  const handleConfirmSettleTableBill = async () => {
    if (!selectedTableForBilling) return;
    setIsSettlingBill(true);
    const tableNum = selectedTableForBilling.tableNumber;
    try {
      const res = await orderService.settleTableBill(tableNum, billingPaymentMethod);
      const invoiceNumber = res?.data?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      showToast(
        `Table ${tableNum} bill settled successfully via ${billingPaymentMethod}! Invoice #${invoiceNumber}`,
        'success'
      );
      setSettledSuccessData({
        invoiceNumber,
        tableNumber: tableNum,
        total: Math.round(selectedTableForBilling.total * (1 - billingDiscountPercent / 100)),
      });
      fetchData(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to settle table bill', 'error');
    } finally {
      setIsSettlingBill(false);
    }
  };

  // Filtered Billing History Log
  const filteredBillingHistory = useMemo(() => {
    return realSettledOrders.filter((ord) => {
      const q = historySearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        String(ord.invoiceNumber || '').toLowerCase().includes(q) ||
        String(ord.orderId || '').toLowerCase().includes(q) ||
        String(ord.tableId || ord.tableNumber || '').includes(q) ||
        String(ord.customerName || '').toLowerCase().includes(q);

      const method = String(ord.paymentMethod || '').toUpperCase();
      let matchMethod = true;
      if (historyPaymentFilter === 'UPI') matchMethod = method.includes('UPI');
      else if (historyPaymentFilter === 'CARD') matchMethod = method.includes('CARD') || method.includes('SWIPE');
      else if (historyPaymentFilter === 'CASH') matchMethod = method.includes('CASH');

      return matchSearch && matchMethod;
    });
  }, [realSettledOrders, historySearchQuery, historyPaymentFilter]);

  // Pagination State for Settled Invoices Log (10 items per page)
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 10;

  // Reset to page 1 whenever search query or payment filter changes
  useEffect(() => {
    setHistoryPage(1);
  }, [historySearchQuery, historyPaymentFilter]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredBillingHistory.length / historyPageSize));

  const paginatedBillingHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredBillingHistory.slice(start, start + historyPageSize);
  }, [filteredBillingHistory, historyPage, historyPageSize]);

  // Export Billing CSV
  const handleExportBillingCSV = () => {
    const headers = 'Invoice No,Table,Payment Method,Amount (INR),Paid Date,Refund Status\n';
    const rows = filteredBillingHistory.map((o) => {
      const date = o.paidAt ? new Date(o.paidAt).toLocaleDateString() : new Date().toLocaleDateString();
      const amt = o.netAmount !== undefined ? o.netAmount : Math.max(0, (o.total || 0) - (o.refundAmount || 0));
      return `${o.invoiceNumber || o.orderId},Table ${o.tableId || o.tableNumber},${o.paymentMethod || 'UPI'},${amt},${date},${o.refundAmount ? 'Refunded' : 'Paid'}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chai_Addaa_Billing_History_${Date.now()}.csv`;
    a.click();
    showToast('Billing History CSV downloaded', 'success');
  };

  // ─────────────────────────────────────────────────────────────
  // PART 3: DISH ADD / EDIT / DELETE ACTIONS
  // ─────────────────────────────────────────────────────────────
  const handleOpenDishModal = (dish?: MenuItem) => {
    if (dish) {
      setEditingDish(dish);
      setDishName(dish.name);
      setDishDescription(dish.description || '');
      setDishPrice(dish.price);
      setDishCategoryId(dish.categoryId || 1);
      setDishImageUrl(dish.imageUrl || '');
      setDishSpiceLevel(dish.spiceLevel || 0);
      setDishIsVeg(dish.isVegetarian || false);
      setDishIsNonVeg(dish.isNonVeg || false);
      setDishIsGlutenFree(dish.isGlutenFree || false);
      setDishIsJain(dish.isJain || false);
      setDishIsChefSpecial(dish.isChefSpecial || false);
      setDishIsBestSeller(dish.isBestSeller || false);
      setDishIsAvailable(dish.isAvailable !== false);
      setDishPrepTime(dish.preparationTimeMinutes || 15);
    } else {
      setEditingDish(null);
      setDishName('');
      setDishDescription('');
      setDishPrice(450);
      setDishCategoryId(categories[0]?.id || 1);
      setDishImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80');
      setDishSpiceLevel(0);
      setDishIsVeg(true);
      setDishIsNonVeg(false);
      setDishIsGlutenFree(false);
      setDishIsJain(false);
      setDishIsChefSpecial(false);
      setDishIsBestSeller(false);
      setDishIsAvailable(true);
      setDishPrepTime(15);
    }
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) {
      showToast('Please enter dish name and price', 'error');
      return;
    }

    const payload: Partial<MenuItem> = {
      name: dishName.trim(),
      description: dishDescription.trim() || 'Artisanal dish crafted by Siliguri Chai Addaa.',
      price: Number(dishPrice),
      categoryId: Number(dishCategoryId),
      imageUrl: dishImageUrl.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      spiceLevel: Number(dishSpiceLevel),
      isVegetarian: dishIsVeg,
      isNonVeg: dishIsNonVeg,
      isGlutenFree: dishIsGlutenFree,
      isJain: dishIsJain,
      isChefSpecial: dishIsChefSpecial,
      isBestSeller: dishIsBestSeller,
      isAvailable: dishIsAvailable,
      preparationTimeMinutes: Number(dishPrepTime)
    };

    try {
      if (editingDish) {
        await menuService.updateMenuItem(editingDish.id, payload);
        showToast(`Updated "${dishName}" successfully!`, 'success');
      } else {
        await menuService.createMenuItem(payload);
        showToast(`Added new dish "${dishName}" (₹${dishPrice}) to menu!`, 'success');
      }
      setIsDishModalOpen(false);
      fetchData(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save dish', 'error');
    }
  };

  const handleDeleteDish = async (dish: MenuItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${dish.name}" from the menu?`)) return;
    try {
      await menuService.deleteMenuItem(dish.id);
      showToast(`Deleted "${dish.name}" from menu`, 'info');
      fetchData(false);
    } catch (err) {
      showToast('Failed to delete dish', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PART 4: ONE-TICK DAILY AVAILABILITY TOGGLE
  // ─────────────────────────────────────────────────────────────
  const handleOneTickToggleAvailability = async (dish: MenuItem) => {
    const nextStatus = !dish.isAvailable;
    const targetId = dish.id || (dish as any)._id;
    setTogglingDishId(targetId);

    // Optimistic UI update for instantaneous responsiveness
    setMenuItems((prev) =>
      prev.map((it) => ((it.id === dish.id || (it as any)._id === targetId) ? { ...it, isAvailable: nextStatus } : it))
    );

    try {
      await menuService.updateMenuItem(targetId, { isAvailable: nextStatus });
      showToast(
        `"${dish.name}" is now ${nextStatus ? 'AVAILABLE IN MENU TODAY' : 'NOT AVAILABLE TODAY (86\'d)'}`,
        nextStatus ? 'success' : 'info'
      );
    } catch (err: any) {
      // Revert if error
      setMenuItems((prev) =>
        prev.map((it) => ((it.id === dish.id || (it as any)._id === targetId) ? { ...it, isAvailable: !nextStatus } : it))
      );
      showToast(err?.response?.data?.message || 'Failed to update availability', 'error');
    } finally {
      setTogglingDishId(null);
    }
  };

  // Filtered Menu Items for Part 3
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const q = menuSearchQuery.trim().toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
      const matchCat = !menuSelectedCategory || String(item.categoryId) === String(menuSelectedCategory);
      return matchSearch && matchCat;
    });
  }, [menuItems, menuSearchQuery, menuSelectedCategory]);

  // Filtered Dishes for Part 4 (Daily Availability)
  const filteredAvailabilityItems = useMemo(() => {
    return menuItems.filter((item) => {
      const q = availSearchQuery.trim().toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
      let matchStatus = true;
      if (availFilter === 'OUT_OF_STOCK') matchStatus = item.isAvailable === false;
      else if (availFilter === 'IN_STOCK') matchStatus = item.isAvailable !== false;
      return matchSearch && matchStatus;
    });
  }, [menuItems, availSearchQuery, availFilter]);

  const outOfStockCount = menuItems.filter((d) => d.isAvailable === false).length;
  const inStockCount = menuItems.filter((d) => d.isAvailable !== false).length;

  return (
    <div className="page-theme-admin h-full overflow-y-auto p-2 sm:p-6 font-sans text-theme-text bg-theme-bg">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6 pb-24">
        {/* ─────────────────────────────────────────────────────────────
            TOP HEADER BANNER (Mobile-Responsive Header)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-theme-surface border border-theme-border p-3 sm:p-5 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="font-serif text-base sm:text-2xl font-black tracking-wide text-white truncate">
                  ADMIN PANEL
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto pb-0.5 sm:pb-0">
            <button
              onClick={() => fetchData(true)}
              disabled={isLoading}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-theme-bg hover:bg-theme-surface border border-theme-border text-[11px] sm:text-xs text-slate-200 rounded-xl font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-sm shrink-0"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-theme-primary ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE 4 NAVIGATION TABS (Strictly 4 Parts, Mobile Swipeable)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain pb-1.5 border-b border-theme-border pr-2">
          <button
            onClick={() => setActiveTab('TABLE_BILLING')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all border flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'TABLE_BILLING'
                ? 'bg-theme-primary text-black border-theme-primary shadow-lg font-black'
                : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>1. Table Billing ({activeTablesBillingData.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BILLING_HISTORY')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all border flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'BILLING_HISTORY'
                ? 'bg-theme-primary text-black border-theme-primary shadow-lg font-black'
                : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>2. Billing History</span>
          </button>

          <button
            onClick={() => setActiveTab('MENU_MANAGEMENT')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all border flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'MENU_MANAGEMENT'
                ? 'bg-theme-primary text-black border-theme-primary shadow-lg font-black'
                : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>3. Menu Items ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY_AVAILABILITY')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all border flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'DAILY_AVAILABILITY'
                ? 'bg-theme-primary text-black border-theme-primary shadow-lg font-black'
                : outOfStockCount > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:text-white font-black animate-pulse'
                : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>4. Today's Availability</span>
            {outOfStockCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black">
                {outOfStockCount} Out
              </span>
            )}
          </button>
          <div className="w-2 shrink-0" />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PART 1: TABLE BILLING (Billing for Each Table & Settlement)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'TABLE_BILLING' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-surface border border-theme-border p-4 sm:p-5 rounded-2xl">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-theme-primary" />
                  <span>Table Billing</span>
                </h2>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-theme-bg border border-theme-border text-slate-300">
                  Active Tables: <strong className="text-theme-primary">{activeTablesBillingData.length}</strong>
                </span>
              </div>
            </div>

            {activeTablesBillingData.length === 0 ? (
              <div className="py-16 text-center bg-theme-surface border border-theme-border rounded-2xl p-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-white">All Tables Cleared &amp; Settled!</h3>
                <p className="text-xs text-theme-muted max-w-md mx-auto">
                  There are currently no active dining tables awaiting bill settlement. New orders placed by guests or waiters will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {activeTablesBillingData.map((tbl) => (
                  <div
                    key={tbl.tableNumber}
                    className="p-4 sm:p-5 bg-theme-surface border border-theme-border hover:border-theme-primary/50 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-black text-xl text-white">
                            Table {tbl.tableNumber}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tbl.guestCount} Guests</span>
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="space-y-1.5 bg-theme-bg p-3 rounded-xl border border-theme-border/60 text-xs">
                        <span className="text-[10px] font-mono uppercase text-theme-muted block font-bold">
                          Orders Summary ({tbl.items.length} items):
                        </span>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {tbl.items.map((it: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300">
                              <span className="truncate max-w-[170px]">{it.quantity || it.qty || 1}x {it.name}</span>
                              <span className="font-mono text-white font-semibold">
                                ₹{((it.quantity || it.qty || 1) * (it.price || it.unitPrice || 0)).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cost Summary */}
                      <div className="space-y-1 pt-1 text-xs font-mono">
                        <div className="flex justify-between text-theme-muted">
                          <span>Subtotal:</span>
                          <span>₹{tbl.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-theme-muted">
                          <span>GST (5%):</span>
                          <span>₹{tbl.tax.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-emerald-400 pt-1 border-t border-theme-border">
                          <span>Total Amount:</span>
                          <span>₹{tbl.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTableForBilling(tbl);
                        setBillingDiscountPercent(0);
                        setSettledSuccessData(null);
                      }}
                      className="w-full py-3 bg-theme-primary hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Settle Bill &amp; Print Receipt</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PART 2: BILLING HISTORY & REVENUE TOTALS (Explicitly Requested)
            - Total billed of whole
            - Whole month
            - Total earn on that day
            - Full billing history log
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'BILLING_HISTORY' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top 3 Grand Revenue Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Card 1: Today's Earn */}
              <div className="p-4 sm:p-5 bg-theme-surface border border-emerald-500/40 rounded-2xl shadow-xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider">TODAY'S TOTAL EARNED</span>
                  <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-2xl sm:text-3xl font-black text-white">
                  ₹{financialTotals.todayEarned.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-theme-muted pt-1 border-t border-theme-border">
                  <span>{financialTotals.todayOrdersCount} Invoices Settled Today</span>
                  <span className="text-emerald-400 font-bold">AOV: ₹{financialTotals.todayAov}</span>
                </div>
              </div>

              {/* Card 2: Whole Month Billed */}
              <div className="p-4 sm:p-5 bg-theme-surface border border-sky-500/40 rounded-2xl shadow-xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-sky-400 uppercase tracking-wider">THIS MONTH'S TOTAL BILLED</span>
                  <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-2xl sm:text-3xl font-black text-white">
                  ₹{financialTotals.monthBilled.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-theme-muted pt-1 border-t border-theme-border">
                  <span>{financialTotals.monthOrdersCount} Orders This Month</span>
                  <span className="text-sky-400 font-bold">{new Date().toLocaleString('default', { month: 'long' })}</span>
                </div>
              </div>
            </div>

            {/* Billing History Table / Card Log */}
            <div className="bg-theme-surface border border-theme-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border pb-4">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-theme-primary" />
                    <span>Settled Invoices &amp; Billing History Log ({filteredBillingHistory.length})</span>
                  </h3>
                  <p className="text-xs text-theme-muted">
                    Full audit history of all table dining payments, receipts, and refund events.
                  </p>
                </div>

                <button
                  onClick={handleExportBillingCSV}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Log</span>
                </button>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search invoice number, table, or guest..."
                    className="w-full pl-9 pr-3 py-2 bg-theme-bg border border-theme-border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary font-mono"
                  />
                </div>

                <div className="flex space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['ALL', 'UPI', 'CARD', 'CASH'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setHistoryPaymentFilter(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                        historyPaymentFilter === m
                          ? 'bg-theme-primary text-black border-theme-primary font-black shadow-sm'
                          : 'bg-theme-bg text-slate-400 border-theme-border hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs font-mono min-w-[700px]">
                  <thead className="bg-theme-bg text-slate-400 uppercase text-[10px] border-b border-theme-border">
                    <tr>
                      <th className="py-3 px-3">Invoice #</th>
                      <th className="py-3 px-3">Table</th>
                      <th className="py-3 px-3">Date &amp; Time</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Net Settled</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {filteredBillingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No billing history found matching filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedBillingHistory.map((ord) => {
                        const net = ord.netAmount !== undefined ? ord.netAmount : Math.max(0, (ord.total || 0) - (ord.refundAmount || 0));
                        const dateStr = ord.paidAt
                          ? new Date(ord.paidAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                          <tr key={ord._id || ord.orderId} className="hover:bg-theme-bg/60 transition-colors">
                            <td className="py-3 px-3 text-theme-primary font-bold">{ord.invoiceNumber || ord.orderId}</td>
                            <td className="py-3 px-3 text-white font-bold">Table {ord.tableNumber || ord.tableId}</td>
                            <td className="py-3 px-3 text-slate-400 text-[11px]">{dateStr}</td>
                            <td className="py-3 px-3 text-slate-300 font-bold">{ord.paymentMethod || 'UPI_QR'}</td>
                            <td className="py-3 px-3 text-emerald-400 font-bold text-sm">
                              ₹{net.toLocaleString('en-IN')}
                              {ord.refundAmount && ord.refundAmount > 0 && (
                                <span className="block text-[9px] text-rose-400 font-normal">
                                  Ref: -₹{ord.refundAmount.toLocaleString('en-IN')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {ord.refundAmount && ord.refundAmount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  PARTIAL REFUND
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  PAID &amp; SETTLED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => setViewBillOrder(ord)}
                                  className="px-2.5 py-1 bg-theme-bg hover:bg-theme-primary/20 text-theme-primary border border-theme-border hover:border-theme-primary/40 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center space-x-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Bill</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRefundTargetOrder(ord);
                                    setIsRefundModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center space-x-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Refund</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Optimized for small screens) */}
              <div className="block md:hidden space-y-2.5">
                {filteredBillingHistory.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500 font-mono">No bills found.</p>
                ) : (
                  paginatedBillingHistory.map((ord) => {
                    const net = ord.netAmount !== undefined ? ord.netAmount : Math.max(0, (ord.total || 0) - (ord.refundAmount || 0));
                    const dateStr = ord.paidAt
                      ? new Date(ord.paidAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Today';

                    return (
                      <div
                        key={ord._id || ord.orderId}
                        className="p-3.5 bg-theme-bg border border-theme-border rounded-xl space-y-2.5 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-theme-primary">#{ord.invoiceNumber || ord.orderId}</span>
                          <span className="font-black text-emerald-400 text-sm">₹{net.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Table {ord.tableNumber || ord.tableId}</span>
                          <span>{ord.paymentMethod || 'UPI'} • {dateStr}</span>
                        </div>

                        <div className="pt-2 border-t border-theme-border/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setViewBillOrder(ord)}
                            className="flex-1 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-primary border border-theme-border rounded-lg text-[11px] font-bold uppercase flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                          <button
                            onClick={() => {
                              setRefundTargetOrder(ord);
                              setIsRefundModalOpen(true);
                            }}
                            className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold uppercase flex items-center space-x-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Controls (10 items per page) */}
              {filteredBillingHistory.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-theme-border font-mono text-xs text-slate-400">
                  <div>
                    Showing <span className="text-white font-bold">{Math.min(filteredBillingHistory.length, (historyPage - 1) * historyPageSize + 1)}</span> to{' '}
                    <span className="text-white font-bold">{Math.min(filteredBillingHistory.length, historyPage * historyPageSize)}</span> of{' '}
                    <span className="text-white font-bold">{filteredBillingHistory.length}</span> invoices
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-theme-border bg-theme-bg text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => setHistoryPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            historyPage === pg
                              ? 'bg-theme-primary text-black font-black shadow-sm'
                              : 'bg-theme-bg border border-theme-border text-slate-400 hover:text-white'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={historyPage === totalHistoryPages}
                      onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-theme-border bg-theme-bg text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PART 3: MENU MANAGEMENT (Adding & Deleting Items)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'MENU_MANAGEMENT' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-surface border border-theme-border p-4 sm:p-5 rounded-2xl">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <ChefHat className="w-5 h-5 text-theme-primary" />
                  <span>Menu Recipe Catalog ({filteredMenuItems.length} Items)</span>
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenDishModal()}
                  className="px-4 py-2.5 bg-theme-primary hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Search dish by name or description..."
                  className="w-full pl-9 pr-3 py-2 bg-theme-surface border border-theme-border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary font-mono"
                />
              </div>

              <select
                value={menuSelectedCategory}
                onChange={(e) => setMenuSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-theme-surface border border-theme-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-theme-primary cursor-pointer"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredMenuItems.map((dish) => {
                const cat = categories.find((c) => c.id === dish.categoryId);
                return (
                  <div
                    key={dish.id}
                    className={`bg-theme-surface border rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition-all shadow-md hover:border-theme-primary/40 relative overflow-hidden ${
                      dish.isAvailable ? 'border-theme-border' : 'border-rose-500/40 bg-rose-500/5'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-16 h-16 rounded-xl object-cover border border-theme-border shadow-sm shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono text-theme-primary uppercase tracking-wider block truncate">
                              {cat?.name || `Cat #${dish.categoryId}`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">#{dish.id}</span>
                          </div>
                          <h4 className="font-serif font-bold text-sm text-white truncate">{dish.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="font-serif font-bold text-theme-primary text-base">
                              ₹{dish.price.toLocaleString('en-IN')}
                            </span>
                            {dish.isVegetarian && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                VEG
                              </span>
                            )}
                            {dish.isChefSpecial && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                                SPECIAL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    {/* Dish Controls: Edit & Delete */}
                    <div className="pt-2.5 border-t border-theme-border flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        dish.isAvailable
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      }`}>
                        {dish.isAvailable ? 'IN STOCK' : 'UNAVAILABLE'}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenDishModal(dish)}
                          className="p-2 bg-theme-bg hover:bg-theme-surface border border-theme-border hover:border-theme-primary text-slate-300 hover:text-theme-primary rounded-xl transition-all cursor-pointer"
                          title="Edit Dish"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish)}
                          className="p-2 bg-theme-bg hover:bg-rose-500/10 border border-theme-border hover:border-rose-500/40 text-slate-300 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PART 4: DAILY MENU AVAILABILITY (One-Tick Toggle)
            - Show which item is not available in menu today just by one tick
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'DAILY_AVAILABILITY' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-surface border border-theme-border p-3.5 sm:p-5 rounded-2xl">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-theme-primary shrink-0" />
                  <span>Daily Menu Availability Manager</span>
                </h2>
              </div>

              {/* Status Counters — Responsive 2-Col Grid on Mobile, Inline on Desktop */}
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:space-x-2 font-mono text-xs">
                <div className="flex items-center justify-between sm:justify-start px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold gap-2">
                  <span className="text-[11px] sm:text-xs">✓ Available</span>
                  <span className="font-mono font-black text-xs sm:text-sm px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300">
                    {inStockCount}
                  </span>
                </div>
                <div className={`flex items-center justify-between sm:justify-start px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-bold border gap-2 ${
                  outOfStockCount > 0
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                    : 'bg-theme-bg/80 border-theme-border text-slate-400'
                }`}>
                  <span className="text-[11px] sm:text-xs">✕ Out of Stock</span>
                  <span className="font-mono font-black text-xs sm:text-sm px-1.5 py-0.5 rounded bg-black/30">
                    {outOfStockCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={availSearchQuery}
                  onChange={(e) => setAvailSearchQuery(e.target.value)}
                  placeholder="Quick search dishes..."
                  className="w-full pl-9 pr-8 py-2 bg-theme-surface border border-theme-border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary font-mono"
                />
                {availSearchQuery && (
                  <button
                    onClick={() => setAvailSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Horizontal Scrollable Rail on Mobile without Ugly Grey Scrollbar */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain pb-0.5 sm:pb-0 pr-3">
                <button
                  onClick={() => setAvailFilter('ALL')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    availFilter === 'ALL'
                      ? 'bg-theme-primary text-black border-theme-primary font-black shadow-sm'
                      : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
                  }`}
                >
                  All Items ({menuItems.length})
                </button>
                <button
                  onClick={() => setAvailFilter('OUT_OF_STOCK')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    availFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-500 text-white border-rose-400 font-black shadow-sm'
                      : outOfStockCount > 0
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
                  }`}
                >
                  🔴 Not Available ({outOfStockCount})
                </button>
                <button
                  onClick={() => setAvailFilter('IN_STOCK')}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                    availFilter === 'IN_STOCK'
                      ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-sm'
                      : 'bg-theme-surface text-slate-400 border-theme-border hover:text-white'
                  }`}
                >
                  🟢 Available Today ({inStockCount})
                </button>
                <div className="w-2 shrink-0" />
              </div>
            </div>

            {/* Dishes Availability List — Clear One-Tick Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAvailabilityItems.map((dish) => {
                const cat = categories.find((c) => c.id === dish.categoryId);
                const isAvail = dish.isAvailable !== false;
                const isUpdating = togglingDishId === dish.id || togglingDishId === (dish as any)._id;

                return (
                  <div
                    key={dish.id}
                    onClick={() => !isUpdating && handleOneTickToggleAvailability(dish)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none shadow-md ${
                      isAvail
                        ? 'bg-theme-surface border-theme-border hover:border-emerald-500/50'
                        : 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-12 h-12 rounded-xl object-cover border border-theme-border shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase truncate">
                            {cat?.name || 'Dish'}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            • ₹{dish.price}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-white truncate">
                          {dish.name}
                        </h4>
                        <span className={`text-[10px] font-mono font-black uppercase mt-0.5 inline-block ${
                          isAvail ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isAvail ? '✓ Available Today' : '✕ Out of Stock (86\'d)'}
                        </span>
                      </div>
                    </div>

                    {/* The One-Tick Switch */}
                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOneTickToggleAvailability(dish);
                        }}
                        disabled={isUpdating}
                        className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                          isAvail ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                        title={isAvail ? 'Click to mark Out of Stock' : 'Click to mark Available'}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform flex items-center justify-center ${
                            isAvail ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        >
                          {isAvail ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 font-bold" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SETTLE BILL & CHECKOUT MODAL (For Part 1: Table Billing)
      ───────────────────────────────────────────────────────────── */}
      {selectedTableForBilling && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedTableForBilling(null); }}
        >
          <div className="bg-theme-surface border border-theme-border rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-theme-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-theme-primary" />
                  <span>Settle Bill: Table {selectedTableForBilling.tableNumber}</span>
                </h3>
                <p className="text-xs text-theme-muted">{selectedTableForBilling.guestCount} Guests</p>
              </div>
              <button
                onClick={() => setSelectedTableForBilling(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {!settledSuccessData ? (
                <>
                  {/* Items List */}
                  <div className="space-y-2 bg-theme-bg p-3 rounded-xl border border-theme-border text-xs">
                    <span className="text-[10px] font-mono uppercase text-theme-muted font-bold block">
                      Ordered Dishes ({selectedTableForBilling.items.length}):
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {selectedTableForBilling.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-slate-200 font-mono text-[11px]">
                          <span>{it.quantity || it.qty || 1}x {it.name}</span>
                          <span className="font-bold">₹{((it.quantity || it.qty || 1) * (it.price || it.unitPrice || 0)).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase font-bold text-slate-300">
                      Select Payment Method:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBillingPaymentMethod('UPI')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                          billingPaymentMethod === 'UPI'
                            ? 'bg-theme-primary text-black border-theme-primary font-black shadow-md'
                            : 'bg-theme-bg text-slate-400 border-theme-border hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBillingPaymentMethod('CARD_SWIPE')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                          billingPaymentMethod === 'CARD_SWIPE'
                            ? 'bg-theme-primary text-black border-theme-primary font-black shadow-md'
                            : 'bg-theme-bg text-slate-400 border-theme-border hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card POS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBillingPaymentMethod('CASH')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                          billingPaymentMethod === 'CASH'
                            ? 'bg-theme-primary text-black border-theme-primary font-black shadow-md'
                            : 'bg-theme-bg text-slate-400 border-theme-border hover:text-white'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Cash</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 bg-theme-bg p-3.5 rounded-xl border border-theme-border text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>₹{selectedTableForBilling.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST (5% CGST + SGST):</span>
                      <span>₹{selectedTableForBilling.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-theme-border">
                      <span>Grand Total:</span>
                      <span className="text-emerald-400">
                        ₹{Math.round(selectedTableForBilling.total * (1 - billingDiscountPercent / 100)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmSettleTableBill}
                    disabled={isSettlingBill}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4 font-bold" />
                    <span>
                      {isSettlingBill
                        ? 'Settling Payment...'
                        : `Confirm Payment & Settle (₹${Math.round(selectedTableForBilling.total * (1 - billingDiscountPercent / 100)).toLocaleString('en-IN')})`}
                    </span>
                  </button>
                </>
              ) : (
                /* Settled Success State */
                <div className="py-6 text-center space-y-4 font-mono">
                  <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <Check className="w-8 h-8 font-black" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold text-white">Payment Received &amp; Settled!</h4>
                    <p className="text-xs text-slate-400 mt-1">Invoice #{settledSuccessData.invoiceNumber} • Table {settledSuccessData.tableNumber}</p>
                    <p className="text-emerald-400 text-lg font-black mt-2">₹{settledSuccessData.total.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 py-3 bg-theme-bg border border-theme-border text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Receipt</span>
                    </button>
                    <button
                      onClick={() => setSelectedTableForBilling(null)}
                      className="flex-1 py-3 bg-theme-primary text-black font-black text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ITEMIZED PRINTABLE GST TAX INVOICE MODAL
      ───────────────────────────────────────────────────────────── */}
      {viewBillOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewBillOrder(null); }}
        >
          <div className="printable-invoice bg-white text-gray-900 rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4 relative font-mono text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewBillOrder(null)}
              className="no-print absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 border-b border-gray-200 pb-3">
              <div className="flex justify-center items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif font-black text-xl text-gray-900 tracking-wider">SILIGURI'S CHAI ADDAA</h2>
              </div>
              <p className="text-[10px] text-gray-500 font-sans">Artisan Tea House &amp; Comfort Dining</p>
              <p className="text-[9px] text-gray-400">Sevoke Road, Siliguri • FSSAI: 11521001000456</p>
            </div>

            <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Invoice #:</span>
                <span className="font-bold">{viewBillOrder.invoiceNumber || viewBillOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Table:</span>
                <span className="font-bold">Table {viewBillOrder.tableNumber || viewBillOrder.tableId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="font-bold uppercase text-emerald-700">{viewBillOrder.paymentMethod || 'UPI_QR'}</span>
              </div>
            </div>

            <div className="space-y-1.5 border-b border-gray-200 pb-2">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-300 pb-1">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              {(viewBillOrder.items || []).map((it: any, i: number) => (
                <div key={i} className="grid grid-cols-12 text-xs py-0.5 text-gray-800">
                  <span className="col-span-6 truncate font-medium">{it.name}</span>
                  <span className="col-span-2 text-center text-gray-500">{it.quantity || it.qty || 1}</span>
                  <span className="col-span-4 text-right font-bold">
                    ₹{((it.quantity || it.qty || 1) * (it.price || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{(viewBillOrder.subtotal || viewBillOrder.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (2.5%)</span>
                <span>₹{((viewBillOrder.tax || (viewBillOrder.total * 0.05)) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (2.5%)</span>
                <span>₹{((viewBillOrder.tax || (viewBillOrder.total * 0.05)) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t-2 border-gray-900">
                <span>GRAND TOTAL</span>
                <span>₹{(viewBillOrder.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="no-print flex space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setViewBillOrder(null)}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DISH ADD / EDIT MODAL
      ───────────────────────────────────────────────────────────── */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-theme-surface border border-theme-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center space-x-2.5">
                <ChefHat className="w-6 h-6 text-theme-primary" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                  {editingDish ? `Edit "${editingDish.name}"` : 'Add New Recipe Dish'}
                </h3>
              </div>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Saffron Kadak Chai / Paneer Tikka"
                  className="w-full px-3.5 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-white focus:outline-none focus:border-theme-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase tracking-wider block">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="350"
                    className="w-full px-3.5 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-white focus:outline-none focus:border-theme-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select
                    value={dishCategoryId}
                    onChange={(e) => setDishCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-white focus:outline-none focus:border-theme-primary font-mono cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Description</label>
                <textarea
                  rows={2}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Ingredients, preparation and flavor notes..."
                  className="w-full px-3.5 py-2 bg-theme-bg border border-theme-border rounded-xl text-white focus:outline-none focus:border-theme-primary font-mono resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Image URL</label>
                <input
                  type="text"
                  value={dishImageUrl}
                  onChange={(e) => setDishImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-theme-bg border border-theme-border rounded-xl text-white focus:outline-none focus:border-theme-primary font-mono text-[11px]"
                />
              </div>

              {/* Dietary Toggles */}
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider block">Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="p-2.5 bg-theme-bg border border-theme-border rounded-xl flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishIsVeg}
                      onChange={(e) => {
                        setDishIsVeg(e.target.checked);
                        if (e.target.checked) setDishIsNonVeg(false);
                      }}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="font-bold text-emerald-400 text-xs">Vegetarian</span>
                  </label>

                  <label className="p-2.5 bg-theme-bg border border-theme-border rounded-xl flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishIsChefSpecial}
                      onChange={(e) => setDishIsChefSpecial(e.target.checked)}
                      className="accent-amber-400 rounded"
                    />
                    <span className="font-bold text-amber-300 text-xs">Chef Special</span>
                  </label>

                  <label className="p-2.5 bg-theme-bg border border-theme-border rounded-xl flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dishIsBestSeller}
                      onChange={(e) => setDishIsBestSeller(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span className="font-bold text-amber-400 text-xs">Best Seller</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2.5 bg-theme-bg text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-theme-primary text-black font-black rounded-xl cursor-pointer uppercase shadow-md"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rich Order Refund Modal */}
      <OrderRefundModal
        isOpen={isRefundModalOpen}
        order={refundTargetOrder}
        refundedBy="Admin Supervisor"
        onClose={() => {
          setIsRefundModalOpen(false);
          setRefundTargetOrder(null);
        }}
        onSuccess={() => {
          fetchData(false);
        }}
      />

      {/* Table QR Stand Cards Modal */}
      <TableQrStandsModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tables={allTables}
        onRefreshTables={() => fetchData(false)}
      />

      {/* ─────────────────────────────────────────────────────────────
          URGENT CALL SERVICE MODAL (With Blurred Background)
      ───────────────────────────────────────────────────────────── */}
      {activeServiceCall && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B0F19] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden ring-8 ring-amber-500/20">
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Pulsing Bell Badge */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bell className="w-10 h-10 text-amber-400 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
              </span>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-black uppercase tracking-widest rounded-full">
                🚨 Service Request Alert
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-black text-white tracking-tight">
                Table {activeServiceCall.tableId || activeServiceCall.tableNumber}
              </h2>
              <p className="text-sm font-medium text-slate-300">
                {activeServiceCall.reason || 'Diner requested assistance at this table'}
              </p>
              <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-400 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Requested at {activeServiceCall.timestamp || 'Just now'}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={handleDismissServiceCall}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>Acknowledge &amp; Attend Table</span>
              </button>

              <button
                onClick={() => setActiveServiceCall(null)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Dismiss Modal (Keep in Background)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
