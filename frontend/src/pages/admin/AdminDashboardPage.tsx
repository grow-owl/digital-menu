import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../components/ui/data-display/StatusBadge';
import { StatCard } from '../../components/ui/cards/StatCard';
import { DataToolbar } from '../../components/ui/data-display/DataToolbar';
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
  Calendar, Users, Play, Pause, AlertTriangle, Sparkles, Clock, Heart, Award, Utensils, Receipt, CheckCircle2,
  Plus, Edit, Trash2, Flame, Search, Filter, X, Check, Eye, EyeOff, CreditCard, Printer, RotateCcw, QrCode,
  Download, ArrowUpRight, BarChart3, Bell, Activity, PieChart
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MENU_CATALOG' | 'CATEGORIES' | 'AUDIT_LOGS'>('OVERVIEW');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Catalog Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [allTables, setAllTables] = useState<any[]>([]);

  const fetchAllTables = async () => {
    try {
      const data = await tableService.getAllTables();
      setAllTables(data);
    } catch (err) {
      console.error('Failed to load tables in Admin:', err);
    }
  };

  useEffect(() => {
    fetchAllTables();
  }, []);
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('Utensils');
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState<number>(1);

  // Load Admin Metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await adminService.getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch admin metrics', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load Categories & Menu Items
  const loadCatalogData = async () => {
    setIsLoadingCatalog(true);
    try {
      const [cats, items] = await Promise.all([
        menuService.getCategories().catch(() => []),
        menuService.getMenuItems().catch(() => [])
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err) {
      console.error('Failed to load menu catalog data:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, [activeTab]);

  // Open Modal to Add/Edit Dish
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

  // Save / Create / Update Dish
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
        showToast(`Added new dish "${dishName}" (₹${dishPrice}) to catalog!`, 'success');
      }
      setIsDishModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save dish', 'error');
    }
  };

  // Toggle Availability (In-Stock / Out-of-Stock)
  const handleToggleAvailability = async (item: MenuItem) => {
    const nextStatus = !item.isAvailable;
    const targetId = item.id || (item as any)._id;
    try {
      await menuService.updateMenuItem(targetId, { isAvailable: nextStatus });
      setMenuItems((prev) =>
        prev.map((it) => ((it.id === item.id || (it as any)._id === targetId) ? { ...it, isAvailable: nextStatus } : it))
      );
      showToast(
        `"${item.name}" marked ${nextStatus ? 'IN STOCK' : 'OUT OF STOCK'}`,
        nextStatus ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update availability', 'error');
    }
  };

  // Delete Dish
  const handleDeleteDish = async (dish: MenuItem) => {
    if (!window.confirm(`Are you sure you want to delete "${dish.name}" from the menu catalog?`)) return;
    try {
      await menuService.deleteMenuItem(dish.id);
      showToast(`Deleted "${dish.name}" from catalog`, 'info');
      loadCatalogData();
    } catch (err) {
      showToast('Failed to delete dish', 'error');
    }
  };

  // Open Category Modal
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategoryIcon(cat.iconName || 'Utensils');
      setCategoryDisplayOrder(cat.displayOrder || 1);
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategoryIcon('Utensils');
      setCategoryDisplayOrder(categories.length + 1);
    }
    setIsCategoryModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast('Please enter category name', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await menuService.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          iconName: categoryIcon,
          displayOrder: Number(categoryDisplayOrder)
        });
        showToast(`Category "${categoryName}" updated!`, 'success');
      } else {
        await menuService.createCategory({
          name: categoryName.trim(),
          icon: categoryIcon,
          displayOrder: Number(categoryDisplayOrder)
        });
        showToast(`New Category "${categoryName}" created!`, 'success');
      }
      setIsCategoryModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      showToast('Failed to save category', 'error');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await menuService.deleteCategory(cat.id);
      showToast(`Category "${cat.name}" removed`, 'info');
      loadCatalogData();
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || String(item.categoryId) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    const csvData = `ID,Role,UserEmail,Action,Timestamp\n101,ADMIN,admin@aura.com,TABLE_TOKEN_GENERATE,${new Date().toISOString()}\n102,CUSTOMER,guest@table1.com,ORDER_PLACED,${new Date().toISOString()}`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_admin_audit_${Date.now()}.csv`;
    a.click();
  };

  // Detail Drill-Down Modal State
  const [activeDetailModal, setActiveDetailModal] = useState<'REVENUE' | 'ONGOING' | 'COMPLETED' | 'RESERVATIONS' | 'REFUNDS' | null>(null);
  const [viewBillOrder, setViewBillOrder] = useState<any | null>(null);

  // Lock background body scroll when any modal is open
  useBodyScrollLock(isDishModalOpen || isCategoryModalOpen || activeDetailModal !== null || viewBillOrder !== null);

  // Real MongoDB Orders & Executive Analytics State
  const [realActiveOrders, setRealActiveOrders] = useState<any[]>([]);
  const [realSettledOrders, setRealSettledOrders] = useState<any[]>([]);
  const [realRefundedOrders, setRealRefundedOrders] = useState<any[]>([]);
  const [executiveData, setExecutiveData] = useState<ExecutiveAnalyticsData | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ hour: string; sales: number; orders: number; peak: boolean } | null>(null);
  const [isLoadingRealOrders, setIsLoadingRealOrders] = useState(false);

  const fetchMetricsAndOrders = async (showLoading = false) => {
    if (showLoading) setIsLoadingRealOrders(true);
    try {
      const [m, exec, active, settled, refunded, tables] = await Promise.all([
        adminService.getMetrics().catch(() => null),
        adminService.getExecutiveAnalytics().catch(() => null),
        orderService.getActiveOrders().catch(() => []),
        orderService.getSettledOrders().catch(() => []),
        orderService.getRefundedOrders().catch(() => []),
        tableService.getAllTables().catch(() => [])
      ]);
      if (m) setMetrics(m);
      if (exec) setExecutiveData(exec);
      setRealActiveOrders(active || []);
      setRealSettledOrders(settled || []);
      setRealRefundedOrders(refunded || []);
      if (tables && tables.length > 0) setAllTables(tables);
    } catch (err) {
      console.error('Failed to fetch live real-time dashboard metrics:', err);
    } finally {
      if (showLoading) setIsLoadingRealOrders(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndOrders(true);

    // Auto-update dashboard metrics every 5 seconds for real-time synchronization
    const intervalId = setInterval(() => {
      fetchMetricsAndOrders(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeDetailModal, activeTab]);

  // Rich Refund Modal State
  const [refundTargetOrder, setRefundTargetOrder] = useState<any | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const handleAdminRefundOrder = (order: any) => {
    setRefundTargetOrder(order);
    setIsRefundModalOpen(true);
  };

  // Calculate live net metrics from real MongoDB orders (accounting for partial refunds)
  const liveSettledRevenue = realSettledOrders.reduce(
    (sum, o) => sum + Math.max(0, (o.total || 0) - (o.refundAmount || 0)),
    0
  );
  const displayRevenue = liveSettledRevenue > 0 ? liveSettledRevenue : (metrics?.revenue || executiveData?.todaySales || 0);

  const totalProcessedOrders = realSettledOrders.length + realRefundedOrders.length;
  const liveRefundRate = totalProcessedOrders > 0
    ? ((realRefundedOrders.length / totalProcessedOrders) * 100).toFixed(1)
    : '0.0';
  const totalRefundedSum = realRefundedOrders.reduce((sum, o) => sum + (o.refundAmount || o.total || 0), 0);

  // Derived Financial Calculations
  const completedCount = realSettledOrders.length || executiveData?.completedOrders || 0;
  const ongoingCount = realActiveOrders.length || executiveData?.ongoingOrders || 0;
  const totalOrdersCount = completedCount + ongoingCount;
  const todayAov = completedCount > 0
    ? Math.round(displayRevenue / completedCount)
    : (executiveData?.aov || (totalOrdersCount > 0 ? Math.round(displayRevenue / totalOrdersCount) : 0));
  const gstCollected = Math.round((displayRevenue * 0.05) / 1.05);
  const netSalesIntake = displayRevenue - gstCollected;

  // Real Payment Methods Breakdown
  const paymentBreakdown = (() => {
    let upi = 0;
    let card = 0;
    let cash = 0;
    realSettledOrders.forEach((o) => {
      const method = (o.paymentMethod || '').toUpperCase();
      const val = Math.max(0, (o.total || 0) - (o.refundAmount || 0));
      if (method.includes('CARD') || method.includes('SWIPE')) {
        card += val;
      } else if (method.includes('CASH')) {
        cash += val;
      } else {
        upi += val;
      }
    });
    const total = upi + card + cash || 1;
    return {
      upi,
      card,
      cash,
      upiPct: Math.round((upi / total) * 100),
      cardPct: Math.round((card / total) * 100),
      cashPct: Math.round((cash / total) * 100),
    };
  })();

  // Live Kitchen Pipeline Working Status
  const kitchenPipeline = {
    received: realActiveOrders.filter((o) => o.status === 'received').length,
    preparing: realActiveOrders.filter((o) => o.status === 'preparing').length,
    ready: realActiveOrders.filter((o) => o.status === 'ready').length,
    served: realActiveOrders.filter((o) => o.status === 'served' || o.status === 'completed').length,
    total: realActiveOrders.length,
  };

  // Floor Table Capacity Status
  const tableStatusCounts = {
    available: allTables.filter((t) => t.status === 'available').length,
    occupied: allTables.filter((t) => t.status === 'occupied').length,
    billing: allTables.filter((t) => t.status === 'billing').length,
    cleaning: allTables.filter((t) => t.status === 'cleaning').length,
    total: allTables.length || 30,
  };

  // Out of Stock Dishes
  const outOfStockDishes = menuItems.filter((d) => d.isAvailable === false);

  // Export Financial & Operations Audit Report
  const handleExportReport = () => {
    const reportData = executiveData;
    const reportSummary = `SILIGURI'S CHAI ADDAA - UNIFIED FINANCIAL & OPERATIONS AUDIT
Generated: ${new Date().toLocaleString()}
Today's Settled Sales: ₹${displayRevenue.toLocaleString('en-IN')}
Net Intake (Pre-GST): ₹${netSalesIntake.toLocaleString('en-IN')}
GST Collected (5%): ₹${gstCollected.toLocaleString('en-IN')}
Total Orders in System: ${totalOrdersCount}
Completed Invoices: ${completedCount}
Ongoing Kitchen/Dining Orders: ${ongoingCount}
Average Order Value (AOV): ₹${todayAov.toLocaleString('en-IN')}
Payment Breakdown: UPI (${paymentBreakdown.upiPct}%), Card (${paymentBreakdown.cardPct}%), Cash (${paymentBreakdown.cashPct}%)
Floor Occupancy: ${tableStatusCounts.occupied + tableStatusCounts.billing} / ${tableStatusCounts.total} Tables (${Math.round(((tableStatusCounts.occupied + tableStatusCounts.billing) / tableStatusCounts.total) * 100)}%)
Average Table Turnover: ${reportData?.tableTurnoverMins || 42} minutes

TOP PERFORMING DISHES:
${(reportData?.topDishes || []).map((d) => `${d.rank} ${d.name}: ${d.orders} orders (₹${d.revenue.toLocaleString('en-IN')})`).join('\n')}

CATEGORY REVENUE BREAKDOWN:
${(reportData?.categoryBreakdown || []).map((c) => `${c.name}: ₹${c.revenue.toLocaleString('en-IN')} (${c.pct}%)`).join('\n')}
`;
    const blob = new Blob([reportSummary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Siliguri_Chai_Addaa_Audit_${Date.now()}.txt`;
    a.click();
    showToast('Executive Financial Audit report downloaded', 'success');
  };

  const maxHeatmapSales = executiveData?.hourlyHeatmap
    ? Math.max(...executiveData.hourlyHeatmap.map((b) => b.sales), 1)
    : 1;

  return (
    <div className="page-theme-admin h-full overflow-y-auto p-3 sm:p-6 font-sans text-theme-text bg-theme-bg">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-24">
        {/* Header Banner - Merged Unified Operations & Executive Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-theme-surface border border-theme-border p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 sm:p-3.5 bg-theme-primary-light border border-theme-primary/30 rounded-xl shadow-inner shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-theme-primary" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-xl sm:text-2xl font-black tracking-wide text-white">
                  UNIFIED OPERATIONS &amp; EXECUTIVE CONTROL
                </h1>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-theme-primary-light text-theme-primary border border-theme-primary/30 uppercase">
                  ADMIN &amp; CEO
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5">
                Financial Yield, Live Restaurant Working &amp; Floor Operations Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono text-xs shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold tracking-wider uppercase text-[10px]">Real-Time DB Sync</span>
            </div>

            <button
              onClick={() => fetchMetricsAndOrders(true)}
              disabled={isLoadingRealOrders}
              className="px-3 py-2 bg-[#07090E] hover:bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoadingRealOrders ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportReport}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Export complete financial and operations audit report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              title="View and print table QR code stands"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Stands</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-slate-800 text-white border-slate-600 shadow-md font-black'
                : 'bg-[#0A0D15] text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
            }`}
          >
            Operational Overview (3 Pillars)
          </button>
          <button
            onClick={() => setActiveTab('MENU_CATALOG')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center space-x-2 cursor-pointer ${
              activeTab === 'MENU_CATALOG'
                ? 'bg-slate-800 text-white border-slate-600 shadow-md font-black'
                : 'bg-[#0A0D15] text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
            }`}
          >
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span>Manage Menu Catalog ({menuItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center space-x-2 cursor-pointer ${
              activeTab === 'CATEGORIES'
                ? 'bg-slate-800 text-white border-slate-600 shadow-md font-black'
                : 'bg-[#0A0D15] text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border flex items-center space-x-2 cursor-pointer ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-slate-800 text-white border-slate-600 shadow-md font-black'
                : 'bg-[#0A0D15] text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Settled Invoices &amp; Refunds</span>
          </button>
        </div>

        {/* TAB 1: UNIFIED OVERVIEW (THE THREE PILLARS) */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* ═════════════════════════════════════════════════════════════
                PILLAR 1: FINANCIAL PERFORMANCE & REVENUE YIELD (FINANCE)
            ═════════════════════════════════════════════════════════════ */}
            <div className="bg-[#0A0D15] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      Pillar 1: Financial Performance &amp; Revenue Yield
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Settled gross sales, average dining basket, taxes, and 24-hour service volume
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Net Sales:</span>
                  <span className="text-emerald-400 font-bold font-mono">₹{netSalesIntake.toLocaleString('en-IN')}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">GST (5%):</span>
                  <span className="text-amber-400 font-bold font-mono">₹{gstCollected.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  onClick={() => setActiveDetailModal('REVENUE')}
                  className="p-4 bg-[#0E1422] border border-slate-800 hover:border-emerald-500/40 rounded-xl space-y-1.5 cursor-pointer transition-all shadow-md group"
                >
                  <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                    <span className="font-bold">SETTLED REVENUE</span>
                    <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="font-mono text-2xl font-black text-emerald-400">
                    ₹{displayRevenue.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>{completedCount} Invoices Settled</span>
                    <span className="text-emerald-400 font-bold">Details &rarr;</span>
                  </div>
                </div>

                <div className="p-4 bg-[#0E1422] border border-slate-800 rounded-xl space-y-1.5 shadow-md">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                    <span className="font-bold">AVERAGE ORDER VALUE</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="font-mono text-2xl font-black text-white">
                    ₹{todayAov.toLocaleString('en-IN')}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                    Average table dining spend
                  </div>
                </div>

                <div className="p-4 bg-[#0E1422] border border-slate-800 rounded-xl space-y-1.5 shadow-md">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                    <span className="font-bold">PAYMENT CHANNELS</span>
                    <CreditCard className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex items-center space-x-2 pt-1 font-mono text-xs">
                    <span className="text-emerald-400 font-bold">UPI: {paymentBreakdown.upiPct}%</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-sky-400 font-bold">Card: {paymentBreakdown.cardPct}%</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-400 font-bold">Cash: {paymentBreakdown.cashPct}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                    Instant POS settlements
                  </div>
                </div>

                <div
                  onClick={() => setActiveDetailModal('REFUNDS')}
                  className="p-4 bg-[#0E1422] border border-slate-800 hover:border-blue-500/40 rounded-xl space-y-1.5 cursor-pointer transition-all shadow-md group"
                >
                  <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                    <span className="font-bold">AUDIT INTEGRITY</span>
                    <ShieldCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="font-mono text-2xl font-black text-white">
                    {liveRefundRate === '0.0' ? '100% Valid' : `${liveRefundRate}% Refund`}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>₹{totalRefundedSum.toLocaleString('en-IN')} Refunded</span>
                    <span className="text-blue-400 font-bold">Audit &rarr;</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Financial Charts: Hourly Heatmap + Category Revenue Mix */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                {/* Hourly Sales Heatmap Bar Chart (7 Cols) */}
                <div className="lg:col-span-7 bg-[#0E1422] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Hourly Service Revenue Heatmap
                      </h3>
                    </div>
                    {hoveredBar ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        {hoveredBar.hour}: ₹{hoveredBar.sales.toLocaleString('en-IN')} ({hoveredBar.orders} orders)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        Hover bar for exact hour revenue
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto luxury-scrollbar-x pb-1">
                    <div
                      className="gap-1 pt-6 items-end h-36 border-b border-slate-800 pb-2 min-w-[500px]"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${executiveData?.hourlyHeatmap?.length || 24}, minmax(0, 1fr))`
                      }}
                    >
                      {executiveData?.hourlyHeatmap && executiveData.hourlyHeatmap.length > 0 ? (
                        executiveData.hourlyHeatmap.map((bar, idx) => {
                          const heightPct = bar.sales > 0 ? Math.max((bar.sales / maxHeatmapSales) * 100, 14) : 8;
                          const isHovered = hoveredBar?.hour === bar.hour;

                          return (
                            <div
                              key={idx}
                              className="flex flex-col items-center gap-1 h-full justify-end cursor-pointer group"
                              onMouseEnter={() => setHoveredBar(bar)}
                              onMouseLeave={() => setHoveredBar(null)}
                            >
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full max-w-[20px] rounded-t transition-all duration-200 ${
                                  bar.peak
                                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                                    : bar.sales > 0
                                    ? 'bg-emerald-600 hover:bg-emerald-500'
                                    : 'bg-slate-900 border border-slate-800'
                                } ${isHovered ? 'ring-2 ring-white/60' : ''}`}
                              />
                              <span className={`text-[8px] font-mono ${isHovered ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                {bar.hour.split(':')[0]}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full text-center text-xs text-slate-500 py-6">
                          No hourly orders logged for today's service window yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Revenue Contribution Breakdown (5 Cols) */}
                <div className="lg:col-span-5 bg-[#0E1422] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Category Revenue Mix
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Share %</span>
                  </div>

                  <div className="space-y-2.5 text-xs max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {executiveData?.categoryBreakdown && executiveData.categoryBreakdown.length > 0 ? (
                      executiveData.categoryBreakdown.map((cat, idx) => {
                        const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-purple-500'];
                        const color = colors[idx % colors.length];

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between font-semibold text-slate-200 text-[11px]">
                              <span className="truncate max-w-[160px]">{cat.name}</span>
                              <span className="font-mono text-white font-bold">
                                ₹{cat.revenue.toLocaleString('en-IN')} ({cat.pct}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full ${color} rounded-full transition-all duration-500`}
                                style={{ width: `${Math.max(cat.pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-xs text-slate-500 py-4">
                        Category revenue mix will render as dining bills settle.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════
                PILLAR 2: LIVE MENU DETAILS & RESTAURANT WORKING (MENU & KITCHEN)
            ═════════════════════════════════════════════════════════════ */}
            <div className="bg-[#0A0D15] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      Pillar 2: Menu Details &amp; Live Restaurant Working
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Live cooking pipeline, real-time dining tickets, dish velocity, and out-of-stock monitor
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('MENU_CATALOG')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Menu Catalog ({menuItems.length})</span>
                  </button>
                </div>
              </div>

              {/* 4 Pipeline Status Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#0E1422] border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">1. IN QUEUE</span>
                    <span className="text-xs text-slate-300">Received</span>
                  </div>
                  <span className="font-mono text-xl font-black text-blue-400">{kitchenPipeline.received}</span>
                </div>

                <div className="p-3 bg-[#0E1422] border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">2. ON FLAMES</span>
                    <span className="text-xs text-slate-300">Cooking Now</span>
                  </div>
                  <span className="font-mono text-xl font-black text-amber-400">{kitchenPipeline.preparing}</span>
                </div>

                <div className="p-3 bg-[#0E1422] border border-cyan-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">3. AT PASS</span>
                    <span className="text-xs text-slate-300">Ready to Serve</span>
                  </div>
                  <span className="font-mono text-xl font-black text-cyan-400">{kitchenPipeline.ready}</span>
                </div>

                <div className="p-3 bg-[#0E1422] border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">4. SERVED</span>
                    <span className="text-xs text-slate-300">Dining at Table</span>
                  </div>
                  <span className="font-mono text-xl font-black text-emerald-400">{kitchenPipeline.served}</span>
                </div>
              </div>

              {/* 2-Column Working Operations: Live Tickets + Top Dishes Leaderboard & Out of Stock Watch */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                {/* Live Active Dining Orders Stream (7 Cols) */}
                <div className="lg:col-span-7 bg-[#0E1422] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Live Active Dining Tickets ({realActiveOrders.length})
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Live Kitchen Feed
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {realActiveOrders.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        Kitchen line clear. No active tickets being prepared at the moment.
                      </div>
                    ) : (
                      realActiveOrders.map((ord: any) => {
                        const itemsList = ord.items || [];
                        const elapsedMins = Math.round((Date.now() - new Date(ord.createdAt).getTime()) / 60000);

                        return (
                          <div
                            key={ord._id || ord.orderId}
                            className="p-3 bg-[#080B11] border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                  T-{ord.tableId}
                                </span>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                    ord.status === 'ready'
                                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                      : ord.status === 'preparing'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {elapsedMins}m elapsed
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 truncate mt-1">
                                {itemsList.map((it: any) => `${it.quantity || it.qty || 1}x ${it.name}`).join(', ') || 'No itemized notes'}
                              </p>
                            </div>

                            <span className="font-mono text-white font-bold shrink-0 text-sm">
                              ₹{Math.round(ord.total || 0)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Top Yield Dishes & Out of Stock Watch (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  {/* Top Yield Dishes */}
                  <div className="bg-[#0E1422] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Top Sellers Leaderboard
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Yield</span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {executiveData?.topDishes && executiveData.topDishes.length > 0 ? (
                        executiveData.topDishes.slice(0, 4).map((dish, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-[#080B11] border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="w-5 h-5 bg-slate-800 text-slate-300 font-black text-[10px] rounded flex items-center justify-center font-mono shrink-0">
                                {dish.rank}
                              </span>
                              <div className="truncate">
                                <p className="font-bold text-white truncate text-[11px]">{dish.name}</p>
                                <span className="text-[9px] text-emerald-400 font-mono">
                                  {dish.orders} Orders
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-white font-bold text-xs shrink-0 ml-1">
                              ₹{dish.revenue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-slate-500 py-3">
                          Leaderboard populates as dishes are ordered.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Out of Stock (86'd) Item Watch */}
                  <div className="bg-[#0E1422] border border-slate-800/90 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[11px] uppercase tracking-wider">Out-of-Stock (86'd) Watch</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                        {outOfStockDishes.length} Items
                      </span>
                    </div>

                    {outOfStockDishes.length === 0 ? (
                      <p className="text-[11px] text-emerald-400 font-medium">
                        All {menuItems.length} menu dishes are currently active and available.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {outOfStockDishes.slice(0, 5).map((dish) => (
                          <div
                            key={dish.id}
                            className="px-2 py-1 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center space-x-1.5 text-[10px] text-rose-200"
                          >
                            <span className="truncate max-w-[100px]">{dish.name}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(dish)}
                              className="px-1 py-0.2 bg-emerald-500 text-black font-black rounded text-[9px] cursor-pointer hover:bg-emerald-400"
                              title="Mark In Stock"
                            >
                              Restock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════
                PILLAR 3: FLOOR, TABLE & STAFF OPERATIONS (3RD ESSENTIAL PILLAR)
            ═════════════════════════════════════════════════════════════ */}
            <div className="bg-[#0A0D15] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      Pillar 3: Floor, Table &amp; Staff Operations
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Table capacity load, floor zones, turnover speed, and service alerts
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Turnover Speed:</span>
                  <span className="text-white font-bold font-mono">{executiveData?.tableTurnoverMins || 42} mins</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Total Capacity:</span>
                  <span className="text-cyan-400 font-bold font-mono">30 Tables (128 Seats)</span>
                </div>
              </div>

              {/* 4 Table Status Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#0E1422] border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">FREE TABLES</span>
                    <span className="text-xs text-slate-300">Ready for Seating</span>
                  </div>
                  <span className="font-mono text-xl font-black text-emerald-400">{tableStatusCounts.available}</span>
                </div>

                <div className="p-3 bg-[#0E1422] border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">OCCUPIED</span>
                    <span className="text-xs text-slate-300">Dining In Session</span>
                  </div>
                  <span className="font-mono text-xl font-black text-amber-400">{tableStatusCounts.occupied}</span>
                </div>

                <div className="p-3 bg-[#0E1422] border border-purple-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">BILLING</span>
                    <span className="text-xs text-slate-300">Awaiting Settlement</span>
                  </div>
                  <span className="font-mono text-xl font-black text-purple-400">{tableStatusCounts.billing}</span>
                </div>

                <div className="p-3 bg-[#0E1422] border border-slate-700 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">CLEANING</span>
                    <span className="text-xs text-slate-300">Turnover Sanitizing</span>
                  </div>
                  <span className="font-mono text-xl font-black text-slate-300">{tableStatusCounts.cleaning}</span>
                </div>
              </div>

              {/* Zone Distribution & Direct Operational Portal Launches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Floor Zones Distribution */}
                <div className="bg-[#0E1422] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Restaurant Floor Zones Capacity</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#080B11] border border-slate-800 rounded-lg space-y-1">
                      <span className="font-bold text-white text-[11px] block">Main Dining Hall</span>
                      <span className="text-[10px] font-mono text-slate-400 block">Tables 1-12 • 48 Seats</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Standard Dining</span>
                    </div>

                    <div className="p-2.5 bg-[#080B11] border border-slate-800 rounded-lg space-y-1">
                      <span className="font-bold text-white text-[11px] block">VIP Lounge Suites</span>
                      <span className="text-[10px] font-mono text-slate-400 block">Tables 13-16 • 24 Seats</span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">Priority Experience</span>
                    </div>

                    <div className="p-2.5 bg-[#080B11] border border-slate-800 rounded-lg space-y-1">
                      <span className="font-bold text-white text-[11px] block">Outdoor Garden</span>
                      <span className="text-[10px] font-mono text-slate-400 block">Tables 17-24 • 32 Seats</span>
                      <span className="text-[10px] font-mono text-sky-400 font-bold">Fresh Air &amp; Brews</span>
                    </div>

                    <div className="p-2.5 bg-[#080B11] border border-slate-800 rounded-lg space-y-1">
                      <span className="font-bold text-white text-[11px] block">Family &amp; Large Boothing</span>
                      <span className="text-[10px] font-mono text-slate-400 block">Tables 25-30 • 24 Seats</span>
                      <span className="text-[10px] font-mono text-purple-400 font-bold">Multi-Guest Seating</span>
                    </div>
                  </div>
                </div>

                {/* Direct Operational Portal Links */}
                <div className="bg-[#0E1422] border border-slate-800/90 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Direct Operational Portals</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Instant single-click access for managers overseeing live floor activities
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href="/waiter"
                      className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex items-center space-x-2 text-cyan-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Waiter Floor Map &rarr;</span>
                    </a>

                    <a
                      href="/cashier"
                      className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center space-x-2 text-purple-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Cashier POS &rarr;</span>
                    </a>

                    <a
                      href="/kitchen"
                      className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Kitchen KDS &rarr;</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Print QR Stands &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU DISHES MANAGEMENT */}
        {activeTab === 'MENU_CATALOG' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-aura-container border border-aura-border p-5 rounded-3xl">
              <div className="flex items-center space-x-3">
                <ChefHat className="w-6 h-6 text-[#38BDF8]" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Menu Catalog Master</h3>
                  <p className="text-xs text-aura-slate">Add, edit, toggle availability, or remove dishes from customer menu</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenDishModal()}
                className="px-5 py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-[#0EA5E9]/20 cursor-pointer border border-[#7DD3FC]/50"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Recipe Item</span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-aura-slate" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dish name or description..."
                  className="w-full pl-10 pr-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-xs text-aura-ivory placeholder:text-aura-slate/50 focus:outline-none focus:border-[#38BDF8] font-mono"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-xs text-aura-ivory font-mono focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dish Cards Grid */}
            {isLoadingCatalog ? (
              <div className="py-16 text-center text-aura-slate font-mono text-xs">
                Loading menu catalog from MongoDB...
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="py-16 text-center bg-aura-container border border-aura-border/60 rounded-3xl space-y-3">
                <ChefHat className="w-10 h-10 text-[#38BDF8]/40 mx-auto" />
                <p className="text-sm font-semibold text-aura-slate">No dishes found matching search criteria</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
                  className="text-xs text-[#38BDF8] underline hover:text-white cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenuItems.map((dish) => {
                  const cat = categories.find((c) => c.id === dish.categoryId);
                  return (
                    <div
                      key={dish.id}
                      className={`bg-aura-container border rounded-3xl p-4 flex flex-col justify-between space-y-4 transition-all shadow-xl hover:border-[#38BDF8]/50 relative overflow-hidden ${
                        dish.isAvailable ? 'border-aura-border/80' : 'border-rose-500/40 bg-rose-500/5'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-aura-border/80 shadow-md flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider block truncate">
                                {cat?.name || `Cat #${dish.categoryId}`}
                              </span>
                              <span className="text-[10px] font-mono text-aura-slate">#{dish.id}</span>
                            </div>
                            <h4 className="font-serif font-bold text-sm text-white truncate">{dish.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="font-serif font-bold text-[#38BDF8] text-base">
                                ₹{dish.price.toLocaleString('en-IN')}
                              </span>
                              {dish.isVegetarian && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                  VEG
                                </span>
                              )}
                              {dish.isChefSpecial && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] font-bold flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> SPECIAL
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-aura-slate line-clamp-2 leading-relaxed font-light">
                          {dish.description}
                        </p>
                      </div>

                      {/* Card Action Controls */}
                      <div className="pt-3 border-t border-aura-border/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleAvailability(dish)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                            dish.isAvailable
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          {dish.isAvailable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          <span>{dish.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                        </button>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenDishModal(dish)}
                            className="p-2 bg-aura-obsidian hover:bg-[#38BDF8]/10 border border-aura-border hover:border-[#38BDF8]/40 text-aura-slate hover:text-[#38BDF8] rounded-xl transition-all cursor-pointer"
                            title="Edit Dish"
                          >
                            <Edit className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                          <button
                            onClick={() => handleDeleteDish(dish)}
                            className="p-2 bg-aura-obsidian hover:bg-rose-500/10 border border-aura-border hover:border-rose-500/40 text-aura-slate hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                            title="Delete Dish"
                          >
                            <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === 'CATEGORIES' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-aura-container border border-aura-border p-5 rounded-3xl">
              <div className="flex items-center space-x-3">
                <Layers className="w-6 h-6 text-[#38BDF8]" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Menu Categories</h3>
                  <p className="text-xs text-aura-slate">Organize and re-order menu categories across the customer digital menu</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCategoryModal()}
                className="px-5 py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-[#0EA5E9]/20 cursor-pointer border border-[#7DD3FC]/50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = menuItems.filter((i) => i.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-aura-container border border-aura-border/80 rounded-3xl p-5 flex items-center justify-between shadow-xl hover:border-[#38BDF8]/50 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-2xl text-[#38BDF8] font-bold">
                        #{cat.displayOrder || cat.id}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-white">{cat.name}</h4>
                        <span className="text-xs text-aura-slate font-mono block">{count} Recipe Items</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenCategoryModal(cat)}
                        className="p-2.5 bg-aura-obsidian hover:bg-[#38BDF8]/10 border border-aura-border hover:border-[#38BDF8]/40 text-aura-slate hover:text-[#38BDF8] rounded-xl transition-all cursor-pointer"
                      >
                        <Edit className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-2.5 bg-aura-obsidian hover:bg-rose-500/10 border border-aura-border hover:border-rose-500/40 text-aura-slate hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="bg-aura-container border border-aura-border rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-aura-ivory flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Security Audit Log Stream
            </h3>

            <DataToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExportCSV={handleExportCSV}
              placeholder="Search audit events..."
            />

            <div className="overflow-x-auto luxury-scrollbar-x pb-2">
              <table className="w-full text-left text-xs text-aura-ivory min-w-[600px]">
                <thead className="bg-aura-obsidian text-aura-slate uppercase text-[10px] border-b border-aura-border">
                  <tr>
                    <th className="py-3.5 px-4">Log ID</th>
                    <th className="py-3.5 px-4">Action Event</th>
                    <th className="py-3.5 px-4">User Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aura-border/40 font-mono">
                  <tr className="hover:bg-aura-obsidian/40">
                    <td className="py-3.5 px-4 text-[#38BDF8] font-bold">#101</td>
                    <td className="py-3.5 px-4 font-semibold text-aura-ivory">TABLE_SESSION_CHECKOUT</td>
                    <td className="py-3.5 px-4 text-aura-slate">admin@aura.com</td>
                    <td className="py-3.5 px-4"><StatusBadge status="SETTLED" /></td>
                    <td className="py-3.5 px-4 text-aura-slate">Just now</td>
                  </tr>
                  <tr className="hover:bg-aura-obsidian/40">
                    <td className="py-3.5 px-4 text-[#38BDF8] font-bold">#102</td>
                    <td className="py-3.5 px-4 font-semibold text-aura-ivory">ORDER_PLACED</td>
                    <td className="py-3.5 px-4 text-aura-slate">guest@table10.com</td>
                    <td className="py-3.5 px-4"><StatusBadge status="PENDING" /></td>
                    <td className="py-3.5 px-4 text-aura-slate">2 min ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DISH ADD / EDIT MODAL */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-aura-container border border-aura-border rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-aura-border/60 pb-4">
              <div className="flex items-center space-x-3">
                <ChefHat className="w-6 h-6 text-[#38BDF8]" />
                <h3 className="font-serif text-xl font-bold text-white">
                  {editingDish ? `Edit "${editingDish.name}"` : 'Add New Recipe Dish'}
                </h3>
              </div>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="p-2 text-aura-slate hover:text-aura-ivory transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-aura-slate uppercase tracking-wider block">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Kashmiri Saffron Zafrani Murgh Tikka"
                  className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-aura-slate uppercase tracking-wider block">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="650"
                    className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-aura-slate uppercase tracking-wider block">Category</label>
                  <select
                    value={dishCategoryId}
                    onChange={(e) => setDishCategoryId(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-aura-slate uppercase tracking-wider block">Description</label>
                <textarea
                  rows={3}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Artisanal description of ingredients, preparation method, and flavors..."
                  className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-aura-slate uppercase tracking-wider block">Image URL</label>
                <input
                  type="text"
                  value={dishImageUrl}
                  onChange={(e) => setDishImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono text-[11px]"
                />
              </div>

              {/* Prep Time & Spice Level Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-aura-slate uppercase tracking-wider block">Spice Level</label>
                  <select
                    value={dishSpiceLevel}
                    onChange={(e) => setDishSpiceLevel(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono cursor-pointer"
                  >
                    <option value={0}>🌶️ None (0)</option>
                    <option value={1}>🌶️ Mild (1)</option>
                    <option value={2}>🌶️🌶️ Medium (2)</option>
                    <option value={3}>🌶️🌶️🌶️ Hot & Spicy (3)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-aura-slate uppercase tracking-wider block">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={dishPrepTime}
                    onChange={(e) => setDishPrepTime(Number(e.target.value))}
                    placeholder="15"
                    className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
                  />
                </div>
              </div>

              {/* Toggles & Tags Grid */}
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-aura-slate uppercase tracking-wider block">Dietary Tags & Badges</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={dishIsVeg}
                      onChange={(e) => {
                        setDishIsVeg(e.target.checked);
                        if (e.target.checked) setDishIsNonVeg(false);
                      }}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="font-bold text-emerald-400">Vegetarian</span>
                  </label>

                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={dishIsNonVeg}
                      onChange={(e) => {
                        setDishIsNonVeg(e.target.checked);
                        if (e.target.checked) setDishIsVeg(false);
                      }}
                      className="accent-rose-500 rounded"
                    />
                    <span className="font-bold text-rose-400">Non-Veg</span>
                  </label>

                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={dishIsGlutenFree}
                      onChange={(e) => setDishIsGlutenFree(e.target.checked)}
                      className="accent-amber-400 rounded"
                    />
                    <span className="font-bold text-amber-300">Gluten-Free (GF)</span>
                  </label>

                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={dishIsJain}
                      onChange={(e) => setDishIsJain(e.target.checked)}
                      className="accent-purple-400 rounded"
                    />
                    <span className="font-bold text-purple-300">Jain</span>
                  </label>

                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={dishIsChefSpecial}
                      onChange={(e) => setDishIsChefSpecial(e.target.checked)}
                      className="accent-[#0EA5E9] rounded"
                    />
                    <span className="font-bold text-[#38BDF8]">Chef Special</span>
                  </label>

                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={dishIsBestSeller}
                      onChange={(e) => setDishIsBestSeller(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span className="font-bold text-amber-400">Best Seller</span>
                  </label>

                  <label className="p-3 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center space-x-2.5 cursor-pointer hover:border-[#38BDF8]/40 transition-all col-span-2 sm:col-span-1">
                    <input
                      type="checkbox"
                      checked={dishIsAvailable}
                      onChange={(e) => setDishIsAvailable(e.target.checked)}
                      className="accent-blue-500 rounded"
                    />
                    <span className="font-bold text-aura-ivory">In Stock</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-aura-border/60">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-5 py-3 bg-aura-obsidian hover:bg-aura-border text-aura-slate hover:text-aura-ivory font-bold rounded-2xl uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-black rounded-2xl uppercase tracking-wider shadow-lg shadow-[#0EA5E9]/20 cursor-pointer border border-[#7DD3FC]/50"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD / EDIT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-aura-container border border-aura-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-aura-border/60 pb-4">
              <div className="flex items-center space-x-3">
                <Layers className="w-6 h-6 text-[#38BDF8]" />
                <h3 className="font-serif text-xl font-bold text-white">
                  {editingCategory ? `Edit "${editingCategory.name}"` : 'Add Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-aura-slate hover:text-aura-ivory transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-aura-slate uppercase tracking-wider block">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Botanical Cocktails & Elixirs"
                  className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-aura-slate uppercase tracking-wider block">Display Order</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={categoryDisplayOrder}
                  onChange={(e) => setCategoryDisplayOrder(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-aura-obsidian border border-aura-border rounded-2xl text-aura-ivory focus:outline-none focus:border-[#38BDF8] font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-aura-border/60">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-3 bg-aura-obsidian hover:bg-aura-border text-aura-slate hover:text-aura-ivory font-bold rounded-2xl uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#090A0F] font-black rounded-2xl uppercase tracking-wider shadow-lg shadow-[#0EA5E9]/20 cursor-pointer border border-[#7DD3FC]/50"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DRILL-DOWN DETAIL MODALS */}
      {activeDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-aura-container border border-aura-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-aura-border/60 pb-4">
              <div className="flex items-center space-x-3">
                {activeDetailModal === 'REVENUE' && <DollarSign className="w-6 h-6 text-emerald-400" />}
                {activeDetailModal === 'ONGOING' && <ShoppingBag className="w-6 h-6 text-[#38BDF8]" />}
                {activeDetailModal === 'COMPLETED' && <CheckCircle2 className="w-6 h-6 text-blue-400" />}
                {activeDetailModal === 'RESERVATIONS' && <Calendar className="w-6 h-6 text-purple-400" />}
                <h3 className="font-serif text-xl font-bold text-white">
                  {activeDetailModal === 'REVENUE' && 'Daily Revenue & Profit Breakdown'}
                  {activeDetailModal === 'ONGOING' && 'Active Dining Tickets & KDS Status'}
                  {activeDetailModal === 'COMPLETED' && "Today's Settled Orders Log"}
                  {activeDetailModal === 'RESERVATIONS' && "Today's Table Reservations Roster"}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailModal(null)}
                className="p-2 text-aura-slate hover:text-aura-ivory transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* REVENUE DRILL-DOWN */}
            {activeDetailModal === 'REVENUE' && (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl">
                    <span className="text-[10px] text-aura-slate uppercase font-bold block">Gross Sales</span>
                    <span className="font-serif font-bold text-xl text-emerald-400">
                      ₹{displayRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl">
                    <span className="text-[10px] text-aura-slate uppercase font-bold block">Est. Profit (35%)</span>
                    <span className="font-serif font-bold text-xl text-[#38BDF8]">
                      ₹{(displayRevenue * 0.35).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl">
                    <span className="text-[10px] text-aura-slate uppercase font-bold block">GST Collected (5%)</span>
                    <span className="font-serif font-bold text-xl text-blue-400">
                      ₹{(displayRevenue * 0.05).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-[#38BDF8] uppercase tracking-wider text-[11px]">Real Settled Orders Breakdown ({realSettledOrders.length} Invoices)</h4>
                  {realSettledOrders.length === 0 ? (
                    <div className="p-4 bg-aura-obsidian border border-aura-border rounded-xl text-center text-aura-slate font-mono">
                      No settled bills in database yet. Settle bills at Cashier POS to see live revenue breakdown.
                    </div>
                  ) : (
                    <div className="space-y-2 font-mono">
                      {realSettledOrders.slice(0, 5).map((ord) => (
                        <div key={ord._id || ord.orderId} className="p-3 bg-aura-obsidian border border-aura-border rounded-xl flex items-center justify-between">
                          <span className="text-aura-ivory flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-400" /> Invoice #{ord.invoiceNumber || ord.orderId} (Table {ord.tableId})
                          </span>
                          <span className="font-bold text-emerald-400">₹{(ord.total || 0).toLocaleString('en-IN')} ({ord.paymentMethod || 'UPI/Card'})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ONGOING ORDERS DRILL-DOWN */}
            {activeDetailModal === 'ONGOING' && (
              <div className="space-y-4 text-xs">
                <p className="text-aura-slate">Live active dining tickets currently in kitchen preparation or serving stage (MongoDB Database):</p>
                {isLoadingRealOrders ? (
                  <div className="py-8 text-center text-aura-slate font-mono">Fetching active tickets from MongoDB...</div>
                ) : realActiveOrders.length === 0 ? (
                  <div className="py-12 text-center bg-aura-obsidian border border-aura-border rounded-2xl space-y-2 font-mono">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-aura-ivory text-sm">No Active Ongoing Orders</p>
                    <p className="text-aura-slate text-xs">All dining tickets have been completed or settled at Cashier POS.</p>
                  </div>
                ) : (
                  <div className="space-y-3 font-mono">
                    {realActiveOrders.map((ord) => (
                      <div key={ord._id || ord.orderId} className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#38BDF8]">Table {ord.tableId}</span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                              {ord.status || 'received'}
                            </span>
                          </div>
                          <span className="text-aura-slate text-[11px] block mt-1">
                            Order #{ord.orderId} • {ord.items?.length || 0} Items {ord.customerName ? `• Guest: ${ord.customerName}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-bold text-base text-aura-ivory mr-2">
                            ₹{(ord.total || 0).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => setViewBillOrder(ord)}
                            className="px-2.5 py-1 bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] border border-[#38BDF8]/40 font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* COMPLETED ORDERS DRILL-DOWN */}
            {activeDetailModal === 'COMPLETED' && (
              <div className="space-y-4 text-xs">
                <p className="text-aura-slate">History of settled bills and invoices processed today (MongoDB Database):</p>
                {isLoadingRealOrders ? (
                  <div className="py-8 text-center text-aura-slate font-mono">Fetching settled orders from MongoDB...</div>
                ) : realSettledOrders.length === 0 ? (
                  <div className="py-12 text-center bg-aura-obsidian border border-aura-border rounded-2xl space-y-2 font-mono">
                    <Receipt className="w-8 h-8 text-[#38BDF8] mx-auto" />
                    <p className="font-bold text-aura-ivory text-sm">No Settled Bills Recorded Yet Today</p>
                    <p className="text-aura-slate text-xs">Settled orders from Cashier POS will automatically appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto luxury-scrollbar-x pb-2">
                    <table className="w-full text-left font-mono min-w-[620px]">
                      <thead className="bg-aura-obsidian text-aura-slate uppercase text-[10px] border-b border-aura-border">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Table</th>
                          <th className="py-2.5 px-3">Payment</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-aura-border/40">
                        {realSettledOrders.map((ord) => (
                          <tr key={ord._id || ord.orderId}>
                            <td className="py-3 px-3 text-[#38BDF8] font-bold">{ord.invoiceNumber || ord.orderId}</td>
                            <td className="py-3 px-3">Table {ord.tableId}</td>
                            <td className="py-3 px-3 text-aura-slate">{ord.paymentMethod || 'UPI/Card'}</td>
                            <td className="py-3 px-3">
                              <span className={`font-bold block ${ord.refundAmount && ord.refundAmount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                                ₹{((ord.netAmount !== undefined ? ord.netAmount : Math.max(0, (ord.total || 0) - (ord.refundAmount || 0)))).toLocaleString('en-IN')}
                              </span>
                              {ord.refundAmount !== undefined && ord.refundAmount > 0 && (
                                <span className="text-[9px] text-rose-400 block font-mono">
                                  Ref: -₹{ord.refundAmount.toLocaleString('en-IN')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {ord.refundAmount && ord.refundAmount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                                  PARTIAL REFUND
                                </span>
                              ) : (
                                <StatusBadge status="SETTLED" />
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setViewBillOrder(ord)}
                                  className="px-2.5 py-1 bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] border border-[#38BDF8]/40 font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Bill</span>
                                </button>
                                <button
                                  onClick={() => handleAdminRefundOrder(ord)}
                                  className={`px-2.5 py-1 border font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                                    ord.refundAmount && ord.refundAmount > 0
                                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                                  }`}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{ord.refundAmount && ord.refundAmount > 0 ? 'Refund More' : 'Refund'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* RESERVATIONS DRILL-DOWN */}
            {activeDetailModal === 'RESERVATIONS' && (
              <div className="space-y-4 text-xs">
                <p className="text-aura-slate">Scheduled table reservations and VIP guest bookings today:</p>
                <div className="space-y-3 font-mono">
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#38BDF8] text-sm">Baron Rothschild</h4>
                      <span className="text-aura-slate text-[11px]">Party of 4 • VIP Terrace Table 1</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-300 block">8:00 PM Today</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CONFIRMED</span>
                    </div>
                  </div>

                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#38BDF8] text-sm">Dr. Ananya Sharma</h4>
                      <span className="text-aura-slate text-[11px]">Party of 2 • Main Dining Table 8</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-300 block">8:30 PM Today</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">SEATED</span>
                    </div>
                  </div>

                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#38BDF8] text-sm">Vikramaditya Singh</h4>
                      <span className="text-aura-slate text-[11px]">Party of 6 • Private Dining Suite</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-300 block">9:15 PM Today</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CONFIRMED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REFUNDS DRILL-DOWN */}
            {activeDetailModal === 'REFUNDS' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl">
                    <span className="text-[10px] text-aura-slate uppercase font-bold block">Refund Rate</span>
                    <span className="font-serif font-bold text-xl text-rose-400">{liveRefundRate}%</span>
                  </div>
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl">
                    <span className="text-[10px] text-aura-slate uppercase font-bold block">Refunded Bills</span>
                    <span className="font-serif font-bold text-xl text-[#38BDF8]">{realRefundedOrders.length} Orders</span>
                  </div>
                  <div className="p-4 bg-aura-obsidian border border-aura-border rounded-2xl">
                    <span className="text-[10px] text-aura-slate uppercase font-bold block">Total Refunded Amount</span>
                    <span className="font-serif font-bold text-xl text-emerald-400">₹{totalRefundedSum.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-aura-slate">Live refund audit log stream and voided bills from MongoDB:</p>

                {isLoadingRealOrders ? (
                  <div className="py-8 text-center text-aura-slate font-mono">Fetching refund logs from MongoDB...</div>
                ) : realRefundedOrders.length === 0 ? (
                  <div className="py-12 text-center bg-aura-obsidian border border-aura-border rounded-2xl space-y-2 font-mono">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-aura-ivory text-sm">Clean Audit: 0 Refunded Bills</p>
                    <p className="text-aura-slate text-xs">No orders have been voided or refunded today.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto luxury-scrollbar-x pb-2">
                    <table className="w-full text-left font-mono min-w-[650px]">
                      <thead className="bg-aura-obsidian text-aura-slate uppercase text-[10px] border-b border-aura-border">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Table</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Refunded</th>
                          <th className="py-2.5 px-3">Net Retained</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-aura-border/40">
                        {realRefundedOrders.map((ord) => (
                          <tr key={ord._id || ord.orderId}>
                            <td className="py-3 px-3 text-rose-400 font-bold">{ord.invoiceNumber || ord.orderId}</td>
                            <td className="py-3 px-3">Table {ord.tableId}</td>
                            <td className="py-3 px-3 text-aura-slate text-[11px] max-w-[200px] truncate" title={ord.refundReason}>
                              {ord.refundReason || 'Customer Request'}
                            </td>
                            <td className="py-3 px-3 font-bold text-rose-400">
                              -₹{(ord.refundAmount || ord.total || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-400">
                              ₹{(ord.netAmount !== undefined ? ord.netAmount : Math.max(0, (ord.total || 0) - (ord.refundAmount || 0))).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3">
                              {ord.paymentStatus === 'PARTIALLY_REFUNDED' ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                                  PARTIAL REFUND
                                </span>
                              ) : (
                                <StatusBadge status="REFUNDED" />
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setViewBillOrder(ord)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ITEMIZATION / PRINTABLE GST INVOICE MODAL */}
      {viewBillOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewBillOrder(null); }}
        >
          <div className="printable-invoice bg-white text-gray-900 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5 relative font-mono text-xs">
            <button
              onClick={() => setViewBillOrder(null)}
              className="no-print absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Restaurant Brand Header */}
            <div className="text-center space-y-1 border-b border-gray-200 pb-4">
              <div className="flex justify-center items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif font-black text-xl text-gray-900 tracking-wider">SILIGURI'S CHAI ADDAA</h2>
              </div>
              <p className="text-[10px] text-gray-500 font-sans">Artisan Tea House &amp; Comfort Dining</p>
              <p className="text-[9px] text-gray-400">Sevoke Road, Siliguri • FSSAI: 11521001000456</p>
            </div>

            {/* Invoice Meta */}
            <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Invoice #:</span>
                <span className="font-bold">{viewBillOrder.invoiceNumber || viewBillOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Table Number:</span>
                <span className="font-bold">Table {viewBillOrder.tableId}</span>
              </div>
              {viewBillOrder.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Guest Name:</span>
                  <span className="font-bold">{viewBillOrder.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-emerald-700 uppercase">{viewBillOrder.paymentStatus || viewBillOrder.status}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-300 pb-1">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>

              {(viewBillOrder.items || []).map((it: any, i: number) => (
                <div key={i} className="grid grid-cols-12 text-xs py-1 border-b border-gray-100">
                  <span className="col-span-6 font-medium text-gray-800">{it.name}</span>
                  <span className="col-span-2 text-center text-gray-500">{it.quantity || it.qty || 1}</span>
                  <span className="col-span-4 text-right font-bold text-gray-900">
                    ₹{((it.quantity || it.qty || 1) * (it.price || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Tax Breakdown */}
            <div className="space-y-1 pt-2 border-t border-gray-300 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{(viewBillOrder.subtotal || viewBillOrder.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (2.5%)</span>
                <span>₹{(viewBillOrder.tax ? viewBillOrder.tax / 2 : 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (2.5%)</span>
                <span>₹{(viewBillOrder.tax ? viewBillOrder.tax / 2 : 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                <span>GRAND TOTAL</span>
                <span className={viewBillOrder.paymentStatus === 'REFUNDED' ? 'line-through text-gray-400' : ''}>
                  ₹{(viewBillOrder.total || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Refund Details if applicable */}
              {viewBillOrder.refundAmount !== undefined && viewBillOrder.refundAmount > 0 && (
                <div className="pt-2 border-t border-dashed border-gray-300 space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs text-rose-600 font-bold font-mono">
                    <span>{viewBillOrder.paymentStatus === 'REFUNDED' ? 'Full Refund Void:' : 'Partial Refund Deduction:'}</span>
                    <span>- ₹{viewBillOrder.refundAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {viewBillOrder.refundReason && (
                    <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                      Audit Reason: <strong>{viewBillOrder.refundReason}</strong>
                    </p>
                  )}
                  {viewBillOrder.paymentStatus !== 'REFUNDED' && (
                    <div className="flex justify-between text-xs font-black text-emerald-800 pt-1 border-t border-gray-200 font-mono">
                      <span>NET AMOUNT SETTLED:</span>
                      <span>₹{(viewBillOrder.netAmount !== undefined ? viewBillOrder.netAmount : Math.max(0, (viewBillOrder.total || 0) - viewBillOrder.refundAmount)).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stamp & Footer */}
            <div className="pt-2 text-center space-y-2">
              {viewBillOrder.paymentStatus === 'REFUNDED' ? (
                <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-[10px] uppercase border border-rose-300 tracking-wider">
                  INVOICE VOIDED &amp; FULLY REFUNDED
                </div>
              ) : viewBillOrder.refundAmount && viewBillOrder.refundAmount > 0 ? (
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[10px] uppercase border border-amber-300 tracking-wider">
                  PARTIALLY REFUNDED &amp; NET SETTLED
                </div>
              ) : (
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] uppercase border border-emerald-300 tracking-wider">
                  PAID IN FULL: AUDIT VERIFIED
                </div>
              )}

              <div className="no-print flex space-x-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setViewBillOrder(null)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
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
          fetchMetricsAndOrders(true);
        }}
      />

      {/* Table QR Stand Cards Modal */}
      <TableQrStandsModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tables={allTables}
        onRefreshTables={fetchAllTables}
      />
    </div>
  );
};

export default AdminDashboardPage;
