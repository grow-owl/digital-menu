import express from 'express';
import { getPendingBills, settlePayment } from '../controllers/cashierController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requireRole('cashier', 'owner'));

router.get('/pending-bills', getPendingBills);
router.post('/settle', settlePayment);

export default router;
