import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Public
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true });
  res.json({ data: coupons });
});

// @desc    Validate coupon code
// @route   GET /api/coupons/validate/:code
// @access  Public
export const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
  
  if (!coupon) {
    return res.status(404).json({ message: 'Invalid coupon code' });
  }
  
  if (!coupon.isActive) {
    return res.status(400).json({ message: 'This coupon is no longer active' });
  }

  res.json({ data: coupon });
});
