import express from 'express';
import { getCoupons, validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

router.get('/', getCoupons);
router.get('/validate/:code', validateCoupon);

export default router;

