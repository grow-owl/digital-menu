import Order from '../models/Order.js';
import Table from '../models/Table.js';
import TableSession from '../models/TableSession.js';
import asyncHandler from '../utils/asyncHandler.js';
import { awardLoyaltyPointsForOrder, generateInvoiceNumber } from './orderController.js';

// @desc    Get all pending bills awaiting cashier settlement
// @route   GET /api/cashier/pending-bills
// @access  Public / Staff / Cashier
export const getPendingBills = asyncHandler(async (req, res) => {
  const pendingOrders = await Order.find({
    paymentStatus: { $ne: 'PAID' },
    status: { $nin: ['cancelled', 'completed'] }
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: pendingOrders
  });
});

// @desc    Settle bill payment for an order at Cashier POS
// @route   POST /api/cashier/settle
// @access  Public / Staff / Cashier
export const settlePayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required to settle payment.' });
  }

  const isValidObjId = String(orderId).match(/^[0-9a-fA-F]{24}$/);
  const order = await Order.findOne({
    $or: [
      { orderId: orderId },
      { _id: isValidObjId ? orderId : null }
    ]
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found for settlement.' });
  }

  if (order.paymentStatus === 'PAID') {
    return res.status(400).json({ success: false, message: 'Order has already been settled and paid.' });
  }

  const invoiceNumber = generateInvoiceNumber();
  const settledAt = new Date();

  order.status = 'completed';
  order.paymentStatus = 'PAID';
  order.paymentMethod = paymentMethod || 'CASH';
  order.paidAt = settledAt;
  order.invoiceNumber = invoiceNumber;

  await order.save();
  await awardLoyaltyPointsForOrder(order);

  // Update corresponding Table status
  const cleanTableNum = String(order.tableId || '').match(/\d+/)?.[0];
  if (cleanTableNum) {
    await Table.updateMany(
      { tableNumber: cleanTableNum },
      { $set: { status: 'cleaning', cleaningStartedAt: settledAt, guestCount: 0 } }
    );

    const tableDoc = await Table.findOne({ tableNumber: cleanTableNum });
    if (tableDoc) {
      await TableSession.updateMany(
        { tableId: tableDoc._id, status: 'active' },
        { $set: { status: 'completed', endTime: settledAt } }
      ).catch(() => {});
    }
  }

  res.json({
    success: true,
    message: `Bill settled successfully via ${order.paymentMethod}!`,
    data: {
      orderId: order.orderId,
      orderNumber: order.invoiceNumber || String(order.orderId),
      tableNumber: String(cleanTableNum || order.tableId || '1'),
      amountPaid: order.total || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: 'PAID',
      settledAt: settledAt.toISOString()
    }
  });
});
