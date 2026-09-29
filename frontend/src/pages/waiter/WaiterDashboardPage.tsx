import React, { useState, useEffect, useRef } from 'react';
import { Utensils, Bell, CheckCircle2, Clock, Users, ArrowRight, RefreshCw, AlertTriangle, Layers, DollarSign, Sparkles, Check, X, ChevronRight, PhoneCall, Flame, PackageCheck, Search, BellRing, BellOff, UserPlus, QrCode, ExternalLink, Grid, Receipt, Smartphone } from 'lucide-react';
import { useToast } from '../../components/feedback/ToastContainer';
import { tableService } from '../../services/table.service';
import { orderService } from '../../services/order.service';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

import { TableQrStandsModal } from '../../components/tables/TableQrStandsModal';

interface TableState {
  _id: string;
  tableNumber: number;
  zone?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billing' | 'cleaning';
  guestCount?: number;
  activeOrderId?: string;
  orderTotal?: number;
  orderStatus?: string;
  qrToken?: string;
  items?: { name: string; quantity: number }[];
  cleaningStartedAt?: string | Date;
}

interface WaiterAlert {
  id: number;
  tableId: string;
  reason: string;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED';
}

export const WaiterDashboardPage: React.FC = () => {
  const { showToast } = useToast();

  // Waiter Dispatch Sidebar Tabs
  const [activeTab, setActiveTab] = useState<'TABLE_STATUS' | 'WAITER_CALLS' | 'FOOD_READY' | 'BILL_REQUESTS'>('TABLE_STATUS');

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const [alerts, setAlerts] = useState<WaiterAlert[]>([]);
  const [tables, setTables] = useState<TableState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableState | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Lock background body scroll when table modal is open
  useBodyScrollLock(selectedTable !== null);

  // Payment state
  const [seatGuestCount, setSeatGuestCount] = useState<number>(2);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'CARD_SWIPE' | 'CASH'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const prevReadyCountRef = useRef<number>(0);
  const tableOrdersMapRef = useRef<Map<string, any[]>>(new Map());

  // Web Audio Chime Notification
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

  const fetchFloorState = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const [tableData, activeOrders] = await Promise.all([
        tableService.getAllTables(),
        orderService.getActiveOrders().catch(() => []),
      ]);

      // Group ALL active unpaid orders by tableId to support multi-order sessions
      const tableOrdersMap = new Map<string, any[]>();
      activeOrders.forEach((ord: any) => {
        let numKey = String(ord.tableId || '');
        const matched = numKey.match(/\d+/);
        if (matched) numKey = String(parseInt(matched[0], 10));

        if (!tableOrdersMap.has(numKey)) {
          tableOrdersMap.set(numKey, []);
        }
        tableOrdersMap.get(numKey)!.push(ord);
      });
      tableOrdersMapRef.current = tableOrdersMap;

      // Construct complete array of 30 tables (Table 1 through Table 30)
      const full30TableList: TableState[] = Array.from({ length: 30 }, (_, index) => {
        const num = index + 1;
        let zone = 'Main Hall';
        if (num > 12 && num <= 16) zone = 'VIP Lounge';
        if (num > 16 && num <= 24) zone = 'Outdoor Garden';
        if (num > 24) zone = 'Family Section';

        const existingTable = tableData.find((t: any) => Number(t.tableNumber) === num);
        const statusVal = (existingTable?.status || 'available') as 'available' | 'occupied' | 'billing' | 'cleaning';

        const tableOrders = tableOrdersMap.get(String(num)) || (existingTable ? tableOrdersMap.get(String(existingTable._id)) : []) || [];
        const hasActiveOrders = tableOrders.length > 0;

        // If table has 0 active unpaid orders, but DB status is occupied/billing, automatically transition status to 'cleaning'!
        let computedStatus = statusVal;
        if (!hasActiveOrders && (statusVal === 'billing' || statusVal === 'occupied')) {
          computedStatus = 'cleaning';
        } else if (hasActiveOrders && statusVal === 'available') {
          computedStatus = 'occupied';
        }

        // Cumulative Items & Session Total across all active orders for this table session
        const allItemsList = tableOrders.flatMap((o: any) => o.items || []);
        const cumulativeSessionTotal = tableOrders.reduce((sum: number, o: any) => {
          const itemSum = o.items ? o.items.reduce((s: number, it: any) => s + ((it.quantity || it.qty || 1) * (it.price || it.unitPrice || 0)), 0) : 0;
          const ordTotal = o.totalAmount || o.total || (itemSum > 0 ? itemSum * 1.05 : 0);
          return sum + ordTotal;
        }, 0);

        // Overall order status prioritization (ready > preparing > served > received)
        const latestOrder = tableOrders[tableOrders.length - 1];
        let overallOrderStatus = latestOrder?.status;
        
        const hasUnservedReadyDishes = tableOrders.some((o: any) => {
          if (o.status === 'ready') {
            const items = o.items || [];
            if (items.length === 0) return true;
            return items.some((it: any) => it.status !== 'served');
          }
          return (o.items || []).some((it: any) => it.status === 'ready');
        });

        const hasPreparingDishes = tableOrders.some((o: any) => {
          if (o.status === 'preparing') return true;
          return (o.items || []).some((it: any) => it.status === 'preparing');
        });

        if (hasUnservedReadyDishes) {
          overallOrderStatus = 'ready';
        } else if (hasPreparingDishes) {
          overallOrderStatus = 'preparing';
        } else if (tableOrders.every((o: any) => o.status === 'served' || (o.items || []).every((it: any) => it.status === 'served'))) {
          overallOrderStatus = 'served';
        }

        const isTableActive = computedStatus === 'occupied' || computedStatus === 'billing' || hasActiveOrders;

        return {
          _id: existingTable?._id || `temp-table-${num}`,
          tableNumber: num,
          zone,
          capacity: existingTable?.capacity || (num % 4 === 0 ? 6 : num % 2 === 0 ? 4 : 2),
          status: ['available', 'occupied', 'billing', 'cleaning'].includes(computedStatus) ? computedStatus : 'available',
          guestCount: isTableActive ? (existingTable?.guestCount || 2) : 0,
          activeOrderId: hasActiveOrders ? latestOrder?.orderId : null,
          orderTotal: hasActiveOrders ? cumulativeSessionTotal : 0,
          orderStatus: hasActiveOrders ? overallOrderStatus : undefined,
          items: hasActiveOrders ? allItemsList : [],
          cleaningStartedAt: existingTable?.cleaningStartedAt,
          qrToken: existingTable?.qrToken,
        };
      });

      // Sound chime on new ready orders
      const currentReadyCount = full30TableList.filter((t) => t.orderStatus === 'ready').length;
      if (currentReadyCount > prevReadyCountRef.current && prevReadyCountRef.current !== 0) {
        playAudioChime();
        showToast(`🔥 Hot Food Ready at Kitchen Pass for Pickup!`, 'success', 'Kitchen Ready Alert');
      }
      prevReadyCountRef.current = currentReadyCount;

      setTables(full30TableList);
      if (isManual) showToast('Floor status refreshed (30 Tables Active)', 'info');
    } catch (error) {
      console.error('Failed to fetch floor tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const prevPendingAlertsCountRef = useRef<number>(0);

  const syncWaiterCalls = async () => {
    try {
      const remoteCalls: WaiterAlert[] = await tableService.getWaiterCalls().catch(() => []);
      const localCalls: WaiterAlert[] = JSON.parse(localStorage.getItem('aura_waiter_alerts') || '[]');
      
      const map = new Map<number, WaiterAlert>();

      // 1. Load local cache first
      localCalls.forEach((lc) => {
        if (lc && lc.id) map.set(lc.id, lc);
      });

      // 2. Overlay remote calls from MongoDB
      remoteCalls.forEach((rc) => {
        if (rc && rc.id) {
          const existing = map.get(rc.id);
          // If locally resolved, keep RESOLVED status
          if (existing && existing.status === 'RESOLVED' && rc.status === 'PENDING') {
            map.set(rc.id, existing);
          } else {
            map.set(rc.id, rc);
          }
        }
      });

      const combined = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));

      // 3. Cache combined alerts to local storage so they never vanish
      localStorage.setItem('aura_waiter_alerts', JSON.stringify(combined));

      const pendingCount = combined.filter((a) => a.status === 'PENDING').length;
      if (pendingCount > prevPendingAlertsCountRef.current && prevPendingAlertsCountRef.current !== 0) {
        playAudioChime();
        const latestAlert = combined.find((a) => a.status === 'PENDING');
        if (latestAlert) {
          showToast(`🔔 Table ${latestAlert.tableId} requested: "${latestAlert.reason}"`, 'info', 'Customer Call Alert');
        }
      }
      prevPendingAlertsCountRef.current = pendingCount;

      setAlerts(combined);
    } catch (e) {
      console.error('Failed to sync waiter calls:', e);
    }
  };

  useEffect(() => {
    fetchFloorState();
    syncWaiterCalls();

    const tableInterval = setInterval(() => fetchFloorState(false), 3000); // 3s auto sync
    const alertInterval = setInterval(() => syncWaiterCalls(), 1500); // 1.5s live alert sync
    const timerTickInterval = setInterval(() => setNowTimestamp(Date.now()), 1000); // 1s cleanup countdown tick

    return () => {
      clearInterval(tableInterval);
      clearInterval(alertInterval);
      clearInterval(timerTickInterval);
    };
  }, []);

  const handleAcknowledgeAlert = async (alertId: number) => {
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' as const } : a));
    setAlerts(updated);
    localStorage.setItem('aura_waiter_alerts', JSON.stringify(updated));

    try {
      await tableService.resolveWaiterCall(alertId);
    } catch (err) {
      console.error('Failed to resolve waiter call on API:', err);
    }

    showToast('Customer call acknowledged & resolved', 'success');
  };

  // Instant Table Status Updater with Strict Business Rule Validation
  const handleUpdateTableStatus = async (
    e: React.MouseEvent | null,
    tableId: string,
    tableNum: number,
    nextStatus: 'available' | 'occupied' | 'billing' | 'cleaning',
    guestCountParam?: number
  ) => {
    if (e) e.stopPropagation();

    const targetTable = tables.find((t) => t.tableNumber === tableNum);
    if (!targetTable) return;

    // Rule 1: Available table CANNOT directly transition to Billing (must be occupied with active order)
    if (nextStatus === 'billing' && targetTable.status === 'available') {
      showToast(
        `Cannot request bill for Table ${tableNum}! Table is empty/available. Guests must be seated ('Occupied') and place an order first.`,
        'error',
        'Invalid Status Transition'
      );
      return;
    }

    // Rule 2: Cleaning table CANNOT directly transition to Billing
    if (nextStatus === 'billing' && targetTable.status === 'cleaning') {
      showToast(
        `Cannot request bill for Table ${tableNum}! Table is currently being cleaned.`,
        'error',
        'Invalid Status Transition'
      );
      return;
    }

    // Rule 3: Occupied table without any active unpaid items CANNOT transition to Billing
    if (nextStatus === 'billing' && (!targetTable.items || targetTable.items.length === 0)) {
      showToast(
        `Cannot set Table ${tableNum} to Billing! No active unpaid dining order found. Bill may already be settled.`,
        'error',
        'No Active Unpaid Order'
      );
      return;
    }

    // Rule 4: Billing table CANNOT transition directly back to Available without Admin bill settlement
    if (nextStatus === 'available' && targetTable.status === 'billing') {
      showToast(
        `Table ${tableNum} is awaiting bill settlement in Admin Billing. Settle payment in Admin or set to Cleaning.`,
        'info',
        'Bill Payment Required'
      );
      return;
    }

    // Rule 5: Cannot set table to Cleaning if table is occupied with active order or has an unpaid bill
    if (nextStatus === 'cleaning') {
      if (targetTable.status === 'occupied' && targetTable.activeOrderId) {
        showToast(
          `Table ${tableNum} is currently dining with order #${targetTable.activeOrderId}. Please complete dining & settle bill before cleaning.`,
          'error',
          'Active Dining Session'
        );
        return;
      }
      if (targetTable.status === 'billing' || (targetTable.orderTotal && targetTable.orderTotal > 0)) {
        showToast(
          `Table ${tableNum} has an unpaid balance of ₹${targetTable.orderTotal?.toFixed(2) || '0.00'}! Settle bill in Admin Billing before setting table to Cleaning.`,
          'error',
          'Unpaid Bill Pending'
        );
        return;
      }
    }

    // Rule 6: Billing table CANNOT transition back to Occupied (dining)
    if (nextStatus === 'occupied' && targetTable.status === 'billing') {
      showToast(
        `Table ${tableNum} is currently in Billing status! Cannot revert to Occupied dining. Settle payment or set to Cleaning once guests depart.`,
        'error',
        'Billing In Progress'
      );
      return;
    }

    // Instant local UI update
    const finalGuests = nextStatus === 'occupied' ? (guestCountParam || targetTable.guestCount || 2) : 0;
    const cleaningStartedAtVal = nextStatus === 'cleaning' ? new Date().toISOString() : undefined;
    setTables((prev) =>
      prev.map((t) => (t.tableNumber === tableNum ? { ...t, status: nextStatus, guestCount: finalGuests, cleaningStartedAt: cleaningStartedAtVal } : t))
    );
    if (selectedTable && selectedTable.tableNumber === tableNum) {
      setSelectedTable((prev) => (prev ? { ...prev, status: nextStatus, guestCount: finalGuests, cleaningStartedAt: cleaningStartedAtVal } : null));
    }

    try {
      await tableService.updateTableStatus(
        tableId.startsWith('temp-') ? String(tableNum) : tableId,
        nextStatus,
        guestCountParam
      );
      showToast(`Table ${tableNum} status set to ${nextStatus.toUpperCase()} (${finalGuests} Seated)`, 'success');
      fetchFloorState();
    } catch (error: any) {
      const msg = error?.response?.data?.message || `Table ${tableNum} status set to ${nextStatus.toUpperCase()}`;
      showToast(msg, 'info');
    }
  };

  const handleSeatWalkInGuests = async (tableId: string, tableNum: number) => {
    handleUpdateTableStatus(null, tableId, tableNum, 'occupied', seatGuestCount);
    showToast(`Seated ${seatGuestCount} walk-in guests at Table ${tableNum}!`, 'success');
    setSelectedTable(null);
  };

  const handleSettlePayment = async (tableNum: number) => {
    setIsProcessingPayment(true);
    try {
      const res = await orderService.settleTableBill(tableNum, selectedPaymentMethod);
      const invNum = res?.data?.invoiceNumber || 'INV-SETTLED';

      showToast(`Bill settled via ${selectedPaymentMethod}! Invoice #${invNum} generated. Table ${tableNum} set to Cleaning.`, 'success');
      playAudioChime();
      setSelectedTable(null);
      await fetchFloorState();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || 'Failed to settle bill';
      showToast(errMsg, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleMarkServed = async (e: React.MouseEvent, orderId: string, tableNumber?: number) => {
    e.stopPropagation();
    try {
      if (tableNumber) {
        const tableOrds = tableOrdersMapRef.current.get(String(tableNumber)) || [];
        const readyOrds = tableOrds.filter((o: any) => o.status === 'ready');
        if (readyOrds.length > 0) {
          await Promise.all(readyOrds.map((o: any) => orderService.updateOrderStatus(o.orderId || o._id, 'served')));
          showToast(`All ready dishes for Table ${tableNumber} marked SERVED to guest!`, 'success');
        } else {
          await orderService.updateOrderStatus(orderId, 'served');
          showToast(`Order #${orderId} marked SERVED to guest!`, 'success');
        }
      } else {
        await orderService.updateOrderStatus(orderId, 'served');
        showToast(`Order #${orderId} marked SERVED to guest!`, 'success');
      }

      if (selectedTable) setSelectedTable(null);
      await fetchFloorState();
    } catch (error) {
      showToast('Failed to update order status', 'error');
    }
  };

  const getCleaningTimeRemaining = (cleaningStartedAt?: string | Date) => {
    if (!cleaningStartedAt) return '2m 30s';
    const startMs = new Date(cleaningStartedAt).getTime();
    const elapsedSecs = Math.max(0, Math.floor((nowTimestamp - startMs) / 1000));
    const remainingSecs = Math.max(0, 150 - elapsedSecs);
    if (remainingSecs === 0) return 'Ready';
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Visual Badging for Table Statuses
  const getStatusBadgeStyle = (status: TableState['status'], orderStatus?: string) => {
    if (orderStatus === 'ready') {
      return 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/50 animate-pulse';
    }
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:border-emerald-400';
      case 'occupied':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-400';
      case 'billing':
        return 'bg-purple-500/20 border-purple-400 text-purple-300 ring-2 ring-purple-400/50 animate-pulse';
      case 'cleaning':
        return 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500';
    }
  };

  // Filter Tables
  const filteredTables = tables.filter((t) => {
    const matchesZone = selectedZone === 'ALL' || t.zone === selectedZone;
    const matchesSearch = searchTableQuery === '' || String(t.tableNumber).includes(searchTableQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'READY') matchesStatus = t.orderStatus === 'ready';
    else if (statusFilter === 'OCCUPIED') matchesStatus = t.status === 'occupied';
    else if (statusFilter === 'BILLING') matchesStatus = t.status === 'billing';
    else if (statusFilter === 'AVAILABLE') matchesStatus = t.status === 'available';
    else if (statusFilter === 'CLEANING') matchesStatus = t.status === 'cleaning';

    return matchesZone && matchesSearch && matchesStatus;
  });

  const activePendingAlerts = alerts.filter((a) => a.status === 'PENDING');
  const readyToServeTables = tables.filter((t) => t.orderStatus === 'ready');
  const billingTables = tables.filter((t) => t.status === 'billing');

  const totalTables = tables.length; // 30
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billingCount = tables.filter((t) => t.status === 'billing').length;

  return (
    <div className="page-theme-waiter flex flex-col h-full min-h-0 w-full font-sans text-theme-text bg-theme-bg overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          COMPACT TOP CONTROL & DISPATCH RAIL (Full Width, Mobile-First)
      ───────────────────────────────────────────────────────────────── */}
      <div className="bg-theme-surface/95 backdrop-blur-md border-b border-theme-border px-3 sm:px-6 py-2.5 space-y-2.5 flex-shrink-0 z-20 shadow-sm">
        {/* Row 1: Station Title, Stats Summary, Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/30 flex items-center justify-center flex-shrink-0">
              <Utensils className="w-4 h-4 text-theme-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="font-serif text-sm sm:text-base font-black text-theme-text tracking-wide truncate">
                  FLOOR PASS
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              </div>
              <p className="text-[10px] text-theme-muted font-mono hidden sm:block">Tactical 30-Table Realtime Grid</p>
            </div>
          </div>

          {/* Quick Controls: Alerts Sound & Refresh */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-theme-bg text-theme-muted border-theme-border'
              }`}
              title={soundEnabled ? 'Floor Alerts ON' : 'Alerts Muted'}
            >
              {soundEnabled ? <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <BellOff className="w-3.5 h-3.5 text-theme-muted" />}
              <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => fetchFloorState(true)}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-theme-bg border border-theme-border hover:border-theme-border-strong text-theme-text rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
              title="Sync Floor State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-theme-primary' : ''}`} />
              <span className="hidden sm:inline text-[11px]">Sync</span>
            </button>
          </div>
        </div>

        {/* Row 2: Queue Tabs + Quick Status Filters (Horizontal Swipeable Rail) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1.5 pt-0.5">
          {/* Main Dispatch Queues */}
          <button
            onClick={() => setActiveTab('TABLE_STATUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              activeTab === 'TABLE_STATUS'
                ? 'bg-theme-primary text-black border-theme-primary shadow-md font-black'
                : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Tables</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-black">30</span>
          </button>

          <button
            onClick={() => setActiveTab('FOOD_READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              activeTab === 'FOOD_READY'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md font-black'
                : readyToServeTables.length > 0
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse font-bold'
                : 'bg-theme-bg text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${readyToServeTables.length > 0 ? 'animate-spin text-cyan-300' : ''}`} />
            <span>Ready Pass</span>
            {readyToServeTables.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 font-black text-cyan-200">
                {readyToServeTables.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('WAITER_CALLS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              activeTab === 'WAITER_CALLS'
                ? 'bg-rose-500 text-white border-rose-400 shadow-md font-black'
                : activePendingAlerts.length > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-400 animate-pulse font-bold'
                : 'bg-theme-bg text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${activePendingAlerts.length > 0 ? 'animate-bounce text-rose-300' : ''}`} />
            <span>Calls</span>
            {activePendingAlerts.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-900/60 font-black text-rose-200">
                {activePendingAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('BILL_REQUESTS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border cursor-pointer ${
              activeTab === 'BILL_REQUESTS'
                ? 'bg-purple-500 text-white border-purple-400 shadow-md font-black'
                : billingCount > 0
                ? 'bg-purple-500/20 text-purple-300 border-purple-400 animate-pulse font-bold'
                : 'bg-theme-bg text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Bills</span>
            {billingCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 font-black text-purple-200">
                {billingCount}
              </span>
            )}
          </button>

          {/* Table QR Stand Generator & Print Manager */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer shadow-sm"
            title="View & Print Table QR Code Stands"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Stands</span>
          </button>

          <div className="h-4 w-px bg-theme-border flex-shrink-0 mx-1" />

          {/* Inline Status Filter Pills (when on TABLE_STATUS) */}
          {activeTab === 'TABLE_STATUS' && (
            <>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-theme-surface-hover text-theme-text border-theme-border-strong font-black'
                    : 'bg-theme-bg text-theme-muted border-theme-border'
                }`}
              >
                All ({totalTables})
              </button>
              <button
                onClick={() => setStatusFilter('AVAILABLE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  statusFilter === 'AVAILABLE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black'
                    : 'bg-theme-bg text-emerald-400/80 border-theme-border'
                }`}
              >
                Free ({availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('OCCUPIED')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  statusFilter === 'OCCUPIED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-black'
                    : 'bg-theme-bg text-amber-400/80 border-theme-border'
                }`}
              >
                Dine ({occupiedCount})
              </button>
              <button
                onClick={() => setStatusFilter('BILLING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  statusFilter === 'BILLING'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400 font-black'
                    : 'bg-theme-bg text-purple-400/80 border-theme-border'
                }`}
              >
                Bill ({billingCount})
              </button>
              <button
                onClick={() => setStatusFilter('CLEANING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                  statusFilter === 'CLEANING'
                    ? 'bg-slate-700/60 text-slate-200 border-slate-500 font-black'
                    : 'bg-theme-bg text-slate-400 border-theme-border'
                }`}
              >
                Clean
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Workspace — Page controls its own scroll */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 min-w-0">
        {/* Top Banner Alert on Main Content */}
        {(readyToServeTables.length > 0 || activePendingAlerts.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {readyToServeTables.length > 0 && (
              <div
                onClick={() => setActiveTab('FOOD_READY')}
                className="p-3 sm:p-4 bg-cyan-500/10 border border-cyan-400/50 hover:border-cyan-400 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center space-x-3">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-bounce" />
                  <div>
                    <span className="font-bold text-[11px] text-cyan-300 uppercase tracking-wider block">
                      Hot Food Pickup Alert!
                    </span>
                    <p className="text-xs text-white font-bold">
                      {readyToServeTables.length} Table(s) ready at Kitchen Pass
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-cyan-500 text-black font-black text-xs uppercase rounded-xl shadow-md">
                  Serve &rarr;
                </span>
              </div>
            )}

            {activePendingAlerts.length > 0 && (
              <div
                onClick={() => setActiveTab('WAITER_CALLS')}
                className="p-3 sm:p-4 bg-rose-500/10 border border-rose-500/50 hover:border-rose-400 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 animate-bounce" />
                  <div>
                    <span className="font-bold text-[11px] text-rose-300 uppercase tracking-wider block">
                      Customer Call Alert!
                    </span>
                    <p className="text-xs text-white font-bold">
                      {activePendingAlerts.length} Customer assistance call pending
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow-md">
                  View &rarr;
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: 30-TABLE FLOOR GRID */}
        {activeTab === 'TABLE_STATUS' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Zone Filter Chips & Quick Table Search */}
            <div className="bg-theme-surface border border-theme-border rounded-2xl p-2.5 sm:p-3.5 shadow-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Zone Filter Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                  {['ALL', 'Main Hall', 'VIP Lounge', 'Outdoor Garden', 'Family Section'].map((zone) => (
                    <button
                      key={zone}
                      onClick={() => setSelectedZone(zone)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase whitespace-nowrap border cursor-pointer ${
                        selectedZone === zone
                          ? 'bg-theme-primary text-black border-theme-primary font-black shadow-sm'
                          : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>

                {/* Table Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTableQuery}
                    onChange={(e) => setSearchTableQuery(e.target.value)}
                    placeholder="Search Table #..."
                    className="w-full pl-8 pr-3 py-1.5 bg-theme-bg border border-theme-border rounded-xl text-xs text-theme-text placeholder:text-theme-muted/50 focus:outline-none focus:border-theme-primary font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 30 Table Grid — Compact, Mobile-First (2 cols on phones, up to 6 on ultra-wide) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold text-theme-muted uppercase tracking-wider">
                  Tables Grid ({filteredTables.length}/30)
                </span>
                <span className="text-[11px] font-mono text-theme-primary font-bold">
                  Tap card for detail / actions
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {filteredTables.map((table) => {
                  const pendingAlert = activePendingAlerts.find(
                    (a) => String(a.tableId) === String(table.tableNumber) || Number(a.tableId) === table.tableNumber
                  );

                  return (
                    <div
                      key={table.tableNumber}
                      onClick={() => setSelectedTable(table)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] shadow-md flex flex-col justify-between space-y-2.5 relative overflow-hidden ${
                        pendingAlert ? 'ring-2 ring-rose-500 shadow-rose-500/20' : ''
                      } ${getStatusBadgeStyle(table.status, table.orderStatus)}`}
                    >
                      {/* Active Waiter Call Urgent Banner */}
                      {pendingAlert && (
                        <div className="py-1 px-2 bg-rose-600 text-white rounded-lg flex items-center justify-between text-[10px] font-black tracking-tight shadow-sm animate-pulse">
                          <span className="flex items-center space-x-1 truncate">
                            <Bell className="w-3 h-3 shrink-0 text-white" />
                            <span className="truncate">{pendingAlert.reason}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledgeAlert(pendingAlert.id);
                            }}
                            className="ml-1 px-1.5 py-0.5 bg-white text-rose-700 hover:bg-rose-100 rounded font-black uppercase text-[8px] cursor-pointer shrink-0"
                            title="Acknowledge & clear call"
                          >
                            Done
                          </button>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-base sm:text-lg font-black tracking-tight">
                            T-{table.tableNumber < 10 ? `0${table.tableNumber}` : table.tableNumber}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-current">
                            {table.orderStatus === 'ready'
                              ? 'READY'
                              : table.status === 'cleaning'
                              ? `CLEAN (${getCleaningTimeRemaining(table.cleaningStartedAt)})`
                              : table.status}
                          </span>
                        </div>

                        {/* Capacity & Occupancy Badge */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[10px] font-mono opacity-75">
                            Cap: {table.capacity}
                          </span>

                          {table.status === 'occupied' || table.status === 'billing' ? (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-current/15 border border-current/30 flex items-center gap-1">
                              <Users className="w-3 h-3 text-current" />
                              <span>{table.guestCount || 2}</span>
                            </span>
                          ) : table.status === 'cleaning' ? (
                            <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>{getCleaningTimeRemaining(table.cleaningStartedAt)}</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono opacity-70 truncate max-w-[65px]">
                              {table.zone?.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Active Order Total */}
                      {table.orderTotal !== undefined && table.orderTotal > 0 && table.status !== 'available' && (
                        <div className="py-1 px-2 bg-black/40 rounded-lg border border-current/20 text-[11px] flex justify-between items-center font-mono">
                          <span className="opacity-70 text-[10px]">Total</span>
                          <span className="font-bold font-mono">₹{Math.round(table.orderTotal).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {/* Quick Mark Served if Hot Food is Ready */}
                      {table.orderStatus === 'ready' && table.activeOrderId && (
                        <button
                          onClick={(e) => handleMarkServed(e, table.activeOrderId!, table.tableNumber)}
                          className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5 font-bold" />
                          <span>Serve</span>
                        </button>
                      )}

                      {/* DIRECT 1-TAP STATUS SWITCHER TOOLBAR ON CARD */}
                      <div className="pt-2 border-t border-current/20">
                        <div className="grid grid-cols-4 gap-1">
                        <button
                          onClick={(e) => handleUpdateTableStatus(e, table._id, table.tableNumber, 'available')}
                          className={`py-1 text-[9px] font-bold rounded-lg transition-all border cursor-pointer text-center ${
                            table.status === 'available'
                              ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-sm'
                              : 'bg-black/30 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Mark Available"
                        >
                          Avail
                        </button>

                        <button
                          onClick={(e) => handleUpdateTableStatus(e, table._id, table.tableNumber, 'occupied')}
                          className={`py-1 text-[9px] font-bold rounded-lg transition-all border cursor-pointer text-center ${
                            table.status === 'occupied'
                              ? 'bg-amber-500 text-black border-amber-400 font-black shadow-sm'
                              : 'bg-black/30 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Mark Occupied"
                        >
                          Dine
                        </button>

                        <button
                          onClick={(e) => handleUpdateTableStatus(e, table._id, table.tableNumber, 'billing')}
                          className={`py-1 text-[9px] font-bold rounded-lg transition-all border text-center ${
                            table.status === 'available' || table.status === 'cleaning'
                              ? 'bg-black/20 text-purple-500/30 border-purple-500/10 cursor-not-allowed'
                              : table.status === 'billing'
                              ? 'bg-purple-500 text-white border-purple-400 font-black shadow-sm cursor-pointer'
                              : 'bg-black/30 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 cursor-pointer'
                          }`}
                          title={table.status === 'available' ? 'Cannot bill empty table' : 'Mark Bill Requested'}
                        >
                          Bill
                        </button>

                        <button
                          onClick={(e) => handleUpdateTableStatus(e, table._id, table.tableNumber, 'cleaning')}
                          className={`py-1 text-[9px] font-bold rounded-lg transition-all border cursor-pointer text-center ${
                            table.status === 'cleaning'
                              ? 'bg-slate-600 text-white border-slate-400 font-black shadow-sm'
                              : 'bg-black/30 text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                          }`}
                          title="Mark Cleaning"
                        >
                          Clean
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER WAITER ASSISTANCE CALLS */}
        {activeTab === 'WAITER_CALLS' && (
          <div className="bg-aura-container border border-aura-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-aura-border/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl">
                  <Bell className="w-6 h-6 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-aura-ivory">Customer Assistance Calls</h2>
                  <p className="text-xs text-aura-slate">Live table waiter alerts from customer mobile apps</p>
                </div>
              </div>
              <span className="px-3.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold text-xs">
                {activePendingAlerts.length} Active Calls
              </span>
            </div>

            {activePendingAlerts.length === 0 ? (
              <div className="py-12 text-center text-aura-slate text-xs space-y-3 bg-aura-obsidian/40 border border-aura-border/40 rounded-2xl">
                <PhoneCall className="w-10 h-10 mx-auto text-aura-slate/40" />
                <p className="text-sm font-semibold text-aura-ivory">All Customers Attended!</p>
                <p className="text-xs text-aura-slate">No pending waiter assistance calls right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePendingAlerts.map((alert) => (
                  <div key={alert.id} className="p-5 bg-aura-obsidian border-2 border-rose-500 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl shadow-rose-950/30 animate-pulse">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-serif font-black text-aura-ivory text-xl">Table {alert.tableId}</span>
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-500/30 px-2.5 py-0.5 rounded-full border border-rose-400 font-black">
                          🔔 CALLING NOW
                        </span>
                      </div>

                      <p className="text-sm text-rose-200 font-bold flex items-center space-x-2">
                        <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{alert.reason}</span>
                      </p>

                      <span className="text-[10px] text-aura-slate font-mono block">Requested: {alert.timestamp}</span>
                    </div>

                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Acknowledge &amp; Mark Attended</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Resolved Calls History Today */}
            {alerts.some(a => a.status === 'RESOLVED') && (
              <div className="pt-6 border-t border-aura-border/50 space-y-3">
                <h3 className="text-xs font-bold text-aura-slate uppercase font-mono tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recently Attended Calls ({alerts.filter(a => a.status === 'RESOLVED').length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {alerts.filter(a => a.status === 'RESOLVED').slice(0, 9).map((alert) => (
                    <div key={alert.id} className="p-3 bg-aura-obsidian/60 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-aura-ivory font-mono">Table {alert.tableId}</span>
                        <p className="text-[10px] text-aura-slate truncate max-w-[180px]">{alert.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ✓ Attended
                        </span>
                        <span className="text-[9px] text-aura-slate block font-mono mt-0.5">{alert.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FOOD READY FOR SERVE */}
        {activeTab === 'FOOD_READY' && (
          <div className="bg-aura-container border border-aura-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-aura-border/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl">
                  <Flame className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-aura-ivory">Kitchen Pickup Pass (Food Ready to Serve)</h2>
                  <p className="text-xs text-aura-slate">Dishes confirmed ready by head chef, waiting for waiter pickup</p>
                </div>
              </div>
              <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-xs">
                {readyToServeTables.length} Tables Ready
              </span>
            </div>

            {readyToServeTables.length === 0 ? (
              <div className="py-16 text-center text-aura-slate text-xs space-y-3 bg-aura-obsidian/40 border border-aura-border/40 rounded-2xl">
                <PackageCheck className="w-12 h-12 mx-auto text-aura-slate/40" />
                <p className="text-sm font-semibold text-aura-ivory">Kitchen Pass Clear!</p>
                <p className="text-xs text-aura-slate">No dishes currently waiting at the kitchen pass.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyToServeTables.map((tbl) => {
                  const tableOrds = tableOrdersMapRef.current.get(String(tbl.tableNumber)) || [];
                  
                  // Extract ONLY items that are marked ready or prepared and NOT YET SERVED!
                  const readyItems = tableOrds
                    .flatMap((o: any) => (o.items || []).map((it: any) => ({ ...it, parentStatus: o.status })))
                    .filter((it: any) => (it.status === 'ready' || (it.parentStatus === 'ready' && it.status !== 'served')) && it.status !== 'served');

                  // If all items for this table are already served, skip rendering this card
                  if (readyItems.length === 0) return null;

                  const displayOrderId = tbl.activeOrderId || (tableOrds.length > 0 ? tableOrds[tableOrds.length - 1].orderId : 'ORD-101');

                  return (
                    <div key={tbl._id} className="p-5 bg-aura-obsidian border border-emerald-500/40 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-serif font-black text-aura-ivory text-2xl">Table {tbl.tableNumber}</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                            {tbl.zone}
                          </span>
                        </div>

                        <p className="text-xs text-emerald-300 font-bold flex items-center space-x-1.5">
                          <Flame className="w-4 h-4 text-emerald-400" />
                          <span>Order #{displayOrderId} ({readyItems.length} New Ready Dishes)</span>
                        </p>

                        {/* Dish Items List */}
                        <div className="space-y-1 bg-aura-container/60 p-2.5 rounded-xl border border-aura-border/40 text-xs">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-aura-slate block mb-1">
                            Dishes Ready For Pickup ({readyItems.length}):
                          </span>
                          {readyItems.map((it: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-aura-border/20 last:border-0 font-medium text-aura-ivory">
                              <span>{it.quantity || 1}x {it.name}</span>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase">Ready</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleMarkServed(e, displayOrderId!, tbl.tableNumber)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-aura-obsidian font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4 font-bold" />
                        <span>Confirm {readyItems.length} Dish(es) Served to Guest</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BILL REQUESTS */}
        {activeTab === 'BILL_REQUESTS' && (
          <div className="bg-aura-container border border-aura-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-aura-border/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl">
                  <Receipt className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-aura-ivory">Tables Awaiting Checkout Bill</h2>
                  <p className="text-xs text-aura-slate">Tables that requested final bill calculation</p>
                </div>
              </div>
              <span className="px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold text-xs">
                {billingTables.length} Tables Billing
              </span>
            </div>

            {billingTables.length === 0 ? (
              <div className="py-16 text-center text-aura-slate text-xs space-y-3 bg-aura-obsidian/40 border border-aura-border/40 rounded-2xl">
                <Clock className="w-12 h-12 mx-auto text-aura-slate/40" />
                <p className="text-sm font-semibold text-aura-ivory">No Checkout Requests!</p>
                <p className="text-xs text-aura-slate">No tables currently requesting checkout bills.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {billingTables.map((tbl) => (
                  <div key={tbl._id} className="p-5 bg-aura-obsidian border border-amber-500/40 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl">
                    <div className="space-y-2 font-mono">
                      <span className="font-serif font-black text-aura-ivory text-2xl">Table {tbl.tableNumber}</span>
                      <p className="text-sm text-amber-300 font-bold">
                        Bill Total: ₹{(tbl.orderTotal || 0).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] text-aura-slate block">{tbl.zone}</span>
                    </div>

                    <button
                      onClick={() => setSelectedTable(tbl)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-aura-obsidian font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      View Details & Pay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Table Detail Modal / Mobile Bottom Sheet */}
      {selectedTable && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedTable(null); }}
        >
          <div className="bg-theme-surface border border-theme-border rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative flex flex-col h-[94vh] sm:h-[88vh] max-h-[96vh] animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1 bg-theme-border rounded-full mx-auto mt-3 sm:hidden" />

            {/* Fixed header */}
            <div className="p-4 sm:p-6 pb-3 border-b border-theme-border flex-shrink-0">
              <button
                onClick={() => setSelectedTable(null)}
                className="absolute top-4 sm:top-5 right-4 sm:right-5 text-theme-muted hover:text-theme-text p-1.5 rounded-lg hover:bg-theme-surface-hover cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-theme-text">
                    Table {selectedTable.tableNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getStatusBadgeStyle(selectedTable.status, selectedTable.orderStatus)}`}>
                    {selectedTable.orderStatus === 'ready' ? 'READY TO SERVE' : selectedTable.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-theme-muted">{selectedTable.zone}</p>
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-theme-muted">
                      <span className="text-theme-text font-bold">Max:</span> {selectedTable.capacity} seats
                    </span>
                    {(selectedTable.status === 'occupied' || selectedTable.status === 'billing') && (
                      <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 font-bold rounded-lg border border-cyan-400/50 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{selectedTable.guestCount || 2}/{selectedTable.capacity} Seated</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Active Waiter Call Alert in Modal */}
              {(() => {
                const tableAlert = activePendingAlerts.find(
                  (a) => String(a.tableId) === String(selectedTable.tableNumber) || Number(a.tableId) === selectedTable.tableNumber
                );
                if (!tableAlert) return null;
                return (
                  <div className="p-4 bg-rose-500/20 border-2 border-rose-500 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-rose-300 flex items-center space-x-1.5 uppercase tracking-wide">
                        <Bell className="w-4 h-4 text-rose-400" />
                        <span>Active Assistance Call</span>
                      </span>
                      <p className="text-sm font-bold text-white">{tableAlert.reason}</p>
                      <span className="text-[10px] text-rose-200/70 font-mono block">Requested: {tableAlert.timestamp}</span>
                    </div>
                    <button
                      onClick={() => handleAcknowledgeAlert(tableAlert.id)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center space-x-1 shrink-0 ml-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Attended</span>
                    </button>
                  </div>
                );
              })()}

              {/* Quick Seating Action for Available Tables */}
              {selectedTable.status === 'available' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                    <UserPlus className="w-4 h-4" />
                    <span>Seat Walk-In Guests</span>
                  </span>
                  
                  <div className="flex items-center justify-between text-xs text-theme-muted">
                    <span>Select party size (Max: {selectedTable.capacity})</span>
                    <div className="flex space-x-2">
                      {[2, 4, 6, 8].filter(n => n <= selectedTable.capacity).concat(
                        selectedTable.capacity > 8 ? [selectedTable.capacity] : []
                      ).map((num) => (
                        <button
                          key={num}
                          onClick={() => setSeatGuestCount(num)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs font-mono transition-all cursor-pointer ${
                            seatGuestCount === num
                              ? 'bg-emerald-500 text-black shadow-md font-black'
                              : 'bg-theme-bg text-theme-muted border border-theme-border hover:text-theme-text'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSeatWalkInGuests(selectedTable._id, selectedTable.tableNumber)}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Confirm &amp; Seat {seatGuestCount} Guests
                  </button>
                </div>
              )}

              {/* Digital Menu Link Launcher */}
              <div>
                <a
                  href={selectedTable.qrToken ? `/dine/${selectedTable.qrToken}` : `/table/${selectedTable.tableNumber}/menu`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-theme-bg border border-theme-border hover:border-emerald-500 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Launch Verified Menu (Table {selectedTable.tableNumber})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-theme-muted" />
                </a>
              </div>

              {/* Active Items */}
              {selectedTable.items && selectedTable.items.length > 0 && (
                <div className="space-y-2 border-t border-b border-theme-border py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider block font-bold">
                      Active Dining Order ({selectedTable.activeOrderId})
                    </span>
                    {selectedTable.orderStatus && (
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                        Kitchen: {selectedTable.orderStatus}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTable.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs p-2.5 bg-theme-bg/80 border border-theme-border rounded-xl">
                        <span className="font-bold text-theme-text">{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>

                  {selectedTable.orderTotal !== undefined && selectedTable.orderTotal > 0 && (
                    <div className="flex justify-between text-sm font-bold pt-2 text-theme-primary font-mono">
                      <span>Session Bill Total:</span>
                      <span>₹{Math.round(selectedTable.orderTotal).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Settlement Terminal — only when status is billing */}
              {selectedTable.status === 'billing' && selectedTable.orderTotal !== undefined && selectedTable.orderTotal > 0 && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5 font-mono">
                      <Receipt className="w-4 h-4 text-purple-400" />
                      <span>SETTLE BILL &amp; COLLECT PAYMENT</span>
                    </span>
                    <span className="text-xs font-mono font-black text-purple-300">
                      ₹{Math.round(selectedTable.orderTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider block font-bold">
                      Select Payment Collection Method:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedPaymentMethod('UPI')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                          selectedPaymentMethod === 'UPI'
                            ? 'bg-purple-500 text-white border-purple-400 font-black shadow-md'
                            : 'bg-theme-bg text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>UPI</span>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('CARD_SWIPE')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                          selectedPaymentMethod === 'CARD_SWIPE'
                            ? 'bg-purple-500 text-white border-purple-400 font-black shadow-md'
                            : 'bg-theme-bg text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
                        }`}
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Card POS</span>
                      </button>

                      <button
                        onClick={() => setSelectedPaymentMethod('CASH')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1 ${
                          selectedPaymentMethod === 'CASH'
                            ? 'bg-purple-500 text-white border-purple-400 font-black shadow-md'
                            : 'bg-theme-bg text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Cash</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSettlePayment(selectedTable.tableNumber)}
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-purple-500/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4 font-bold" />
                    <span>{isProcessingPayment ? 'Processing Settlement...' : `Confirm Payment & Settle Bill (₹${Math.round(selectedTable.orderTotal || 0).toLocaleString('en-IN')})`}</span>
                  </button>
                </div>
              )}

              {/* Cleaning / Settled Status Banner */}
              {selectedTable.status === 'cleaning' && (
                <div className="p-4 bg-slate-500/15 border border-slate-400/40 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-slate-300 font-bold text-xs uppercase tracking-wider font-mono">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>BILL PAID &amp; CLOSED: CLEANING REQUIRED</span>
                  </div>
                  <p className="text-[11px] text-theme-muted">
                    This session is settled. Please sanitize table &amp; reset utensils for next guests.
                  </p>
                  <button
                    onClick={(e) => handleUpdateTableStatus(e, selectedTable._id, selectedTable.tableNumber, 'available')}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4 font-bold" />
                    <span>Mark Table Cleaned &amp; Ready for Guests</span>
                  </button>
                </div>
              )}

              {/* Mark Served Action if Order is Ready */}
              {selectedTable.orderStatus === 'ready' && selectedTable.activeOrderId && (
                <button
                  onClick={(e) => handleMarkServed(e, selectedTable.activeOrderId!, selectedTable.tableNumber)}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer animate-pulse"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Food Served to Guest</span>
                </button>
              )}

              {/* Quick Status Control Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider block font-bold">
                  Update Table Occupancy Status
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={(e) => handleUpdateTableStatus(e, selectedTable._id, selectedTable.tableNumber, 'available')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTable.status === 'available'
                        ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-sm'
                        : 'bg-theme-bg text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                    }`}
                  >
                    Available
                  </button>

                  <button
                    onClick={(e) => handleUpdateTableStatus(e, selectedTable._id, selectedTable.tableNumber, 'occupied')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTable.status === 'occupied'
                        ? 'bg-amber-500 text-black border-amber-400 font-black shadow-sm'
                        : 'bg-theme-bg text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                    }`}
                  >
                    Occupied
                  </button>

                  <button
                    onClick={(e) => handleUpdateTableStatus(e, selectedTable._id, selectedTable.tableNumber, 'billing')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTable.status === 'billing'
                        ? 'bg-purple-500 text-white border-purple-400 font-black shadow-sm'
                        : 'bg-theme-bg text-purple-400 border-purple-500/30 hover:bg-purple-500/10'
                    }`}
                  >
                    Billing
                  </button>

                  <button
                    onClick={(e) => handleUpdateTableStatus(e, selectedTable._id, selectedTable.tableNumber, 'cleaning')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedTable.status === 'cleaning'
                        ? 'bg-slate-600 text-white border-slate-400 font-black shadow-sm'
                        : 'bg-theme-bg text-slate-400 border-slate-500/30 hover:bg-slate-500/10'
                    }`}
                  >
                    Cleaning
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedTable(null)}
                className="w-full py-3 bg-theme-bg border border-theme-border text-theme-muted font-bold text-xs uppercase rounded-xl hover:text-theme-text transition-all cursor-pointer flex-shrink-0"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table QR Stand Cards Modal */}
      <TableQrStandsModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tables={tables as any}
        onRefreshTables={fetchFloorState}
      />
    </div>
  );
};

