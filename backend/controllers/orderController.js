import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import TableSession from '../models/TableSession.js';
import Table from '../models/Table.js';
import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import { calculateTier, getTierMultiplier } from './loyaltyController.js';
import asyncHandler from '../utils/asyncHandler.js';

export const generateOrderId = () => `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
export const generateInvoiceNumber = () => `INV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// Helper: Award Loyalty Points when an order is settled/paid
export const awardLoyaltyPointsForOrder = async (order) => {
  try {
    if (!order || order.pointsCredited || !order.customerPhone) return;
    const cleanPhone = String(order.customerPhone).trim();
    if (!cleanPhone) return;

    const user = await User.findOne({ phone: cleanPhone });
    if (!user) return;

    const netDiningBase = Math.max(0, (order.subtotal || 0) - (order.discount || 0) - (order.pointsDiscount || 0));
    const tierMultiplier = getTierMultiplier(user.loyaltyTier || 'STANDARD');
    const ptsEarned = Math.floor((netDiningBase / 10) * tierMultiplier);

    if (ptsEarned > 0) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + ptsEarned;
      user.lifetimePoints = (user.lifetimePoints || 0) + ptsEarned;
      user.loyaltyTier = calculateTier(user.lifetimePoints);
      await user.save();

      await LoyaltyTransaction.create({
        userId: user._id,
        customerPhone: cleanPhone,
        orderId: order.orderId,
        type: 'EARNED_DINING',
        points: ptsEarned,
        balanceAfter: user.loyaltyPoints,
        description: `Dining Reward (+${ptsEarned} PTS) on Invoice #${order.invoiceNumber || order.orderId} (₹${order.total})`,
        metadata: {
          orderId: order.orderId,
          invoiceNumber: order.invoiceNumber,
          billTotal: order.total,
          tier: user.loyaltyTier,
          multiplier: tierMultiplier
        }
      }).catch(e => console.error('Failed to log loyalty credit tx:', e));

      order.pointsEarned = ptsEarned;
      order.pointsCredited = true;
      await order.save();
    }
  } catch (err) {
    console.error('Error awarding loyalty points for order:', err);
  }
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
    appliedCoupon, 
    sessionId,
    pointsRedeemed,
    pointsDiscount
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
      status: 'Standard',
      loyaltyPoints: 100,
      lifetimePoints: 100,
      loyaltyTier: 'STANDARD'
    }).catch(err => {
      console.warn('Customer auto-create warning:', err.message);
    });

    if (customerUser) {
      await LoyaltyTransaction.create({
        userId: customerUser._id,
        customerPhone: cleanCustomerPhone,
        type: 'WELCOME_BONUS',
        points: 100,
        balanceAfter: 100,
        description: 'Siliguri Chai Adda Welcome Dining Gift (+100 PTS)',
        metadata: { reason: 'First Order Auto-Enrollment' }
      }).catch(err => console.error('Failed to log welcome loyalty tx:', err));
    }
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
      status: 'received',
      isPrepared: false
    };
  });

  let verifiedRedeemed = 0;
  let verifiedPtsDiscount = 0;
  const requestedRedeemed = parseInt(pointsRedeemed, 10) || 0;

  if (requestedRedeemed > 0) {
    if (!customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer phone number is required to redeem loyalty points.' });
    }
    const cleanPhone = String(customerPhone).trim();
    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Customer account not found for loyalty points redemption.' });
    }
    if ((user.loyaltyPoints || 0) < requestedRedeemed) {
      return res.status(400).json({
        success: false,
        message: `Insufficient loyalty points balance. Available: ${user.loyaltyPoints} PTS, requested: ${requestedRedeemed} PTS.`
      });
    }
    const calculatedDiscount = Math.round(requestedRedeemed * 0.5 * 100) / 100;
    const maxAllowedDiscount = Math.round(verifiedSubtotal * 0.5 * 100) / 100;
    if (calculatedDiscount > maxAllowedDiscount) {
      return res.status(400).json({
        success: false,
        message: `Loyalty discount cannot exceed 50% of the food subtotal (Max allowed: ₹${maxAllowedDiscount}).`
      });
    }
    verifiedRedeemed = requestedRedeemed;
    verifiedPtsDiscount = calculatedDiscount;
  }

  const computedTax = Math.round(verifiedSubtotal * 0.05 * 100) / 100;
  const verifiedCouponDiscount = Math.min(verifiedSubtotal, Math.max(0, parseFloat(discount) || 0));
  const calculatedTotal = Math.max(0, Math.round((verifiedSubtotal + computedTax - verifiedCouponDiscount - verifiedPtsDiscount) * 100) / 100);

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

  let existingOrder = await Order.findOne({
    $or: [
      { tableId: queryTableId },
      { tableId: `table/${queryTableId}/menu` },
      { tableId: `table-${queryTableId}` },
      { tableId: String(tableId) },
      { tableId: physicalTable ? String(physicalTable._id) : null }
    ],
    paymentStatus: 'PENDING',
    status: { $ne: 'cancelled' }
  }).sort({ createdAt: -1 });

  let order;

  if (existingOrder) {
    existingOrder.items.push(...verifiedNewItems);
    existingOrder.subtotal = (existingOrder.subtotal || 0) + verifiedSubtotal;
    existingOrder.tax = (existingOrder.tax || 0) + computedTax;
    existingOrder.discount = (existingOrder.discount || 0) + verifiedCouponDiscount;
    existingOrder.pointsRedeemed = (existingOrder.pointsRedeemed || 0) + verifiedRedeemed;
    existingOrder.pointsDiscount = (existingOrder.pointsDiscount || 0) + verifiedPtsDiscount;
    existingOrder.total = (existingOrder.total || 0) + calculatedTotal;
    
    if (cleanCustomerPhone) existingOrder.customerPhone = cleanCustomerPhone;
    if (customerName) existingOrder.customerName = customerName;
    if (appliedCoupon) existingOrder.appliedCoupon = appliedCoupon;
    
    existingOrder.status = 'preparing';
    await existingOrder.save();
    order = existingOrder;
  } else {
    order = await Order.create({
      orderId: generateOrderId(),
      tableId: queryTableId,
      customerPhone: cleanCustomerPhone,
      customerName: customerName || (customerUser ? customerUser.name : `Diner-${cleanCustomerPhone.slice(-4)}`),
      items: verifiedNewItems,
      subtotal: verifiedSubtotal,
      tax: computedTax,
      discount: verifiedCouponDiscount,
      pointsRedeemed: verifiedRedeemed,
      pointsDiscount: verifiedPtsDiscount,
      total: calculatedTotal,
      appliedCoupon,
      status: 'received'
    });
  }

  if (verifiedRedeemed > 0 && customerPhone) {
    const cleanPhone = String(customerPhone).trim();
    const user = await User.findOne({ phone: cleanPhone });
    if (user) {
      user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - verifiedRedeemed);
      await user.save();

      await LoyaltyTransaction.create({
        userId: user._id,
        customerPhone: cleanPhone,
        orderId: order.orderId,
        type: 'REDEEMED_ORDER',
        points: -verifiedRedeemed,
        balanceAfter: user.loyaltyPoints,
        description: `Redeemed ${verifiedRedeemed} PTS (-₹${verifiedPtsDiscount}) at Checkout for Order #${order.orderId}`,
        metadata: { pointsDiscount: verifiedPtsDiscount, orderId: order.orderId }
      }).catch(err => console.error('Failed to log redemption loyalty tx:', err));
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

// @desc    Get orders for specific table
// @route   GET /api/orders/table/:tableId
// @access  Public
export const getOrdersByTable = asyncHandler(async (req, res) => {
  const { includeCompleted } = req.query;
  const filter = { tableId: String(req.params.tableId) };
  
  if (includeCompleted !== 'true') {
    filter.status = { $in: ['received', 'preparing', 'ready', 'served'] };
    filter.paymentStatus = { $ne: 'PAID' };
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ data: orders });
});

// @desc    Get active unpaid orders (Kitchen / POS)
// @route   GET /api/orders/active, GET /api/orders/active/all
// @access  Public / Staff
export const getActiveOrders = asyncHandler(async (req, res) => {
  const activeOrders = await Order.find({
    status: { $in: ['received', 'preparing', 'ready', 'served'] },
    paymentStatus: { $ne: 'PAID' }
  }).sort({ createdAt: 1 });
  res.json({ data: activeOrders });
});

// @desc    Get all settled orders (History / POS)
// @route   GET /api/orders/settled/all
// @access  Public / Staff
export const getSettledOrders = asyncHandler(async (req, res) => {
  const settledOrders = await Order.find({ paymentStatus: 'PAID' }).sort({ paidAt: -1, updatedAt: -1 });
  res.json({ data: settledOrders });
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

  if (order.customerPhone && (order.pointsEarned || 0) > 0) {
    try {
      const cleanPhone = String(order.customerPhone).trim();
      const user = await User.findOne({ phone: cleanPhone });
      if (user) {
        const refundRatio = Math.min(1, requestedAmount / (order.total || 1));
        const ptsDeduct = Math.round((order.pointsEarned || 0) * refundRatio);
        if (ptsDeduct > 0) {
          user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - ptsDeduct);
          await user.save();
          await LoyaltyTransaction.create({
            userId: user._id,
            customerPhone: user.phone,
            orderId: order.orderId,
            type: 'REFUND_DEDUCTION',
            points: -ptsDeduct,
            balanceAfter: user.loyaltyPoints,
            description: `Points reversed (-${ptsDeduct} PTS) due to ₹${requestedAmount} refund on Order #${order.orderId}`,
            metadata: { requestedAmount, invoiceNumber: order.invoiceNumber }
          }).catch(e => console.error('Refund deduction tx err:', e));
        }

        if (isFullRefund && (order.pointsRedeemed || 0) > 0) {
          user.loyaltyPoints = (user.loyaltyPoints || 0) + order.pointsRedeemed;
          await user.save();
          await LoyaltyTransaction.create({
            userId: user._id,
            customerPhone: user.phone,
            orderId: order.orderId,
            type: 'ORDER_CANCEL_RESTORE',
            points: order.pointsRedeemed,
            balanceAfter: user.loyaltyPoints,
            description: `Restored ${order.pointsRedeemed} redeemed points due to 100% refund on Order #${order.orderId}`,
            metadata: { orderId: order.orderId }
          }).catch(e => console.error('Refund points restore tx err:', e));
        }
      }
    } catch (loyaltyErr) {
      console.error('Error during refund loyalty reconciliation:', loyaltyErr);
    }
  }

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
  const isValidObjId = targetOrderId.match(/^[0-9a-fA-F]{24}$/);

  const order = await Order.findOne({
    $or: [{ orderId: targetOrderId }, { _id: isValidObjId ? targetOrderId : null }]
  });
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
      order.invoiceNumber = generateInvoiceNumber();
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

  if (order.paymentStatus === 'PAID' || order.status === 'completed') {
    await awardLoyaltyPointsForOrder(order);
  }

  res.json({ data: order });
});

// @desc    Toggle individual dish preparation status
// @route   PUT /api/orders/:orderId/items/check
// @access  Public / Kitchen
export const toggleItemPrepared = asyncHandler(async (req, res) => {
  const { itemIndex, isPrepared } = req.body;
  const targetOrderId = req.params.orderId;
  const isValidObjId = targetOrderId.match(/^[0-9a-fA-F]{24}$/);

  const order = await Order.findOne({
    $or: [{ orderId: targetOrderId }, { _id: isValidObjId ? targetOrderId : null }]
  });

  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.items && order.items[itemIndex] !== undefined) {
    if (order.items[itemIndex].status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot toggle preparation status on a cancelled dish' });
    }
    order.items[itemIndex].isPrepared = !!isPrepared;
    if (isPrepared && order.items[itemIndex].status !== 'served') {
      order.items[itemIndex].status = 'ready';
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
  const isValidObjId = targetOrderId.match(/^[0-9a-fA-F]{24}$/);

  const order = await Order.findOne({
    $or: [{ orderId: targetOrderId }, { _id: isValidObjId ? targetOrderId : null }]
  });

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
  const pointsDiscount = Math.min(newSubtotal, order.pointsDiscount || 0);
  const newTotal = Math.max(0, Math.round((newSubtotal + newTax - discount - pointsDiscount) * 100) / 100);

  order.subtotal = newSubtotal;
  order.tax = newTax;
  order.discount = discount;
  order.pointsDiscount = pointsDiscount;
  order.total = newTotal;

  const allCancelled = order.items.every(it => it.status === 'cancelled');
  if (allCancelled) {
    order.status = 'cancelled';
    order.cancelReason = `All dishes cancelled: ${defaultReason}`;
    order.cancelledAt = new Date();
    order.cancelledBy = actor;

    if (order.customerPhone && (order.pointsRedeemed || 0) > 0) {
      try {
        const cleanPhone = String(order.customerPhone).trim();
        const user = await User.findOne({ phone: cleanPhone });
        if (user) {
          user.loyaltyPoints = (user.loyaltyPoints || 0) + order.pointsRedeemed;
          await user.save();
          await LoyaltyTransaction.create({
            userId: user._id,
            customerPhone: cleanPhone,
            orderId: order.orderId,
            type: 'ORDER_CANCEL_RESTORE',
            points: order.pointsRedeemed,
            balanceAfter: user.loyaltyPoints,
            description: `Restored ${order.pointsRedeemed} redeemed points due to cancellation of Order #${order.orderId}`,
            metadata: { orderId: order.orderId, cancelReason: defaultReason }
          }).catch(e => console.error('Failed to log cancel points restore:', e));
        }
      } catch (err) {
        console.error('Error restoring points for cancelled order:', err);
      }
    }
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

// @desc    Cancel whole order
// @route   PUT /api/orders/:orderId/cancel
// @access  Public / Staff
export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason, cancelledBy } = req.body;
  const targetOrderId = req.params.orderId;
  const isValidObjId = targetOrderId.match(/^[0-9a-fA-F]{24}$/);

  const order = await Order.findOne({
    $or: [{ orderId: targetOrderId }, { _id: isValidObjId ? targetOrderId : null }]
  });

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

  if (order.customerPhone && (order.pointsRedeemed || 0) > 0) {
    try {
      const cleanPhone = String(order.customerPhone).trim();
      const user = await User.findOne({ phone: cleanPhone });
      if (user) {
        user.loyaltyPoints = (user.loyaltyPoints || 0) + order.pointsRedeemed;
        await user.save();
        await LoyaltyTransaction.create({
          userId: user._id,
          customerPhone: cleanPhone,
          orderId: order.orderId,
          type: 'ORDER_CANCEL_RESTORE',
          points: order.pointsRedeemed,
          balanceAfter: user.loyaltyPoints,
          description: `Restored ${order.pointsRedeemed} redeemed points due to cancellation of Order #${order.orderId}`,
          metadata: { orderId: order.orderId, cancelReason: defaultReason }
        }).catch(e => console.error('Failed to log cancel points restore:', e));
      }
    } catch (err) {
      console.error('Error restoring cancelled order points:', err);
    }
  }

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
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ data: order });
});

// @desc    Pay & Settle Table Bill
// @route   POST /api/orders/pay-table
// @access  Public / Staff
export const payTableBill = asyncHandler(async (req, res) => {
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

  const invoiceNumber = generateInvoiceNumber();

  for (const ord of activeOrders) {
    ord.status = 'completed';
    ord.paymentStatus = 'PAID';
    ord.paymentMethod = paymentMethod || 'UPI_QR';
    ord.paidAt = new Date();
    ord.invoiceNumber = invoiceNumber;
    await ord.save();
    await awardLoyaltyPointsForOrder(ord);
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
