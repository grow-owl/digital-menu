import User from '../models/User.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get dashboard metrics (dishes, users, staff, orders, revenue, profit)
// @route   GET /api/admin/metrics
// @access  Private / Staff
export const getMetrics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: { $in: ['customer', 'CUSTOMER'] } });
  const totalStaff = await User.countDocuments({ role: { $nin: ['customer', 'CUSTOMER'] } });
  const totalDishes = await MenuItem.countDocuments();

  const ongoingOrdersCount = await Order.countDocuments({
    status: { $in: ['received', 'preparing', 'ready'] },
    paymentStatus: { $ne: 'PAID' }
  });

  const completedOrdersCount = await Order.countDocuments({
    $or: [{ status: 'completed' }, { paymentStatus: 'PAID' }]
  });

  const revenueResult = await Order.aggregate([
    { $match: { $or: [{ status: 'completed' }, { paymentStatus: 'PAID' }] } },
    { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
  const totalProfit = totalRevenue * 0.35; // 35% gross profit margin

  res.json({
    data: {
      users: totalUsers,
      staff: totalStaff,
      dishes: totalDishes,
      ongoingOrders: ongoingOrdersCount,
      completedOrders: completedOrdersCount,
      revenue: totalRevenue,
      profit: totalProfit
    }
  });
});

// @desc    Get high-level analytics summary
// @route   GET /api/admin/analytics
// @access  Private / Staff
export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settledToday = await Order.find({
    $or: [{ status: 'completed' }, { paymentStatus: 'PAID' }],
    createdAt: { $gte: today }
  });

  const totalRevenueToday = settledToday.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersToday = await Order.countDocuments({ createdAt: { $gte: today } });
  const activeTablesCount = await Table.countDocuments({ status: { $in: ['occupied', 'billing'] } });
  const vacantTablesCount = await Table.countDocuments({ status: 'available' });
  const pendingKitchenTicketsCount = await Order.countDocuments({
    status: { $in: ['received', 'preparing'] },
    paymentStatus: { $ne: 'PAID' }
  });

  res.json({
    data: {
      totalRevenueToday,
      totalOrdersToday,
      activeTablesCount,
      vacantTablesCount,
      pendingKitchenTicketsCount
    }
  });
});


// @desc    Executive analytics for Owner & CEO Suite
// @route   GET /api/admin/executive-analytics
// @access  Private / Staff
export const getExecutiveAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [allOrders, totalOrdersCount] = await Promise.all([
    Order.find({ createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).limit(1000),
    Order.countDocuments()
  ]);
  const settledOrders = allOrders.filter(o => 
    (o.status === 'completed' || o.paymentStatus === 'PAID' || o.paymentStatus === 'PARTIALLY_REFUNDED') && 
    o.paymentStatus !== 'REFUNDED'
  );
  const ongoingOrders = allOrders.filter(o => ['received', 'preparing', 'ready'].includes(o.status) && o.paymentStatus !== 'PAID' && o.paymentStatus !== 'PARTIALLY_REFUNDED');

  const todaySales = settledOrders.reduce((sum, o) => sum + Math.max(0, (o.total || 0) - (o.refundAmount || 0)), 0);
  const aov = settledOrders.length > 0 ? Math.round(todaySales / settledOrders.length) : (totalOrdersCount > 0 ? Math.round(todaySales / totalOrdersCount) : 0);

  const allTables = await Table.find({});
  const totalTables = allTables.length || 30;
  const occupiedTables = allTables.filter(t => t.status === 'occupied' || t.status === 'billing').length;

  let totalTurnoverMins = 0;
  let completedCountWithDuration = 0;
  settledOrders.forEach(o => {
    const start = new Date(o.createdAt).getTime();
    const end = o.paidAt ? new Date(o.paidAt).getTime() : new Date(o.updatedAt).getTime();
    if (end > start) {
      const diffMins = Math.round((end - start) / (1000 * 60));
      if (diffMins > 2 && diffMins < 300) {
        totalTurnoverMins += diffMins;
        completedCountWithDuration++;
      }
    }
  });
  const tableTurnoverMins = completedCountWithDuration > 0 ? Math.round(totalTurnoverMins / completedCountWithDuration) : 42;

  const hourSlots = Array.from({ length: 24 }, (_, i) => {
    const hourLabel = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`;
    return { hour: hourLabel, hNum: i };
  });

  const hourlyMap = {};
  hourSlots.forEach(s => {
    hourlyMap[s.hNum] = { hour: s.hour, sales: 0, orders: 0 };
  });

  settledOrders.forEach(o => {
    const orderDate = new Date(o.createdAt);
    const h = orderDate.getHours();
    if (hourlyMap[h]) {
      hourlyMap[h].sales += Math.max(0, (o.total || 0) - (o.refundAmount || 0));
      hourlyMap[h].orders += 1;
    }
  });

  const maxSales = Math.max(...Object.values(hourlyMap).map(m => m.sales), 1);
  const hourlyHeatmap = hourSlots.map(s => {
    const item = hourlyMap[s.hNum];
    return {
      hour: item.hour,
      sales: item.sales,
      orders: item.orders,
      peak: item.sales >= maxSales * 0.7 && item.sales > 0
    };
  });

  const dishAggregation = {};
  settledOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(it => {
        const name = it.name || 'Artisanal Dish';
        if (!dishAggregation[name]) {
          dishAggregation[name] = { name, orders: 0, revenue: 0 };
        }
        dishAggregation[name].orders += (it.quantity || 1);
        dishAggregation[name].revenue += ((it.price || 0) * (it.quantity || 1));
      });
    }
  });

  const topDishes = Object.values(dishAggregation)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((d, idx) => ({
      rank: `#${idx + 1}`,
      name: d.name,
      orders: d.orders,
      revenue: d.revenue,
      margin: '74% Margin'
    }));

  const categories = await Category.find({});
  const allMenuItems = await MenuItem.find({});

  const itemToCategoryMap = {};
  allMenuItems.forEach(m => {
    itemToCategoryMap[m.name.toLowerCase().trim()] = m.categoryId;
    itemToCategoryMap[m.id] = m.categoryId;
  });

  const categoryMap = {};
  categories.forEach(c => {
    categoryMap[c.id] = { name: c.name, revenue: 0 };
  });

  settledOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(it => {
        const cleanName = (it.name || '').toLowerCase().trim();
        let catId = itemToCategoryMap[cleanName] || itemToCategoryMap[it.menuItemId];
        if (!catId) {
          if (cleanName.includes('pizza')) catId = 8;
          else if (cleanName.includes('cake') || cleanName.includes('dessert')) catId = 16;
          else if (cleanName.includes('naan') || cleanName.includes('roti')) catId = 6;
          else catId = 1;
        }

        if (categoryMap[catId]) {
          categoryMap[catId].revenue += ((it.price || 0) * (it.quantity || 1));
        }
      });
    }
  });

  const categoryBreakdownList = Object.values(categoryMap)
    .filter(c => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalCatRevenue = categoryBreakdownList.reduce((sum, c) => sum + c.revenue, 0) || 1;
  const categoryBreakdown = categoryBreakdownList.map(c => ({
    name: c.name,
    revenue: c.revenue,
    pct: Math.round((c.revenue / totalCatRevenue) * 100)
  }));

  res.json({
    success: true,
    data: {
      todaySales,
      totalOrders: totalOrdersCount,
      completedOrders: settledOrders.length,
      ongoingOrders: ongoingOrders.length,
      aov,
      totalTables,
      occupiedTables,
      tableTurnoverMins,
      hourlyHeatmap,
      topDishes,
      categoryBreakdown
    }
  });
});
