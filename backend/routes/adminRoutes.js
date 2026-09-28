import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { getMetrics, getAnalyticsSummary, getExecutiveAnalytics } from '../controllers/adminController.js';

const router = express.Router();

// Restrict all owner/admin analytics/metrics to authorized staff roles
router.use(protect, requireRole('owner', 'cashier'));

router.get('/metrics', getMetrics);
router.get('/analytics', getAnalyticsSummary);
router.get('/executive-analytics', getExecutiveAnalytics);

export default router;


