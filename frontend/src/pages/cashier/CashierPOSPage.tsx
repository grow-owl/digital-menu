import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, DollarSign, Receipt, Printer, CheckCircle, Split, ShieldCheck, RefreshCw, X, Building2, Check, Search, Phone, FileText, Eye, RotateCcw, Award, Sparkles, Gift } from 'lucide-react';
import { useToast } from '../../components/feedback/ToastContainer';
import { tableService } from '../../services/table.service';
import { orderService } from '../../services/order.service';
import { loyaltyService } from '../../services/loyalty.service';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { OrderRefundModal } from '../../components/orders/OrderRefundModal';

interface POSItem {
  name: string;
  qty: number;
  price: number;
}

interface POSBill {
  tableId: string;
  tableNumber: number;
  tableName: string;
  zone: string;
  orderId: string;
  customerName: string;
  customerMobile?: string;
  items: POSItem[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  cgst: number;
  sgst: number;
  total: number;
  status: 'billing' | 'occupied' | 'settled';
  paymentMethod?: string;
  paymentStatus?: string;
  refundAmount?: number;
  refundType?: string;
  refundReason?: string;
  refundedAt?: string | Date;
  refundedBy?: string;
  refundItems?: any[];
  netAmount?: number;
  invoiceNumber?: string;
  paidAt?: string;
  paidDate?: string;
}

const LOCAL_STORAGE_SETTLED_KEY = 'aura_pos_settled_bills_v5';

// Helper to get stored settled tables from localStorage
const getStoredSettledBills = (): Record<number, POSBill> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTLED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};



export const CashierPOSPage: React.FC = () => {
  const { showToast } = useToast();
  const [bills, setBills] = useState<POSBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | number>('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'PENDING' | 'SETTLED_TODAY' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // POS Payment Options & Customer Meta
  const [splitCount, setSplitCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [customerMobileInput, setCustomerMobileInput] = useState<string>('');

  // Customer Loyalty Tracking State
  const [customerLoyalty, setCustomerLoyalty] = useState<{
    phone: string;
    points: number;
    tier: string;
    cashValue: number;
  } | null>(null);
  const [isGrantingReward, setIsGrantingReward] = useState(false);

  // Persistent Settlement Map & Invoice Modal
  const [settledBillsMap, setSettledBillsMap] = useState<Record<number, POSBill>>(() => getStoredSettledBills());
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceBill, setInvoiceBill] = useState<POSBill | null>(null);

  // Search & Shift Audit History Archive Modal
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archivePaymentFilter, setArchivePaymentFilter] = useState<'ALL' | 'UPI' | 'CARD' | 'CASH'>('ALL');

  // Prevent background body scrolling when any modal is open
  useBodyScrollLock(isInvoiceOpen || isArchiveOpen);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsInvoiceOpen(false);
        setIsArchiveOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync settled map to localStorage whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTLED_KEY, JSON.stringify(settledBillsMap));
    } catch (e) {
      console.error('Failed to persist settled bills:', e);
    }
  }, [settledBillsMap]);

  // State for rich refund modal
  const [refundTargetBill, setRefundTargetBill] = useState<POSBill | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Handle Bill Refund Action via rich modal
  const handleOpenRefundModal = (bill: POSBill) => {
    setRefundTargetBill(bill);
    setIsRefundModalOpen(true);
  };

  // Cache for settled orders map across polling ticks
  const [settledCache, setSettledCache] = useState<Map<string, POSBill>>(new Map());

  // Fetch live tables, active orders & DB settled bills (on demand)
  const fetchLivePOSData = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const shouldFetchSettled = isManual || filterTab === 'SETTLED_TODAY' || isArchiveOpen || settledCache.size === 0;

      const [tableData, activeOrders, dbSettledOrders] = await Promise.all([
        tableService.getAllTables().catch(() => []),
        orderService.getActiveOrders().catch(() => []),
        shouldFetchSettled ? orderService.getSettledOrders().catch(() => []) : Promise.resolve(null),
      ]);

      // Group ALL active unpaid orders by tableId to support multi-order sessions
      const activeOrdersByTableMap = new Map<string, any[]>();
      activeOrders.forEach((ord: any) => {
        let numKey = String(ord.tableId || '');
        const matched = numKey.match(/\d+/);
        if (matched) numKey = String(parseInt(matched[0], 10));

        if (!activeOrdersByTableMap.has(numKey)) {
          activeOrdersByTableMap.set(numKey, []);
        }
        activeOrdersByTableMap.get(numKey)!.push(ord);
      });

      // 1. Map for Active Bills (keyed by tableNumber)
      const activeBillsMap = new Map<number, POSBill>();

      tableData.forEach((table: any) => {
        const num = Number(table.tableNumber);
        const tableOrders = activeOrdersByTableMap.get(String(num)) || activeOrdersByTableMap.get(String(table._id)) || [];
        const hasActiveOrders = tableOrders.length > 0;

        if (table.status === 'billing' || (table.status === 'occupied' && hasActiveOrders)) {
          let zone = 'Main Hall';
          if (num > 12 && num <= 16) zone = 'VIP Lounge';
          if (num > 16 && num <= 24) zone = 'Outdoor Garden';
          if (num > 24) zone = 'Family Section';

          const itemsList: POSItem[] = tableOrders.flatMap((ord: any) =>
            ord.items ? ord.items.map((i: any) => ({
              name: i.name,
              qty: i.quantity || i.qty || 1,
              price: i.price || i.unitPrice || (i.totalPrice ? Math.round(i.totalPrice / i.quantity) : 1200),
            })) : []
          );

          const computedSubtotal = itemsList.reduce((sum, it) => sum + (it.qty * it.price), 0);
          const subtotal = computedSubtotal > 0 ? computedSubtotal : 2000;
          const cgst = Math.round(subtotal * 0.025);
          const sgst = Math.round(subtotal * 0.025);
          const total = subtotal + cgst + sgst;
          const latestOrder = tableOrders[tableOrders.length - 1];
          const actualOrderIds = tableOrders
            .map((o: any) => o.orderId || (o._id ? `ORD-${String(o._id).slice(-4).toUpperCase()}` : ''))
            .filter(Boolean);

          const formattedOrderId = actualOrderIds.length > 0 
            ? Array.from(new Set(actualOrderIds)).join(', ')
            : `ORD-${1000 + num}`;

          activeBillsMap.set(num, {
            tableId: table._id || `temp-${num}`,
            tableNumber: num,
            tableName: `Table ${num}`,
            zone,
            orderId: formattedOrderId,
            customerName: latestOrder?.customerName || `Guest Session #${num}`,
            customerMobile: latestOrder?.customerPhone || '',
            items: itemsList.length > 0 ? itemsList : [
              { name: "Siliguri's Chai Addaa Chef Special", qty: 2, price: 240 },
            ],
            subtotal,
            pointsRedeemed: latestOrder?.pointsRedeemed || 0,
            pointsDiscount: latestOrder?.pointsDiscount || 0,
            pointsEarned: latestOrder?.pointsEarned || 0,
            cgst,
            sgst,
            total,
            status: table.status as any,
          });
        }
      });

      // 2. Map for Settled Bills (stored individually by invoiceKey / orderId)
      let settledBillsByInvoiceMap = new Map<string, POSBill>(settledCache);

      if (Array.isArray(dbSettledOrders)) {
        const freshSettledMap = new Map<string, POSBill>();
        dbSettledOrders.forEach((dbOrd: any) => {
          let num = Number(dbOrd.tableNumber || dbOrd.tableId);
          if (isNaN(num) || num <= 0) {
            const matched = String(dbOrd.tableId || '').match(/\d+/);
            num = matched ? parseInt(matched[0], 10) : 0;
          }

          if (num > 0) {
            let zone = 'Main Hall';
            if (num > 12 && num <= 16) zone = 'VIP Lounge';
            if (num > 16 && num <= 24) zone = 'Outdoor Garden';
            if (num > 24) zone = 'Family Section';

            const invoiceKey = String(dbOrd._id || dbOrd.orderId || Math.random());

            const itemsList: POSItem[] = (dbOrd.items && dbOrd.items.length > 0) ? dbOrd.items.map((i: any) => ({
              name: i.name,
              qty: i.quantity || i.qty || 1,
              price: i.price || i.unitPrice || 0,
            })) : [];

            const subtotal = dbOrd.subtotal || itemsList.reduce((sum, it) => sum + (it.qty * it.price), 0);
            const cgst = dbOrd.tax ? Math.round(dbOrd.tax / 2) : Math.round(subtotal * 0.025);
            const sgst = dbOrd.tax ? Math.round(dbOrd.tax / 2) : Math.round(subtotal * 0.025);
            const total = dbOrd.total || (subtotal + cgst + sgst);

            const posBill: POSBill = {
              tableId: `settled-${invoiceKey}`,
              tableNumber: num,
              tableName: `Table ${num}`,
              zone,
              orderId: dbOrd.orderId || `ORD-${String(dbOrd._id).slice(-4).toUpperCase()}`,
              customerName: dbOrd.customerName || `Guest Session #${num}`,
              customerMobile: dbOrd.customerPhone || '',
              items: itemsList,
              subtotal,
              pointsRedeemed: dbOrd.pointsRedeemed || 0,
              pointsDiscount: dbOrd.pointsDiscount || 0,
              pointsEarned: dbOrd.pointsEarned || 0,
              cgst,
              sgst,
              total,
              status: 'settled',
              invoiceNumber: dbOrd.invoiceNumber || `INV-${String(dbOrd._id || dbOrd.orderId).slice(-6).toUpperCase()}`,
              paymentMethod: (dbOrd.paymentMethod || 'UPI').toUpperCase().includes('CARD') ? 'CARD' : (dbOrd.paymentMethod || 'UPI').toUpperCase().includes('CASH') ? 'CASH' : 'UPI',
              paymentStatus: dbOrd.paymentStatus,
              refundAmount: Number(dbOrd.refundAmount || 0),
              refundType: dbOrd.refundType,
              refundReason: dbOrd.refundReason,
              refundedAt: dbOrd.refundedAt,
              refundedBy: dbOrd.refundedBy,
              refundItems: dbOrd.refundItems,
              netAmount: dbOrd.netAmount !== undefined ? dbOrd.netAmount : Math.max(0, total - Number(dbOrd.refundAmount || 0)),
              paidAt: dbOrd.paidAt ? new Date(dbOrd.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              paidDate: dbOrd.paidAt ? new Date(dbOrd.paidAt).toLocaleDateString() : new Date().toLocaleDateString(),
            };

            freshSettledMap.set(invoiceKey, posBill);
          }
        });
        settledBillsByInvoiceMap = freshSettledMap;
        setSettledCache(freshSettledMap);
      }

      // Sync settled bills map by table number for active table lookup
      const mergedSettledMap: Record<number, POSBill> = {};
      settledBillsByInvoiceMap.forEach((bill) => {
        if (!activeBillsMap.has(bill.tableNumber)) {
          mergedSettledMap[bill.tableNumber] = bill;
        }
      });
      setSettledBillsMap(mergedSettledMap);

      // Combine active tables and settled orders into single deduplicated array
      const combinedBillsList: POSBill[] = [];

      // Add active unpaid bills
      activeBillsMap.forEach((activeBill) => {
        combinedBillsList.push(activeBill);
      });

      // Add all individual settled bills
      settledBillsByInvoiceMap.forEach((settledBill) => {
        combinedBillsList.push(settledBill);
      });

      combinedBillsList.sort((a, b) => a.tableNumber - b.tableNumber);
      setBills(combinedBillsList);

      if (isManual) showToast('POS Terminal synchronized with floor state', 'info');
    } catch (error) {
      console.error('Failed to sync POS bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePOSData();
    const interval = setInterval(() => fetchLivePOSData(false), 5000); // Auto refresh active tables every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (filterTab === 'SETTLED_TODAY' || isArchiveOpen) {
      fetchLivePOSData(false);
    }
  }, [filterTab, isArchiveOpen]);

  // Derived Filtered List for Cashier POS Queue
  const filteredBillsList = bills.filter((b) => {
    const isSettled = b.status === 'settled';
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        b.tableName.toLowerCase().includes(q) ||
        String(b.tableNumber) === q ||
        String(b.tableNumber).includes(q) ||
        b.orderId.toLowerCase().includes(q) ||
        (b.customerName && b.customerName.toLowerCase().includes(q)) ||
        (b.customerMobile && b.customerMobile.toLowerCase().includes(q)) ||
        (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
        (b.items && b.items.some((i) => i.name.toLowerCase().includes(q)));
      
      // When searching, find matching bills across both pending & settled records
      return matchesSearch;
    }
    if (filterTab === 'PENDING') return !isSettled;
    if (filterTab === 'SETTLED_TODAY') return isSettled;
    return true;
  });

  // Find bill from ALL master bills so selecting from Search or Archive modal works instantly
  const currentBill = selectedBillId
    ? (bills.find((b) => b.invoiceNumber === selectedBillId || b.orderId === selectedBillId || b.tableId === selectedBillId) ||
       bills.find((b) => String(b.invoiceNumber || '').toLowerCase().includes(String(selectedBillId).toLowerCase()) || String(b.orderId || '').toLowerCase().includes(String(selectedBillId).toLowerCase())) ||
       bills.find((b) => Number(b.tableNumber) === Number(selectedBillId)) ||
       null)
    : null;
  const isCurrentSettled = currentBill ? (currentBill.status === 'settled' || !!settledBillsMap[currentBill.tableNumber]) : false;

  // Strict Subtotal calculation from items list
  const rawSubtotal = currentBill ? currentBill.items.reduce((sum, item) => sum + (item.qty * item.price), 0) : 0;
  const discountAmount = Math.round(rawSubtotal * (discountPercent / 100));
  const pointsDiscount = currentBill?.pointsDiscount || 0;
  const netSubtotal = Math.max(0, rawSubtotal - discountAmount - pointsDiscount);
  const netCgst = Math.round(netSubtotal * 0.025);
  const netSgst = Math.round(netSubtotal * 0.025);
  const finalGrandTotal = netSubtotal + netCgst + netSgst;

  // Synchronize customer loyalty balance when currentBill changes or customerMobileInput changes
  useEffect(() => {
    const rawMobile = customerMobileInput || currentBill?.customerMobile;
    const cleanPhone = String(rawMobile || '').trim();
    if (cleanPhone && cleanPhone.length >= 10) {
      loyaltyService.getLoyaltyBalance(cleanPhone)
        .then((res) => {
          setCustomerLoyalty({
            phone: cleanPhone,
            points: res.loyaltyPoints || 0,
            tier: res.loyaltyTier || 'STANDARD',
            cashValue: res.cashValue || 0,
          });
        })
        .catch(() => setCustomerLoyalty(null));
    } else {
      setCustomerLoyalty(null);
    }
  }, [customerMobileInput, currentBill?.customerMobile]);

  const handleQuickGrantReward = async (pts: number, reason: string) => {
    const phone = customerLoyalty?.phone || customerMobileInput || currentBill?.customerMobile;
    if (!phone) {
      showToast('Please enter customer mobile number first', 'error');
      return;
    }
    setIsGrantingReward(true);
    try {
      const res = await loyaltyService.adjustPoints({
        phone,
        points: pts,
        reason,
        adjustedBy: 'Cashier POS'
      });
      if (res?.success) {
        showToast(`🎉 Granted +${pts} PTS to ${phone}!`, 'success');
        setCustomerLoyalty(prev => prev ? {
          ...prev,
          points: res.data.loyaltyPoints,
          tier: res.data.loyaltyTier,
          cashValue: (res.data.loyaltyPoints || 0) * 0.5
        } : null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to adjust points', 'error');
    } finally {
      setIsGrantingReward(false);
    }
  };

  const perPersonTotal = Math.round(finalGrandTotal / Math.max(1, splitCount));
  const tenderedVal = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedVal - finalGrandTotal);
  const remainingCashBalance = Math.max(0, finalGrandTotal - tenderedVal);

  // Settlement Handler — executes backend pay-table and records settled invoice
  const handleSettlePayment = async () => {
    if (!currentBill || isCurrentSettled) return;

    try {
      setIsLoading(true);
      const res = await orderService.settleTableBill(currentBill.tableNumber, paymentMethod).catch(() => null);
      const invNum = res?.data?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = new Date().toLocaleDateString();

      const updatedBill: POSBill = {
        ...currentBill,
        subtotal: netSubtotal,
        discountPercent,
        discountAmount,
        cgst: netCgst,
        sgst: netSgst,
        total: finalGrandTotal,
        status: 'settled',
        paymentMethod,
        invoiceNumber: invNum,
        paidAt: timestamp,
        paidDate: dateString,
      };

      setSettledCache((prev) => {
        const next = new Map(prev);
        next.set(invNum, updatedBill);
        return next;
      });

      showToast(`Bill ₹${finalGrandTotal.toLocaleString('en-IN')} for Table ${currentBill.tableNumber} SETTLED via ${paymentMethod}!`, 'success');
      setInvoiceBill(updatedBill);
      setIsInvoiceOpen(true);
      fetchLivePOSData(false);
    } catch (error) {
      showToast('Failed to settle bill', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
    showToast('Printing Tax Invoice Receipt...', 'info');
  };

  const pendingCount = bills.filter((b) => b.status !== 'settled' && !settledBillsMap[b.tableNumber]).length;
  const settledCount = Array.from(settledCache.keys()).length;

  // Shift Sales Audit Totals (Use all individual settled invoices)
  const settledBillsList = Array.from(settledCache.values());
  const shiftTotalRevenue = settledBillsList.reduce((sum, b) => sum + (b.total || 0), 0);
  const shiftUpiTotal = settledBillsList.filter((b) => b.paymentMethod === 'UPI').reduce((sum, b) => sum + (b.total || 0), 0);
  const shiftCardTotal = settledBillsList.filter((b) => b.paymentMethod === 'CARD').reduce((sum, b) => sum + (b.total || 0), 0);
  const shiftCashTotal = settledBillsList.filter((b) => b.paymentMethod === 'CASH').reduce((sum, b) => sum + (b.total || 0), 0);

  // Filtered Archive List for Search Modal
  const archiveFilteredBills = settledBillsList.filter((b) => {
    if (archivePaymentFilter !== 'ALL' && b.paymentMethod !== archivePaymentFilter) return false;
    
    const query = archiveSearchQuery.trim().toLowerCase();
    if (!query) return true;

    const matchesTableNumber = String(b.tableNumber) === query || String(b.tableNumber).includes(query);
    const matchesTableName = b.tableName.toLowerCase().includes(query);
    const matchesOrderId = b.orderId.toLowerCase().includes(query);
    const matchesInvoice = b.invoiceNumber ? b.invoiceNumber.toLowerCase().includes(query) : false;
    const matchesMobile = b.customerMobile ? b.customerMobile.toLowerCase().includes(query) : false;
    const matchesName = b.customerName ? b.customerName.toLowerCase().includes(query) : false;
    const matchesDish = b.items ? b.items.some((i) => i.name.toLowerCase().includes(query)) : false;
    const matchesAmount =
      String(b.total || '').includes(query) ||
      String(Math.round(b.total || 0)).includes(query) ||
      String(b.subtotal || '').includes(query);

    return (
      matchesTableNumber ||
      matchesTableName ||
      matchesOrderId ||
      matchesInvoice ||
      matchesMobile ||
      matchesName ||
      matchesDish ||
      matchesAmount
    );
  });

  return (
    // Fixed Responsive Two-Column Height Layout
    <div className="page-theme-cashier flex flex-col md:flex-row h-full min-h-0 w-full font-sans text-theme-text bg-theme-bg overflow-y-auto md:overflow-hidden">

      {/* ─────────────────────────────────────────────────────────────────
          LEFT PANEL — Pending & Settled Table Bills Queue Sidebar
      ───────────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-80 flex-shrink-0 h-auto md:h-full flex flex-col bg-theme-surface border-b md:border-b-0 md:border-r border-theme-border">

        {/* POS Station Header */}
        <div className="p-5 border-b border-theme-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-theme-primary-light border border-theme-primary/30 rounded-xl">
                <Receipt className="w-6 h-6 text-theme-primary" />
              </div>
              <div>
                <h1 className="font-serif text-base font-black text-white leading-tight">CASHIER POS</h1>
                <p className="text-[10px] text-theme-primary font-mono uppercase font-bold mt-0.5">Billing &amp; Tax Settlement</p>
              </div>
            </div>

            <button
              onClick={() => fetchLivePOSData(true)}
              className="p-2 bg-[#07090E] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
              title="Sync POS Floor Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search table #, order ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#07090E] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono placeholder:text-slate-600"
            />
          </div>

          {/* Queue Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#07090E] rounded-xl border border-slate-800 text-[10px] font-bold text-center">
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'PENDING' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('SETTLED_TODAY')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'SETTLED_TODAY' ? 'bg-emerald-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Settled ({settledCount})
            </button>
            <button
              onClick={() => setFilterTab('ALL')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'ALL' ? 'bg-slate-800 text-white font-black border border-slate-700 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              All ({bills.length})
            </button>
          </div>
        </div>

        {/* Scrollable Bills Queue */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBillsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3 bg-[#07090E] border border-slate-800/80 rounded-2xl p-4">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-400/80 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-white">
                  {filterTab === 'PENDING' ? 'All Pending Bills Settled!' : 'No Bills Found'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {filterTab === 'PENDING' ? 'No active tables awaiting checkout.' : 'Try changing search or tab filters.'}
                </p>
              </div>
              {filterTab === 'PENDING' && settledCount > 0 && (
                <button
                  onClick={() => setFilterTab('SETTLED_TODAY')}
                  className="px-3 py-1.5 bg-slate-900 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-xl hover:bg-emerald-500/10 transition-all cursor-pointer"
                >
                  View Settled Bills ({settledCount})
                </button>
              )}
            </div>
          ) : (
            filteredBillsList.map((bill) => {
              const isSelected = selectedBillId === bill.tableNumber || selectedBillId === bill.orderId;
              const isSettled = bill.status === 'settled' || !!settledBillsMap[bill.tableNumber];

              return (
                <div
                  key={bill.tableNumber}
                  onClick={() => setSelectedBillId(bill.tableNumber)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-lg ring-1 ring-purple-500/40'
                      : isSettled
                      ? 'bg-[#07090E]/60 border-slate-800/80 hover:border-slate-700 opacity-80'
                      : 'bg-[#07090E] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-serif font-black text-white text-sm">
                        Table {bill.tableNumber}
                      </h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        {bill.zone}
                      </span>
                    </div>

                    {isSettled ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>PAID</span>
                      </span>
                    ) : (
                      <span className="font-mono text-amber-400 font-black text-sm">
                        ₹{bill.total.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/70">
                    <span>{bill.orderId}</span>
                    <span className={isSettled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {isSettled ? `Settled ${bill.paidAt || 'Today'}` : `${bill.items.length} Recipe Dish(es)`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Audit Archive Trigger */}
        <div className="p-4 border-t border-slate-800/80 bg-[#07090E]/80 space-y-3 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Shift Total Revenue:</span>
              <span className="text-emerald-400 font-black text-xs">₹{shiftTotalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>UPI: ₹{shiftUpiTotal.toLocaleString('en-IN')}</span>
              <span>Card: ₹{shiftCardTotal.toLocaleString('en-IN')}</span>
              <span>Cash: ₹{shiftCashTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => setIsArchiveOpen(true)}
            className="w-full py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Invoices Archive ({settledCount})</span>
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────
          RIGHT PANEL — Active Bill Itemization & Settlement Terminal
      ───────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">

        {currentBill ? (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Bill Header Card */}
            <div className="bg-[#0A0D15] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
              <button
                onClick={() => setSelectedBillId('')}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close / Clear Selection"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-purple-400 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    {currentBill.orderId}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{currentBill.zone}</span>
                </div>
                <h2 className="font-serif text-2xl font-black text-white mt-1">
                  Table {currentBill.tableNumber} Itemized Receipt
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentBill.customerName} {currentBill.customerMobile && currentBill.customerMobile !== 'N/A' ? `• Ph: ${currentBill.customerMobile}` : ''}
                </p>
              </div>

              {isCurrentSettled ? (
                <div className="flex items-center space-x-3">
                  <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>SETTLED &amp; PAID ({currentBill.paymentMethod || 'UPI'})</span>
                  </div>
                  <button
                    onClick={() => {
                      setInvoiceBill(currentBill);
                      setIsInvoiceOpen(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg border border-purple-400/40"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Tax Invoice</span>
                  </button>
                </div>
              ) : (
                <span className="px-4 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs rounded-xl flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4" />
                  <span>AWAITING PAYMENT</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Itemized Order Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#0A0D15] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="font-serif text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                    <Receipt className="w-4 h-4 text-purple-400" />
                    <span>Ordered Dishes Breakdown</span>
                  </h3>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 text-[10px] font-mono font-bold uppercase text-slate-400 pb-2 border-b border-slate-800/70 px-2">
                      <span className="col-span-6">Dish Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Rate</span>
                      <span className="col-span-2 text-right">Amount</span>
                    </div>

                    {currentBill.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-xs py-3 border-b border-slate-800/50 text-slate-200 items-center px-2 hover:bg-[#07090E] rounded-xl transition-colors">
                        <span className="col-span-6 font-bold leading-snug">{item.name}</span>
                        <span className="col-span-2 text-center font-mono text-slate-400 bg-[#07090E] py-1 rounded-lg border border-slate-800">
                          {item.qty}x
                        </span>
                        <span className="col-span-2 text-right font-mono text-slate-400">₹{item.price.toLocaleString('en-IN')}</span>
                        <span className="col-span-2 text-right font-mono text-amber-400 font-bold">
                          ₹{(item.qty * item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Phone Number for Receipt & SMS */}
                  {!isCurrentSettled && (
                    <div className="p-4 bg-[#07090E] border border-slate-800 rounded-xl space-y-2 mt-4">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-400" />
                        <span>Customer Mobile (For Tax Invoice / SMS):</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerMobileInput}
                        onChange={(e) => setCustomerMobileInput(e.target.value)}
                        className="w-full p-2.5 bg-[#0A0D15] border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-purple-500 outline-none placeholder:text-slate-600"
                      />

                      {/* Customer Loyalty Profile Card & Quick Reward */}
                      {customerLoyalty && (
                        <div className="p-3 bg-gradient-to-r from-amber-950/40 via-[#0A0D15] to-emerald-950/30 border border-amber-500/30 rounded-xl space-y-2 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5">
                              <Award className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-white uppercase text-[11px] tracking-wider">Siliguri Chai Adda Member</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                              {customerLoyalty.tier}
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-slate-400">Available Wallet Balance:</span>
                            <span className="font-bold text-amber-400">
                              {customerLoyalty.points} PTS (≈ ₹{customerLoyalty.cashValue.toFixed(0)})
                            </span>
                          </div>

                          {/* Cashier Quick Reward Action */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">Goodwill Bonus:</span>
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickGrantReward(50, 'Cashier Dining Courtesy Bonus (+50 PTS)')}
                                disabled={isGrantingReward}
                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95"
                              >
                                +50 PTS
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickGrantReward(100, 'VIP Dining Goodwill Bonus (+100 PTS)')}
                                disabled={isGrantingReward}
                                className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95"
                              >
                                +100 PTS
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Split Bill N-Ways Calculator */}
                  {!isCurrentSettled && (
                    <div className="p-4 bg-[#07090E] border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <Split className="w-4 h-4 text-purple-400" />
                          <span>Split Bill Equal N-Ways</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                            className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold hover:border-slate-700 transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-sm font-bold px-3 text-purple-400">{splitCount} Guests</span>
                          <button
                            onClick={() => setSplitCount(splitCount + 1)}
                            className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold hover:border-slate-700 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {splitCount > 1 && (
                        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center text-xs font-bold text-purple-300 font-mono flex items-center justify-between">
                          <span>Share Per Guest ({splitCount}-Way Split):</span>
                          <span className="text-sm font-black">₹{perPersonTotal.toLocaleString('en-IN')} / person</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dedicated VIP Account / Member Action & Executive Discounts */}
                  {!isCurrentSettled && (
                    <div className="p-4 bg-[#07090E] border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                          Membership & Discounts:
                        </span>
                        {discountPercent === 15 && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                            <span>👑 VIP 15% Active</span>
                          </span>
                        )}
                      </div>

                      {/* Prominent Dedicated VIP Account Button */}
                      <button
                        onClick={() => {
                          if (discountPercent === 15) {
                            setDiscountPercent(0);
                            showToast('VIP Discount Removed', 'info');
                          } else {
                            setDiscountPercent(15);
                            showToast('👑 VIP Account: 15% Privilege Discount Applied!', 'success');
                          }
                        }}
                        className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border active:scale-95 ${
                          discountPercent === 15
                            ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-lg font-black'
                            : 'bg-slate-900/90 text-amber-400 border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-base">👑</span>
                          <div className="text-left">
                            <p className="font-black text-xs leading-none">VIP Account / Member</p>
                            <p className={`text-[10px] font-medium ${discountPercent === 15 ? 'text-slate-900' : 'text-slate-400'}`}>
                              Automatic 15% VIP Privileged Discount
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg bg-black/20">
                          {discountPercent === 15 ? 'APPLIED' : 'TAP TO APPLY'}
                        </span>
                      </button>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">
                          Or standard discounts:
                        </span>
                        <div className="flex space-x-2">
                          {[0, 5, 10, 20].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => setDiscountPercent(pct)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                                discountPercent === pct
                                  ? 'bg-purple-600 text-white border-purple-400 shadow-md font-black'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              {pct === 0 ? 'None' : `${pct}% OFF`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Payment Processing Panel */}
              <div className="space-y-6">
                <div className="bg-[#0A0D15] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                  <h3 className="font-serif text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Payment Terminal</span>
                  </h3>

                  {!isCurrentSettled ? (
                    <>
                      {/* Payment Method Tabs */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                          Select Collection Mode:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setPaymentMethod('UPI')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1.5 ${
                              paymentMethod === 'UPI'
                                ? 'bg-emerald-600 text-white border-emerald-400 font-black shadow-lg'
                                : 'bg-[#07090E] text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <QrCode className="w-5 h-5" />
                            <span>UPI QR</span>
                          </button>

                          <button
                            onClick={() => setPaymentMethod('CARD')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1.5 ${
                              paymentMethod === 'CARD'
                                ? 'bg-indigo-600 text-white border-indigo-400 font-black shadow-lg'
                                : 'bg-[#07090E] text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <CreditCard className="w-5 h-5" />
                            <span>Card POS</span>
                          </button>

                          <button
                            onClick={() => setPaymentMethod('CASH')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center space-y-1.5 ${
                              paymentMethod === 'CASH'
                                ? 'bg-amber-600 text-white border-amber-400 font-black shadow-lg'
                                : 'bg-[#07090E] text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <DollarSign className="w-5 h-5" />
                            <span>Cash</span>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Mode Helper View */}
                      {paymentMethod === 'UPI' && (
                        <div className="p-4 bg-white rounded-2xl text-center space-y-2 text-slate-900 border border-gray-200 shadow-inner">
                          <span className="text-[10px] font-mono font-bold text-gray-700 uppercase block tracking-wider">
                            Scan to Pay ₹{finalGrandTotal.toLocaleString('en-IN')}
                          </span>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=aura.restaurant@upi%26pn=Siliguri%20Chai%20Addaa%26am=${finalGrandTotal}%26cu=INR`}
                            alt="UPI QR Code"
                            className="w-32 h-32 mx-auto rounded-xl shadow-md border border-gray-200"
                          />
                          <p className="text-[10px] text-gray-600 font-mono">GPay, PhonePe, Paytm, BHIM Accepted</p>
                        </div>
                      )}

                      {paymentMethod === 'CASH' && (
                        <div className="p-4 bg-[#07090E] border border-slate-800 rounded-xl space-y-3 text-xs font-mono">
                          <span className="text-[10px] text-slate-400 uppercase block font-bold">Cash Calculator</span>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400">Tendered Cash Amount (₹):</label>
                            <input
                              type="number"
                              placeholder={`e.g. ${finalGrandTotal}`}
                              value={cashTendered}
                              onChange={(e) => setCashTendered(e.target.value)}
                              className="w-full p-2.5 bg-[#0A0D15] border border-slate-800 rounded-xl text-amber-400 font-mono text-sm font-bold outline-none focus:border-amber-500"
                            />
                          </div>
                          {tenderedVal > 0 && (
                            <div className="pt-1 border-t border-slate-800 font-bold">
                              {tenderedVal >= finalGrandTotal ? (
                                <div className="flex justify-between text-xs text-emerald-400">
                                  <span>Return Change Due:</span>
                                  <span>₹{changeDue.toLocaleString('en-IN')}</span>
                                </div>
                              ) : (
                                <div className="flex justify-between text-xs text-rose-400">
                                  <span>Remaining Cash Balance:</span>
                                  <span>₹{remainingCashBalance.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Summary Totals */}
                      <div className="border-t border-slate-800/80 pt-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal</span>
                          <span>₹{rawSubtotal.toLocaleString('en-IN')}</span>
                        </div>

                        {discountPercent > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Discount ({discountPercent}%)</span>
                            <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        {pointsDiscount > 0 && (
                          <div className="flex justify-between text-[#0C831F]">
                            <span>Chai Adda Points Discount ({currentBill.pointsRedeemed || 0} PTS)</span>
                            <span>- ₹{pointsDiscount.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-400">
                          <span>CGST (2.5%)</span>
                          <span>₹{netCgst.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>SGST (2.5%)</span>
                          <span>₹{netSgst.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-slate-800">
                          <span>Net Total Payable</span>
                          <span className="font-mono text-amber-400 text-lg font-black">
                            ₹{finalGrandTotal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-[11px] text-amber-300">
                          <span className="flex items-center gap-1 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Loyalty Points to Credit:</span>
                          </span>
                          <span className="font-mono font-black text-amber-400">
                            +{Math.floor(finalGrandTotal / 10)} PTS
                          </span>
                        </div>
                      </div>

                      {/* Settlement Action Button */}
                      <button
                        onClick={handleSettlePayment}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 cursor-pointer border border-emerald-400/40"
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span>Settle ₹{finalGrandTotal.toLocaleString('en-IN')} via {paymentMethod}</span>
                      </button>
                    </>
                  ) : (
                    /* SETTLED CARD STATE */
                    <div className="space-y-4 text-center py-2">
                      <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl animate-pulse">
                        <CheckCircle className="w-8 h-8" />
                      </div>

                      <div>
                        <h4 className="font-serif font-black text-lg text-emerald-400">BILL PAID &amp; CLOSED</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Invoice #{currentBill.invoiceNumber || 'INV-SETTLED'}</p>
                        <p className="text-[11px] text-emerald-300 font-mono font-bold mt-1">
                          Amount: ₹{(currentBill.total || finalGrandTotal).toLocaleString('en-IN')} via {currentBill.paymentMethod || 'UPI'}
                        </p>
                      </div>

                      <div className="pt-2 space-y-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            setInvoiceBill(currentBill);
                            setIsInvoiceOpen(true);
                          }}
                          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg border border-purple-400/40"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print GST Tax Invoice</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-6 bg-aura-container/40 rounded-3xl border border-aura-border/60 shadow-2xl my-auto">
            <div className="w-16 h-16 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-3xl flex items-center justify-center mx-auto text-[#38BDF8] shadow-lg">
              <Receipt className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-white">Select a Table Bill to Checkout</h2>
              <p className="text-xs text-aura-slate max-w-md mx-auto leading-relaxed">
                Choose an active table from the floor queue on the left to review itemized dishes, apply executive discounts, or process payment settlement.
              </p>
            </div>

            {/* Shift Overview KPI Summary */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 text-xs font-mono">
              <div className="p-3 bg-aura-obsidian/80 border border-aura-border/60 rounded-2xl text-center">
                <span className="text-[10px] text-aura-slate block uppercase">Pending Bills</span>
                <span className="text-amber-400 font-black text-sm">{pendingCount}</span>
              </div>

              <div className="p-3 bg-aura-obsidian/80 border border-aura-border/60 rounded-2xl text-center">
                <span className="text-[10px] text-aura-slate block uppercase">Settled Today</span>
                <span className="text-emerald-400 font-black text-sm">{settledCount}</span>
              </div>

              <div className="p-3 bg-aura-obsidian/80 border border-aura-border/60 rounded-2xl text-center">
                <span className="text-[10px] text-aura-slate block uppercase">Shift Revenue</span>
                <span className="text-[#38BDF8] font-black text-sm">₹{shiftTotalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {pendingCount > 0 && (
              <p className="text-[10px] text-[#38BDF8] font-mono animate-bounce pt-2">
                👈 {pendingCount} active table(s) awaiting checkout on floor queue
              </p>
            )}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────
          SEARCH & AUDIT INVOICES ARCHIVE MODAL
      ───────────────────────────────────────────────────────────────── */}
      {isArchiveOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsArchiveOpen(false); }}
        >
          <div className="bg-aura-container border border-aura-border/80 rounded-3xl max-w-3xl w-full shadow-2xl p-6 space-y-5 relative max-h-[85vh] flex flex-col font-sans">
            <button
              onClick={() => setIsArchiveOpen(false)}
              className="absolute top-5 right-5 text-aura-slate hover:text-aura-ivory p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#38BDF8]" />
                <h2 className="font-serif font-black text-xl text-white">Invoices &amp; Settlements Archive</h2>
              </div>
              <p className="text-xs text-aura-slate mt-0.5">Lookup completed payment records by table #, mobile number, or invoice code.</p>
            </div>

            {/* Shift Financial Overview Cards */}
            <div className="grid grid-cols-4 gap-3 bg-aura-obsidian/70 p-3 rounded-2xl border border-aura-border/50 text-xs font-mono">
              <div className="p-2 bg-aura-container rounded-xl border border-aura-border">
                <span className="text-[10px] text-aura-slate block">Total Revenue</span>
                <span className="text-emerald-400 font-bold text-sm">₹{shiftTotalRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 bg-aura-container rounded-xl border border-aura-border">
                <span className="text-[10px] text-aura-slate block">UPI QR</span>
                <span className="text-amber-400 font-bold">₹{shiftUpiTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 bg-aura-container rounded-xl border border-aura-border">
                <span className="text-[10px] text-aura-slate block">Card POS</span>
                <span className="text-blue-400 font-bold">₹{shiftCardTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 bg-aura-container rounded-xl border border-aura-border">
                <span className="text-[10px] text-aura-slate block">Cash</span>
                <span className="text-purple-400 font-bold">₹{shiftCashTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Search Input & Payment Mode Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-aura-slate" />
                <input
                  type="text"
                  placeholder="Search by invoice #, table #, mobile number, order ID..."
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-aura-obsidian border border-aura-border rounded-xl text-xs text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
                />
              </div>

              <div className="flex space-x-1 bg-aura-obsidian p-1 rounded-xl border border-aura-border text-[10px] font-bold">
                {(['ALL', 'UPI', 'CARD', 'CASH'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setArchivePaymentFilter(mode)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      archivePaymentFilter === mode
                        ? 'bg-[#0EA5E9] text-[#090A0F] font-black shadow-md'
                        : 'text-aura-slate hover:text-aura-ivory'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Settled Invoices Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {archiveFilteredBills.length === 0 ? (
                <div className="py-12 text-center text-aura-slate space-y-2 bg-aura-obsidian/40 border border-aura-border/40 rounded-2xl">
                  <Search className="w-8 h-8 mx-auto text-aura-slate/50" />
                  <p className="text-xs font-bold text-aura-ivory">No Matching Invoices Found</p>
                  <p className="text-[10px]">Try entering a table number (e.g. 10), phone number, or invoice code.</p>
                </div>
              ) : (
                archiveFilteredBills.map((inv, index) => {
                  const uniqueArchiveKey = inv.tableId
                    ? `arch-${inv.tableId}-${index}`
                    : inv.invoiceNumber
                    ? `arch-inv-${inv.invoiceNumber}-${inv.orderId}-${index}`
                    : `arch-item-${index}`;

                  return (
                    <div
                      key={uniqueArchiveKey}
                      className="p-3.5 bg-aura-obsidian/80 border border-aura-border/60 hover:border-[#38BDF8]/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all font-mono text-xs"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-aura-ivory text-sm whitespace-nowrap">{inv.tableName.split(' (')[0]}</span>
                          {inv.orderId && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono whitespace-nowrap shrink-0">
                              {inv.orderId}
                            </span>
                          )}
                          <span className="font-mono text-xs font-bold text-white tracking-wide">
                            {inv.invoiceNumber || 'INV-PAID'}
                          </span>
                          <span className="text-[10px] text-aura-slate whitespace-nowrap">({inv.paymentMethod || 'UPI'})</span>
                          {inv.paymentStatus === 'REFUNDED' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-950/80 border border-rose-500/40 text-rose-400">
                              100% REFUNDED
                            </span>
                          )}
                          {(inv.paymentStatus === 'PARTIALLY_REFUNDED' || (inv.refundAmount && inv.refundAmount > 0)) && inv.paymentStatus !== 'REFUNDED' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                              PARTIAL REFUND (-₹{inv.refundAmount})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-[10px] text-aura-slate whitespace-nowrap">
                          <span>Paid: {inv.paidAt || 'Today'}</span>
                          {inv.customerMobile && <span>Ph: {inv.customerMobile}</span>}
                          <span>{inv.items.length} Recipe Item(s)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end space-x-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-aura-border/40">
                        <div className="text-right">
                          <span className={`font-black text-sm whitespace-nowrap block ${
                            inv.paymentStatus === 'REFUNDED'
                              ? 'text-rose-400 line-through'
                              : 'text-emerald-400'
                          }`}>
                            ₹{(inv.total || inv.subtotal).toLocaleString('en-IN')}
                          </span>
                          {inv.refundAmount !== undefined && inv.refundAmount > 0 && inv.paymentStatus !== 'REFUNDED' && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Net: <strong className="text-emerald-300">₹{(inv.netAmount || (inv.total - inv.refundAmount)).toLocaleString('en-IN')}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedBillId(inv.invoiceNumber || inv.orderId || inv.tableNumber);
                              setInvoiceBill(inv);
                              setIsInvoiceOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center space-x-1 shadow-md whitespace-nowrap shrink-0 border border-[#7DD3FC]/50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>

                          {inv.paymentStatus === 'REFUNDED' ? (
                            <span className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-500 font-bold text-[10px] uppercase rounded-xl cursor-not-allowed">
                              Voided
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenRefundModal(inv)}
                              className={`px-3 py-1.5 border font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center space-x-1 whitespace-nowrap shrink-0 ${
                                inv.refundAmount && inv.refundAmount > 0
                                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{inv.refundAmount && inv.refundAmount > 0 ? 'Refund More' : 'Refund'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          PRINTABLE GST TAX INVOICE MODAL
      ───────────────────────────────────────────────────────────────── */}
      {isInvoiceOpen && invoiceBill && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsInvoiceOpen(false); }}
        >
          <div className="printable-invoice bg-white text-gray-900 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5 relative font-mono text-xs">
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="no-print absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Restaurant Brand Header */}
            <div className="text-center space-y-1 border-b border-gray-200 pb-4">
              <div className="flex justify-center items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif font-black text-xl text-gray-900 tracking-wider">SILIGURI'S CHAI ADDAA</h2>
              </div>
              <p className="text-[10px] text-gray-500 font-sans">Artisan Tea House &amp; Comfort Dining</p>
              <p className="text-[9px] text-gray-400">Sevoke Road, Siliguri • FSSAI: 11521001000456</p>
            </div>

            {/* Invoice Meta */}
            <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px]">
              {invoiceBill.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-bold text-amber-700 font-mono">{invoiceBill.orderId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Invoice #:</span>
                <span className="font-bold">{invoiceBill.invoiceNumber || invoiceBill.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Table Session:</span>
                <span className="font-bold">{invoiceBill.tableName}</span>
              </div>
              {invoiceBill.customerMobile && invoiceBill.customerMobile !== 'N/A' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer Mobile:</span>
                  <span className="font-bold">{invoiceBill.customerMobile}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Date &amp; Time:</span>
                <span>{invoiceBill.paidAt ? `${new Date().toLocaleDateString()} at ${invoiceBill.paidAt}` : new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode:</span>
                <span className="font-bold text-emerald-700 uppercase">{invoiceBill.paymentMethod || paymentMethod} (SETTLED)</span>
              </div>
              {invoiceBill.discountPercent === 15 && (
                <div className="flex justify-between items-center bg-amber-100/90 text-amber-900 px-2.5 py-1 rounded-lg font-bold text-[10px] border border-amber-300">
                  <span className="flex items-center gap-1">
                    <span>👑</span>
                    <span>VIP PRIVILEGED MEMBER</span>
                  </span>
                  <span className="font-mono">15% SAVINGS</span>
                </div>
              )}
            </div>

            {/* Itemized Receipt Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-300 pb-1">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>

              {invoiceBill.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 text-xs py-1 border-b border-gray-100">
                  <span className="col-span-6 font-medium text-gray-800">{it.name}</span>
                  <span className="col-span-2 text-center text-gray-500">{it.qty}</span>
                  <span className="col-span-4 text-right font-bold text-gray-900">
                    ₹{(it.qty * it.price).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Tax Breakdown & Grand Total */}
            <div className="space-y-1 pt-2 border-t border-gray-300 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{invoiceBill.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {invoiceBill.discountAmount !== undefined && invoiceBill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{invoiceBill.discountPercent === 15 ? '👑 VIP Member Discount (15%)' : `Executive Discount (${invoiceBill.discountPercent}%)`}</span>
                  <span>- ₹{invoiceBill.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {invoiceBill.pointsDiscount !== undefined && invoiceBill.pointsDiscount > 0 && (
                <div className="flex justify-between text-[#0C831F] font-bold">
                  <span>Chai Adda Points Discount ({invoiceBill.pointsRedeemed || 0} PTS)</span>
                  <span>- ₹{invoiceBill.pointsDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>CGST (2.5%)</span>
                <span>₹{invoiceBill.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (2.5%)</span>
                <span>₹{invoiceBill.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                <span>GRAND TOTAL</span>
                <span className={invoiceBill.paymentStatus === 'REFUNDED' ? 'line-through text-gray-400' : ''}>
                  ₹{invoiceBill.total.toLocaleString('en-IN')}
                </span>
              </div>
              {invoiceBill.paymentStatus !== 'REFUNDED' && (
                <div className="flex justify-between text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                  <span>Chai Adda Club Points Credited:</span>
                  <span className="font-mono font-black">+{invoiceBill.pointsEarned || Math.floor(invoiceBill.total / 10)} PTS</span>
                </div>
              )}

              {/* Refund Audit Section if applicable */}
              {invoiceBill.refundAmount !== undefined && invoiceBill.refundAmount > 0 && (
                <div className="pt-2 border-t border-dashed border-gray-300 space-y-1.5">
                  <div className="flex justify-between text-xs text-rose-600 font-bold">
                    <span>
                      {invoiceBill.paymentStatus === 'REFUNDED' ? '100% Full Refund Void:' : 'Partial Refund Deduction:'}
                    </span>
                    <span>- ₹{invoiceBill.refundAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {invoiceBill.refundReason && (
                    <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                      Audit Reason: <strong>{invoiceBill.refundReason}</strong>
                    </p>
                  )}
                  {invoiceBill.paymentStatus !== 'REFUNDED' && (
                    <div className="flex justify-between text-xs font-black text-emerald-800 pt-1 border-t border-gray-200">
                      <span>NET AMOUNT SETTLED:</span>
                      <span>₹{(invoiceBill.netAmount !== undefined ? invoiceBill.netAmount : Math.max(0, invoiceBill.total - invoiceBill.refundAmount)).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stamp & Footer */}
            <div className="pt-2 text-center space-y-3">
              {invoiceBill.paymentStatus === 'REFUNDED' ? (
                <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-[10px] uppercase border border-rose-300 tracking-wider">
                  INVOICE VOIDED &amp; FULLY REFUNDED
                </div>
              ) : invoiceBill.refundAmount && invoiceBill.refundAmount > 0 ? (
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[10px] uppercase border border-amber-300 tracking-wider">
                  PARTIALLY REFUNDED &amp; NET SETTLED
                </div>
              ) : (
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] uppercase border border-emerald-300 tracking-wider">
                  PAID IN FULL: THANK YOU FOR DINING WITH US
                </div>
              )}

              <div className="no-print flex space-x-2 pt-2">
                <button
                  onClick={handlePrintInvoice}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setIsInvoiceOpen(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Refund Modal (Single Dish / Custom Amount / Full Bill) */}
      <OrderRefundModal
        isOpen={isRefundModalOpen}
        order={refundTargetBill}
        refundedBy="Cashier POS Staff"
        onClose={() => {
          setIsRefundModalOpen(false);
          setRefundTargetBill(null);
        }}
        onSuccess={() => {
          fetchLivePOSData(true);
        }}
      />
    </div>
  );
};
