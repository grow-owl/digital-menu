import express from 'express';
import {
  getAllTables,
  validateTableQr,
  scanTableQr,
  getTableQrToken,
  rotateTableQrToken,
  getSessionDetails,
  checkoutTableSession,
  updateTableStatus,
  callWaiter,
  getWaiterCalls,
  resolveWaiterCall,
  getTableByNumber,
  getTableCart,
  updateTableCart,
} from '../controllers/tableController.js';
import { protect, requireRole, optionalAuth } from '../middleware/authMiddleware.js';
import { waiterCallRateLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getAllTables);
router.post('/validate', validateTableQr);
router.all('/scan/:token', scanTableQr);
router.get('/qr-token/:tableNumber', protect, requireRole('owner'), getTableQrToken);
router.post(['/:tableId/rotate-qr', '/rotate-qr/:tableId'], protect, requireRole('owner'), rotateTableQrToken);
router.get('/session/:sessionId', getSessionDetails);
router.post(['/checkout', '/session/:sessionId/checkout'], checkoutTableSession);
router.put(['/:tableId/status', '/status/:tableId'], protect, requireRole('owner', 'chef'), updateTableStatus);
router.post('/call-waiter', waiterCallRateLimiter, callWaiter);
router.get('/waiter-calls', protect, requireRole('owner', 'chef'), getWaiterCalls);
router.put('/waiter-calls/:id/resolve', protect, requireRole('owner', 'chef'), resolveWaiterCall);
router.get('/table-number/:tableNumber', getTableByNumber);
router.get('/table-number/:tableNumber/cart', getTableCart);
router.put('/table-number/:tableNumber/cart', updateTableCart);

export default router;

