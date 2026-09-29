import express from 'express';
import Order from '../models/Order.js';
import {
  purgeAllOrders,
  createOrder,
  getOrdersByPhone,
  getOrdersByTable,
  getActiveOrders,
  getSettledOrders,
  refundOrder,
  getRefunds,
  updateOrderStatus,
  toggleItemPrepared,
  cancelOrderItem,
  cancelOrder,
  getOrderById,
  payTableBill,
} from '../controllers/orderController.js';

import { protect, requireRole } from '../middleware/authMiddleware.js';
import { orderRateLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

// Purge route: Only Owner allowed
router.post('/dev/purge-all', protect, requireRole('owner'), purgeAllOrders);

// Order creation: Customer (logged-in or table guest) or staff placing order
router.post('/', orderRateLimiter, createOrder);

// Customer / Table order retrieval
router.get('/phone/:phone', getOrdersByPhone);
router.get('/table/:tableId', getOrdersByTable);
router.get('/:orderId', getOrderById);

// Staff operational views: Kitchen, Owner
router.get(['/active', '/active/all'], protect, requireRole('chef', 'owner'), getActiveOrders);
router.get('/settled/all', protect, requireRole('owner'), getSettledOrders);

// Kitchen / Staff status updates
router.put('/:orderId/status', protect, requireRole('chef', 'owner'), updateOrderStatus);
router.put('/:orderId/items/check', protect, requireRole('chef', 'owner'), toggleItemPrepared);
router.put('/:orderId/items/:itemIndex/cancel', protect, requireRole('chef', 'owner'), cancelOrderItem);
router.put('/:orderId/cancel', protect, requireRole('chef', 'owner'), cancelOrder);

// Owner financial operations
router.post('/:orderId/refund', protect, requireRole('owner'), refundOrder);
router.get('/refunds/all', protect, requireRole('owner'), getRefunds);
router.post('/pay-table', payTableBill);

// Auto-cancel orders in 'received' status older than 15 minutes (Kitchen Timeout)
const autoCancelStaleOrders = async () => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const staleOrders = await Order.find({
      status: 'received',
      createdAt: { $lt: fifteenMinsAgo }
    });

    for (const ord of staleOrders) {
      ord.status = 'cancelled';
      ord.cancelReason = 'Order Auto-Cancelled due to Kitchen Response Timeout (15m)';
      ord.cancelledAt = new Date();
      ord.cancelledBy = 'System Auto-Timeout';
      await ord.save();
    }
  } catch (e) {
    // Silence background timer error
  }
};

setInterval(autoCancelStaleOrders, 30000); // Check every 30s

export default router;

