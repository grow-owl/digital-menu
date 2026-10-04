import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import TableSession from '../models/TableSession.js';
import Table from '../models/Table.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// In-memory migration flags — prevents repeated full-collection scans per process lifetime
let _orderIdsMigrated = false;
let _invoiceNumbersMigrated = false;

// Chronological sequential order ID generator: ORD-1, ORD-2, ORD-3...
export const getNextOrderId = async () => {
  const orders = await Order.find({ orderId: { $exists: true, $ne: null } })
    .select('orderId createdAt');

  let maxSeq = 0;
  for (const ord of orders) {
    if (ord.orderId) {
      const match = ord.orderId.match(/^ORD-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  }

  if (maxSeq === 0 && orders.length > 0) {
    maxSeq = orders.length;
  }

  let candidate = `ORD-${maxSeq + 1}`;
  let attempt = 1;
  while (await Order.exists({ orderId: candidate })) {
    maxSeq++;
    candidate = `ORD-${maxSeq + 1}`;
    attempt++;
    if (attempt > 100) break;
  }

  return candidate;
};

// Backward-compatible fallback
export const generateOrderId = () => 'ORD-1';

// Auto-migrate legacy random hex order IDs (e.g. ORD-E7E98D) to chronological sequential numbers (ORD-1, ORD-2...)
// Guarded by an in-memory flag so the full-collection scan only runs ONCE per process, not on every request.
export const normalizeOrderIds = async () => {
  if (_orderIdsMigrated) return; // Already ran this process — skip full scan
  try {
    const allOrders = await Order.find().sort({ createdAt: 1 });
    if (!allOrders || allOrders.length === 0) { _orderIdsMigrated = true; return; }

    const hasLegacyHex = allOrders.some(o => o.orderId && !/^ORD-\d+$/i.test(o.orderId));
    if (hasLegacyHex) {
      const sorted = [...allOrders].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      let seq = 1;
      for (const ord of sorted) {
        ord.orderId = `ORD-${seq++}`;
        await ord.save();
      }
      console.log(`[Order ID Migration] Successfully migrated ${sorted.length} legacy order IDs to sequential ORD-1..ORD-${seq - 1}`);
    }
    _orderIdsMigrated = true; // Mark done for this process lifetime
  } catch (err) {
    console.warn('[Order ID Migration] Warning during order ID migration:', err.message);
  }
};

// Chronological sequential invoice number generator: INV-1, INV-2, INV-3...
export const getNextInvoiceNumber = async () => {
  const orders = await Order.find({ invoiceNumber: { $exists: true, $ne: null } })
    .select('invoiceNumber createdAt paidAt');

  let maxSeq = 0;
  for (const ord of orders) {
    if (ord.invoiceNumber) {
      const match = ord.invoiceNumber.match(/^INV-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  }

  if (maxSeq === 0 && orders.length > 0) {
    const distinctInvoices = new Set(orders.map(o => o.invoiceNumber).filter(Boolean));
    maxSeq = distinctInvoices.size;
  }

  return `INV-${maxSeq + 1}`;
};

// Backward-compatible fallback
export const generateInvoiceNumber = () => 'INV-1';

// Auto-migrate legacy random hex invoices (e.g. INV-9BBAAF) to chronological sequential numbers (INV-1, INV-2...)
// Guarded by an in-memory flag so the full-collection scan only runs ONCE per process, not on every request.
export const normalizeInvoiceNumbers = async () => {
  if (_invoiceNumbersMigrated) return; // Already ran this process — skip full scan
  try {
    const paidOrders = await Order.find({
      $or: [
        { paymentStatus: 'PAID' },
        { invoiceNumber: { $exists: true, $ne: null } }
      ]
    }).sort({ paidAt: 1, createdAt: 1 });

    if (!paidOrders || paidOrders.length === 0) return;

    // Check if any order still has the old random hex format (not INV-digits)
    const hasLegacyHex = paidOrders.some(o => o.invoiceNumber && !/^INV-\d+$/i.test(o.invoiceNumber));

    if (hasLegacyHex) {
      // Group by existing legacy invoiceNumber to keep table order tickets grouped under the same invoice
      const billGroups = new Map();
      for (const ord of paidOrders) {
        const key = ord.invoiceNumber || `temp_${ord._id}`;
        if (!billGroups.has(key)) {
          billGroups.set(key, []);
        }
        billGroups.get(key).push(ord);
      }

      // Sort bill groups chronologically by earliest paidAt/createdAt
      const sortedKeys = Array.from(billGroups.keys()).sort((a, b) => {
        const aFirst = billGroups.get(a)[0];
        const bFirst = billGroups.get(b)[0];
        const aTime = new Date(aFirst.paidAt || aFirst.createdAt || 0).getTime();
        const bTime = new Date(bFirst.paidAt || bFirst.createdAt || 0).getTime();
        return aTime - bTime;
      });

      let seq = 1;
      for (const key of sortedKeys) {
        const newInvoiceNum = `INV-${seq++}`;
        const groupOrders = billGroups.get(key);
        for (const ord of groupOrders) {
          ord.invoiceNumber = newInvoiceNum;
          await ord.save();
        }
      }
      console.log(`[Invoice Migration] Successfully migrated ${sortedKeys.length} legacy invoices to sequential INV-1..INV-${seq - 1}`);
    }
    _invoiceNumbersMigrated = true; // Mark done for this process lifetime
  } catch (err) {
    console.warn('[Invoice Migration] Warning during invoice migration:', err.message);
  }
  _invoiceNumbersMigrated = true;
};

// @desc    DEV UTILITY: Purge all orders & reset table statuses
// @route   POST /api/orders/dev/purge-all
// @access  Dev / Protected (Admin only or secret in development)
export const purgeAllOrders = asyncHandler(async (req, res) => {
  const devSecret = req.headers['x-dev-secret'] || req.query.secret;
  const isAuthorizedDev = process.env.DEV_SECRET && devSecret === process.env.DEV_SECRET;
  const isAdmin = req.user && ['admin', 'owner'].includes(req.user.role);

  if (process.env.NODE_ENV === 'production' && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Purge utility is disabled in production.'
    });
  }

  if (!isAdmin && !isAuthorizedDev) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: valid DEV_SECRET or Admin role required.'
    });
  }

  const deletedOrders = await Order.deleteMany({});
  const deletedSessions = await TableSession.deleteMany({});
  const updatedTables = await Table.updateMany({}, { $set: { status: 'available', guestCount: 0 } });
  
  res.json({
    success: true,
    message: `Database purged! Deleted ${deletedOrders.deletedCount} orders, ${deletedSessions.deletedCount} sessions. Reset ${updatedTables.modifiedCount} tables to AVAILABLE.`,
    data: {
      deletedOrders: deletedOrders.deletedCount,
      deletedSessions: deletedSessions.deletedCount,
      resetTables: updatedTables.modifiedCount
    }
  });
});

// @desc    Create / Append table order
// @route   POST /api/orders
// @access  Public
export const createOrder = asyncHandler(async (req, res) => {
  const { 
    tableId, 
    customerPhone, 
    customerName, 
    items, 
    subtotal, 
    tax, 
    discount, 
    total, 
    sessionId
  } = req.body;
  
  if (!customerPhone || typeof customerPhone !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'A valid 10-digit mobile number is required to place your order and track live kitchen preparation.' 
    });
  }

  const cleanCustomerPhone = customerPhone.replace(/\D/g, '').slice(-10);
  if (cleanCustomerPhone.length !== 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide a valid 10-digit mobile number (e.g. 9876543210).' 
    });
  }

  let customerUser = await User.findOne({ 
    $or: [{ phone: cleanCustomerPhone }, { phone: `+91${cleanCustomerPhone}` }] 
  });

  if (!customerUser) {
    const guestName = (customerName && typeof customerName === 'string' && customerName.trim()) 
      ? customerName.trim() 
      : `Diner-${cleanCustomerPhone.slice(-4)}`;

    customerUser = await User.create({
      name: guestName,
      phone: cleanCustomerPhone,
      password: 'aura@' + cleanCustomerPhone,
      role: 'customer',
      status: 'Standard'
    }).catch(err => {
      console.warn('Customer auto-create warning:', err.message);
    });
  } else if (customerName && typeof customerName === 'string' && customerName.trim() && customerUser.name && customerUser.name.startsWith('Diner-')) {
    customerUser.name = customerName.trim();
    await customerUser.save().catch(e => console.warn('Name update warn:', e.message));
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one dish item.' });
  }

  const itemIds = items.map(it => it.menuItemId || it.id).filter(Boolean);
  const dbMenuItems = await MenuItem.find({
    $or: [
      { id: { $in: itemIds.map(Number).filter(n => !isNaN(n)) } },
      { _id: { $in: itemIds.filter(id => mongoose.isValidObjectId(id)) } }
    ]
  });
  const dbMenuMap = new Map();
  dbMenuItems.forEach(item => {
    dbMenuMap.set(String(item.id), item);
    dbMenuMap.set(String(item._id), item);
  });

  // Daily availability guard: block 86'd / unavailable dishes
  for (const it of items) {
    const targetId = String(it.menuItemId || it.id || '');
    const dbItem = dbMenuMap.get(targetId);
    if (dbItem && dbItem.isAvailable === false) {
      return res.status(400).json({
        success: false,
        message: `"${dbItem.name}" is currently sold out and not available today. Please remove it from your order.`
      });
    }
  }

  let verifiedSubtotal = 0;
  const verifiedNewItems = items.map(it => {
    const targetId = String(it.menuItemId || it.id || '');
    const dbItem = dbMenuMap.get(targetId);
    const quantity = Math.max(1, parseInt(it.quantity || it.qty || 1, 10));
    const price = dbItem ? dbItem.price : Math.max(0, parseFloat(it.price || it.unitPrice || 0));
    verifiedSubtotal += price * quantity;

    return {
      menuItemId: dbItem ? dbItem.id : (parseInt(it.menuItemId || it.id, 10) || 101),
      name: dbItem ? dbItem.name : String(it.name || 'Artisanal Dish').slice(0, 100),
      quantity,
      price,
      notes: String(it.notes || '').slice(0, 200),
      customizations: Array.isArray(it.customizations) ? it.customizations : [],
      status: 'preparing',
      isPrepared: false,
      preparationTimeMinutes: dbItem?.preparationTimeMinutes || it.preparationTimeMinutes || 5
    };
  });

  const computedTax = Math.round(verifiedSubtotal * 0.05 * 100) / 100;
  const calculatedTotal = Math.max(0, Math.round((verifiedSubtotal + computedTax) * 100) / 100);

  const clientQrToken = req.body.qrToken;
  let physicalTable = null;

  if (clientQrToken) {
    physicalTable = await Table.findOne({ qrToken: clientQrToken });
  }

  if (!physicalTable && sessionId) {
    const activeSess = await TableSession.findOne({ sessionId }).populate('tableId');
    if (activeSess && activeSess.tableId) {
      physicalTable = activeSess.tableId;
    }
  }

  if (!physicalTable) {
    const cleanTableNum = String(tableId || '1').match(/\d+/)?.[0] || '1';
    const isObjectId = String(tableId).match(/^[0-9a-fA-F]{24}$/);
    physicalTable = await Table.findOne({
      $or: [{ tableNumber: cleanTableNum }, { _id: isObjectId ? tableId : null }]
    });
  }

  const cleanTableNum = String(tableId || '1').match(/\d+/)?.[0] || '1';
  const queryTableId = physicalTable ? String(physicalTable.tableNumber) : cleanTableNum;

  // Always create a fresh independent kitchen order ticket so each order round cooks from 00:00
  // Retry up to 5 times to handle race condition where concurrent requests generate the same orderId
  await normalizeOrderIds();
  let order;
  for (let attempt = 0; attempt < 5; attempt++) {
    const newOrderId = await getNextOrderId();
    try {
      order = await Order.create({
        orderId: newOrderId,
        tableId: queryTableId,
        customerPhone: cleanCustomerPhone,
        customerName: customerName || (customerUser ? customerUser.name : `Diner-${cleanCustomerPhone.slice(-4)}`),
        items: verifiedNewItems,
        subtotal: verifiedSubtotal,
        tax: computedTax,
        total: calculatedTotal,
        status: 'preparing',
        createdAt: new Date()
      });
      break; // success
    } catch (err) {
      if (err.code === 11000 && attempt < 4) {
        // Duplicate key — another concurrent request grabbed the same orderId; retry
        continue;
      }
      throw err;
    }
  }

  if (physicalTable) {
    physicalTable.status = 'occupied';
    
    let session = await TableSession.findOne({ tableId: physicalTable._id, status: 'active' });
    if (!session) {
      session = await TableSession.create({
        tableId: physicalTable._id,
        sessionId: `SESS-${Date.now().toString().slice(-6)}`,
        status: 'active',
        orders: [order._id],
        activeCart: []
      });
    } else {
      session.activeCart = [];
      if (!session.orders.includes(order._id)) {
        session.orders.push(order._id);
      }
      await session.save();
    }
    await physicalTable.save();
  }

  res.status(201).json({ data: order });
});

// @desc    Get orders by customer phone number
// @route   GET /api/orders/phone/:phone
// @access  Public
export const getOrdersByPhone = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerPhone: req.params.phone }).sort({ createdAt: -1 });
  res.json({ data: orders });
});

// Flexible Order ID / Mongo ID query builder supporting ORD-1, #ORD-1, 1, ord-1, or ObjectId
export const buildOrderIdQuery = (rawId) => {
  const target = String(rawId || '').trim();
  const cleanId = target.replace(/^#/, '').trim();
  const numOnly = cleanId.replace(/^ORD-/i, '').trim();
  const isValidObjId = /^[0-9a-fA-F]{24}$/.test(target);
  
  const queryConditions = [
    { orderId: target },
    { orderId: cleanId },
    { orderId: `ORD-${cleanId}` },
    { orderId: `ORD-${numOnly}` },
    { orderId: new RegExp(`^${cleanId}$`, 'i') },
    { orderId: new RegExp(`^ORD-${numOnly}$`, 'i') }
  ];

  if (isValidObjId) {
    queryConditions.push({ _id: target });
  }

  return { $or: queryConditions };
};

// Helper to automatically transition orders to 'ready' when kitchen preparation time completes
const autoUpdateOrdersToReady = async (orders) => {
  if (!orders || !orders.length) return;
  const now = Date.now();
  for (const order of orders) {
    if (order && ['received', 'preparing'].includes(order.status)) {
      const elapsedSecs = Math.floor((now - new Date(order.createdAt).getTime()) / 1000);
      const activeItems = (order.items || []).filter(it => it.status !== 'cancelled');
      if (activeItems.length > 0) {
        const allDone = activeItems.every(it => {
          const cookSecs = (it.preparationTimeMinutes || 4) * 60;
          return it.status === 'ready' || it.status === 'served' || it.isPrepared || elapsedSecs >= cookSecs;
        });
        if (allDone) {
          order.status = 'ready';
          activeItems.forEach(it => {
            if (it.status !== 'served') {
              it.status = 'ready';
              it.isPrepared = true;
            }
          });
          await order.save().catch(e => console.warn('Auto-ready transition save warn:', e.message));
        }
      }
    }
  }
};

// @desc    Get orders for specific table
// @route   GET /api/orders/table/:tableId
// @access  Public
export const getOrdersByTable = asyncHandler(async (req, res) => {
  await normalizeOrderIds();
  const { includeCompleted } = req.query;
  const filter = { tableId: String(req.params.tableId) };
  
  if (includeCompleted !== 'true') {
    filter.status = { $in: ['received', 'preparing', 'ready', 'served'] };
    filter.paymentStatus = { $ne: 'PAID' };
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  await autoUpdateOrdersToReady(orders);
  res.json({ data: orders });
});

// @desc    Get active unpaid orders (Kitchen / POS)
// @route   GET /api/orders/active, GET /api/orders/active/all
// @access  Public / Staff
export const getActiveOrders = asyncHandler(async (req, res) => {
  await normalizeOrderIds();
  await normalizeInvoiceNumbers();
  const activeOrders = await Order.find({
    status: { $in: ['received', 'preparing', 'ready', 'served'] },
    paymentStatus: { $ne: 'PAID' }
  }).sort({ createdAt: 1 });
  await autoUpdateOrdersToReady(activeOrders);

  if (req.query.includeCompleted === 'true') {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const completedOrders = await Order.find({
      $or: [
        { status: { $in: ['ready', 'served', 'completed'] } },
        { paymentStatus: 'PAID' }
      ],
      createdAt: { $gte: sixHoursAgo }
    })
      .sort({ createdAt: -1 })
      .limit(9);

    return res.json({ data: activeOrders, completed: completedOrders });
  }

  res.json({ data: activeOrders });
});

// @desc    Get all settled orders (History / POS) with pagination
// @route   GET /api/orders/settled/all
// @access  Public / Staff
export const getSettledOrders = asyncHandler(async (req, res) => {
  await normalizeOrderIds();
  await normalizeInvoiceNumbers();

  const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : null;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 10;
  const search = req.query.search ? String(req.query.search).trim() : '';
  const method = req.query.method ? String(req.query.method).trim().toUpperCase() : '';

  // Escape special regex characters to prevent ReDoS from user-controlled input
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const filter = { paymentStatus: 'PAID' };

  if (method && method !== 'ALL') {
    filter.paymentMethod = new RegExp(escapeRegex(method), 'i');
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { invoiceNumber: new RegExp(safeSearch, 'i') },
      { orderId: new RegExp(safeSearch, 'i') },
      { customerName: new RegExp(safeSearch, 'i') },
      { customerPhone: new RegExp(safeSearch, 'i') }
    ];
  }

  const totalCount = await Order.countDocuments(filter);

  let query = Order.find(filter).sort({ paidAt: -1, updatedAt: -1 });

  if (page && page > 0) {
    query = query.skip((page - 1) * limit).limit(limit);
  }

  const settledOrders = await query;

  res.json({
    success: true,
    data: settledOrders,
    pagination: {
      currentPage: page || 1,
      totalPages: page ? Math.max(1, Math.ceil(totalCount / limit)) : 1,
      totalCount,
      limit
    }
  });
});

// @desc    Refund an order (Full or Partial)
// @route   POST /api/orders/:orderId/refund
// @access  Private / Staff / Owner
export const refundOrder = asyncHandler(async (req, res) => {
  const { amount, reason, refundedBy, refundType, refundedItems, refundMethod } = req.body;
  const targetOrderId = req.params.orderId;
  const isValidObjId = targetOrderId.match(/^[0-9a-fA-F]{24}$/);

  const order = await Order.findOne({
    $or: [{ orderId: targetOrderId }, { _id: isValidObjId ? targetOrderId : null }]
  });

  if (!order) return res.status(404).json({ message: 'Order not found' });

  const currentRefunded = Number(order.refundAmount || 0);
  const maxRefundable = Math.max(0, Math.round(((order.total || 0) - currentRefunded) * 100) / 100);

  if (maxRefundable <= 0) {
    return res.status(400).json({ message: 'This invoice has already been 100% refunded.' });
  }

  if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount) || amount <= 0)) {
    return res.status(400).json({ success: false, message: 'Refund amount must be a positive number greater than 0.' });
  }

  let requestedAmount;
  if (typeof amount === 'number' && amount > 0) {
    requestedAmount = Math.min(amount, maxRefundable);
  } else {
    requestedAmount = maxRefundable;
  }
  requestedAmount = Math.round(requestedAmount * 100) / 100;

  const newTotalRefunded = Math.round((currentRefunded + requestedAmount) * 100) / 100;
  const isFullRefund = newTotalRefunded >= order.total;
  const effectiveType = isFullRefund ? 'FULL' : (refundType || 'PARTIAL');

  order.refundAmount = newTotalRefunded;
  order.refundType = effectiveType;
  order.refundReason = reason || (isFullRefund ? 'Full Bill Refund' : 'Partial / Item Refund');
  order.refundedAt = new Date();
  order.refundedBy = refundedBy || 'Admin / Manager';
  order.netAmount = Math.max(0, Math.round((order.total - newTotalRefunded) * 100) / 100);

  if (Array.isArray(refundedItems) && refundedItems.length > 0) {
    order.refundItems = refundedItems;
  }

  if (isFullRefund) {
    order.paymentStatus = 'REFUNDED';
    order.status = 'cancelled';
  } else {
    order.paymentStatus = 'PARTIALLY_REFUNDED';
    if (!['completed', 'served'].includes(order.status)) {
      order.status = 'completed';
    }
  }

  if (!Array.isArray(order.refundHistory)) {
    order.refundHistory = [];
  }

  order.refundHistory.push({
    amount: requestedAmount,
    reason: reason || (isFullRefund ? 'Full Bill Refund' : 'Partial / Item Refund'),
    refundedBy: refundedBy || 'Admin / Manager',
    refundedAt: new Date(),
    items: refundedItems || [],
    refundMethod: refundMethod || order.paymentMethod || 'ORIGINAL'
  });

  await order.save();

  res.json({
    success: true,
    data: order,
    message: isFullRefund
      ? `Invoice #${order.invoiceNumber || order.orderId} fully refunded (₹${requestedAmount.toLocaleString('en-IN')})`
      : `Partial refund of ₹${requestedAmount.toLocaleString('en-IN')} issued for Invoice #${order.invoiceNumber || order.orderId}. Net Retained: ₹${order.netAmount.toLocaleString('en-IN')}`
  });
});

// @desc    Get all refunded and partially refunded orders
// @route   GET /api/orders/refunds/all
// @access  Public / Staff
export const getRefunds = asyncHandler(async (req, res) => {
  const refundedOrders = await Order.find({
    $or: [
      { paymentStatus: 'REFUNDED' },
      { paymentStatus: 'PARTIALLY_REFUNDED' },
      { refundAmount: { $gt: 0 } }
    ]
  }).sort({ refundedAt: -1, updatedAt: -1 });
  res.json({ data: refundedOrders });
});

// @desc    Update order status
// @route   PUT /api/orders/:orderId/status
// @access  Public / Staff
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const targetOrderId = req.params.orderId;

  const order = await Order.findOne(buildOrderIdQuery(targetOrderId));
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (status) order.status = status;
  if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
  if (req.body.paymentMethod) {
    let pm = String(req.body.paymentMethod).toUpperCase();
    if (pm === 'UPI') pm = 'UPI_QR';
    if (pm === 'CARD') pm = 'CARD_SWIPE';
    order.paymentMethod = pm;
  }
  if (req.body.paymentStatus === 'PAID' && !order.paidAt) {
    order.paidAt = new Date();
    if (!order.invoiceNumber) {
      order.invoiceNumber = await getNextInvoiceNumber();
    }
  }

  if (status === 'ready') {
    (order.items || []).forEach(it => {
      if (it.status !== 'served') {
        it.status = 'ready';
        it.isPrepared = true;
      }
    });
  } else if (status === 'served') {
    (order.items || []).forEach(it => {
      it.status = 'served';
      it.isPrepared = true;
    });
  }

  await order.save();

  res.json({ data: order });
});

// @desc    Toggle individual dish preparation status
// @route   PUT /api/orders/:orderId/items/check
// @access  Public / Kitchen
export const toggleItemPrepared = asyncHandler(async (req, res) => {
  const { itemIndex, isPrepared } = req.body;
  const targetOrderId = req.params.orderId;

  const order = await Order.findOne(buildOrderIdQuery(targetOrderId));

  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.items && order.items[itemIndex] !== undefined) {
    if (order.items[itemIndex].status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot toggle preparation status on a cancelled dish' });
    }
    order.items[itemIndex].isPrepared = !!isPrepared;
    if (isPrepared && order.items[itemIndex].status !== 'served') {
      order.items[itemIndex].status = 'ready';
    }

    // If all active dishes are prepared, automatically mark order as ready
    const active = (order.items || []).filter(it => it.status !== 'cancelled');
    if (active.length > 0 && active.every(it => it.isPrepared || it.status === 'ready' || it.status === 'served')) {
      order.status = 'ready';
    }

    await order.save();
  }

  res.json({ success: true, data: order });
});

// @desc    Cancel individual item/dish from an order
// @route   PUT /api/orders/:orderId/items/:itemIndex/cancel
// @access  Public / Kitchen
export const cancelOrderItem = asyncHandler(async (req, res) => {
  const { reason, cancelledBy } = req.body;
  const targetOrderId = req.params.orderId;
  const itemIndex = parseInt(req.params.itemIndex, 10);

  const order = await Order.findOne(buildOrderIdQuery(targetOrderId));

  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status === 'cancelled') {
    return res.status(400).json({ message: 'Order is already cancelled' });
  }
  if (order.paymentStatus === 'PAID') {
    return res.status(400).json({ message: 'Cannot cancel dishes from an already settled bill' });
  }

  if (isNaN(itemIndex) || itemIndex < 0 || !order.items || itemIndex >= order.items.length) {
    return res.status(400).json({ message: 'Invalid item index' });
  }

  const item = order.items[itemIndex];
  if (item.status === 'cancelled') {
    return res.status(400).json({ message: `"${item.name}" is already cancelled` });
  }

  const dishName = item.name;
  const defaultReason = reason || "86'd / Out of Ingredients";
  const actor = cancelledBy || 'Chef';

  item.status = 'cancelled';
  item.cancelReason = defaultReason;
  item.cancelledAt = new Date();
  item.cancelledBy = actor;

  const activeItems = order.items.filter(it => it.status !== 'cancelled');
  const newSubtotal = activeItems.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);
  const newTax = Math.round(newSubtotal * 0.05 * 100) / 100;
  const discount = Math.min(newSubtotal, order.discount || 0);
  const newTotal = Math.max(0, Math.round((newSubtotal + newTax - discount) * 100) / 100);

  order.subtotal = newSubtotal;
  order.tax = newTax;
  order.discount = discount;
  order.total = newTotal;

  const allCancelled = order.items.every(it => it.status === 'cancelled');
  if (allCancelled) {
    order.status = 'cancelled';
    order.cancelReason = `All dishes cancelled: ${defaultReason}`;
    order.cancelledAt = new Date();
    order.cancelledBy = actor;
  }

  await order.save();

  res.json({
    success: true,
    message: allCancelled 
      ? `All dishes cancelled. Order #${order.orderId} marked as cancelled.`
      : `"${dishName}" cancelled successfully by ${actor}. Order total recalculated to ₹${newTotal}.`,
    data: order,
    allCancelled
  });
});

// Lightweight staff authorization check for operational write operations (cancel, pay-table).
// Passes if: (a) a valid JWT user is attached via middleware (req.user), OR
//            (b) a valid Bearer JWT token is present in the Authorization header (Admin/Staff/Owner), OR
//            (c) the request sends the correct x-staff-secret header (kitchen/waiter tablets).
// Blocks unauthenticated external actors (bots, public table guests) from cancelling/paying without staff credentials.
const isStaffAuthorized = (req) => {
  // 1. Authenticated user attached by middleware (Admin, Owner, Chef, Waiter)
  if (req.user) return true;

  // 2. Direct Authorization Bearer token inspection (in case route lacked auth middleware)
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && (decoded.id || decoded.userId || decoded._id)) {
        return true;
      }
    }
  } catch (_) {
    // Token invalid or expired, continue to check staff secret
  }

  // 3. Device secret header (Kitchen display screen / Waiter tablets)
  const secret = req.headers['x-staff-secret'];
  const expectedSecret = process.env.STAFF_SECRET || 'CHAIADDAA_STAFF_2026_SECURE';
  if (secret && secret === expectedSecret) {
    return true;
  }

  return false;
};

// @desc    Cancel whole order
// @route   PUT /api/orders/:orderId/cancel
// @access  Staff / Kitchen (JWT or x-staff-secret header)
export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isStaffAuthorized(req)) {
    return res.status(403).json({ success: false, message: 'Staff authorization required to cancel orders.' });
  }

  const { reason, cancelledBy } = req.body;
  const targetOrderId = req.params.orderId;

  const order = await Order.findOne(buildOrderIdQuery(targetOrderId));

  if (!order) return res.status(404).json({ message: 'Order not found' });

  const defaultReason = reason || 'Cancelled by Kitchen Staff / Chef';
  const actor = cancelledBy || 'Kitchen Staff';

  order.status = 'cancelled';
  order.cancelReason = defaultReason;
  order.cancelledAt = new Date();
  order.cancelledBy = actor;

  if (Array.isArray(order.items)) {
    order.items.forEach(it => {
      it.status = 'cancelled';
      it.cancelReason = it.cancelReason || defaultReason;
      it.cancelledAt = it.cancelledAt || new Date();
      it.cancelledBy = it.cancelledBy || actor;
    });
  }

  await order.save();

  if (order.tableId) {
    const cleanNum = String(order.tableId).match(/\d+/)?.[0];
    if (cleanNum) {
      const remainingActive = await Order.find({
        tableId: cleanNum,
        paymentStatus: { $ne: 'PAID' },
        status: { $ne: 'cancelled' }
      });
      if (remainingActive.length === 0) {
        await Table.updateOne(
          { tableNumber: cleanNum },
          { $set: { status: 'cleaning', cleaningStartedAt: new Date(), guestCount: 0 } }
        ).catch(() => {});
      }
    }
  }

  res.json({
    success: true,
    message: `Order #${order.orderId} cancelled successfully.`,
    data: order
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Public
export const getOrderById = asyncHandler(async (req, res) => {
  const targetId = req.params.orderId;
  const order = await Order.findOne(buildOrderIdQuery(targetId));
  if (!order) return res.status(404).json({ message: 'Order not found' });
  await autoUpdateOrdersToReady([order]);
  res.json({ data: order });
});

// @desc    Pay & Settle Table Bill
// @route   POST /api/orders/pay-table
// @access  Staff / POS (JWT or x-staff-secret header)
export const payTableBill = asyncHandler(async (req, res) => {
  if (!isStaffAuthorized(req)) {
    return res.status(403).json({ success: false, message: 'Staff authorization required to settle bills.' });
  }

  const { tableId, paymentMethod } = req.body;
  const cleanTableNum = String(tableId || '').match(/\d+/)?.[0] || '1';
  const isObjId = String(tableId).match(/^[0-9a-fA-F]{24}$/);

  const table = await Table.findOne({
    $or: [{ tableNumber: cleanTableNum }, { _id: isObjId ? tableId : null }]
  });

  const activeOrders = await Order.find({
    $or: [
      { tableId: cleanTableNum },
      { tableId: `table/${cleanTableNum}/menu` },
      { tableId: `table-${cleanTableNum}` },
      { tableId: String(tableId) },
      { tableId: table ? String(table._id) : null }
    ],
    paymentStatus: { $ne: 'PAID' },
    status: { $ne: 'cancelled' }
  });

  if (activeOrders.length === 0) {
    return res.status(400).json({
      message: `No active unpaid orders found for Table ${cleanTableNum}. Bill may already be settled.`
    });
  }

  const invoiceNumber = await getNextInvoiceNumber();

  for (const ord of activeOrders) {
    ord.status = 'completed';
    ord.paymentStatus = 'PAID';
    ord.paymentMethod = paymentMethod || 'UPI_QR';
    ord.paidAt = new Date();
    ord.invoiceNumber = invoiceNumber;
    await ord.save();
  }

  await Table.updateMany(
    { $or: [{ tableNumber: cleanTableNum }, { _id: table ? table._id : null }] },
    { $set: { status: 'cleaning', cleaningStartedAt: new Date(), guestCount: 0 } }
  );

  if (table) {
    await TableSession.updateMany(
      { tableId: table._id, status: 'active' },
      { $set: { status: 'completed', endTime: new Date() } }
    ).catch(() => {});
  }

  res.json({
    success: true,
    message: `Bill settled successfully via ${paymentMethod || 'UPI_QR'} for Table ${cleanTableNum}! Table set to Cleaning.`,
    data: { invoiceNumber, paymentMethod, paidAt: new Date() }
  });
});
