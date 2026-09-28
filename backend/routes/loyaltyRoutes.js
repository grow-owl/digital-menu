import express from 'express';
import {
  calculateTier,
  getTierMultiplier,
  getTierMeta,
  getLoyaltyBalance,
  getLoyaltyTransactions,
  claimFeedbackReward,
  adminAdjustPoints,
} from '../controllers/loyaltyController.js';

import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/balance/:phone', getLoyaltyBalance);
router.get('/transactions/:phone', getLoyaltyTransactions);
router.post('/feedback-reward', claimFeedbackReward);
router.post('/admin/adjust', protect, requireRole('cashier', 'owner'), adminAdjustPoints);

export {
  calculateTier,
  getTierMultiplier,
  getTierMeta,
};
export default router;

