import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper: Calculate Tier based on Lifetime Points
export const calculateTier = (lifetimePoints = 0) => {
  if (lifetimePoints >= 3000) return 'PLATINUM';
  if (lifetimePoints >= 1500) return 'GOLD';
  if (lifetimePoints >= 500) return 'SILVER';
  return 'STANDARD';
};

// Helper: Tier Multiplier for Points Earning
export const getTierMultiplier = (tier = 'STANDARD') => {
  switch (tier) {
    case 'PLATINUM': return 2.0;
    case 'GOLD': return 1.5;
    case 'SILVER': return 1.2;
    default: return 1.0;
  }
};

// Helper: Tier Meta Info (Perks, Next Target)
export const getTierMeta = (tier, lifetimePoints = 0) => {
  switch (tier) {
    case 'PLATINUM':
      return {
        name: 'Platinum VIP',
        color: '#E5E4E2',
        multiplier: 2.0,
        nextTier: null,
        pointsNeeded: 0,
        progressPct: 100,
        perks: ['2x Points on all meals', 'Complimentary Chef Amuse-Bouche', 'Executive Table Priority', 'Dedicated Butler Support']
      };
    case 'GOLD':
      return {
        name: 'Gold Member',
        color: '#F59E0B',
        multiplier: 1.5,
        nextTier: 'PLATINUM',
        pointsNeeded: Math.max(0, 3000 - lifetimePoints),
        progressPct: Math.min(100, Math.round(((lifetimePoints - 1500) / 1500) * 100)),
        perks: ['1.5x Points on all meals', 'Priority Table Booking', 'Complimentary Dessert on Birthdays']
      };
    case 'SILVER':
      return {
        name: 'Silver Member',
        color: '#94A3B8',
        multiplier: 1.2,
        nextTier: 'GOLD',
        pointsNeeded: Math.max(0, 1500 - lifetimePoints),
        progressPct: Math.min(100, Math.round(((lifetimePoints - 500) / 1000) * 100)),
        perks: ['1.2x Points on all meals', 'Special Member-Only Offers']
      };
    default:
      return {
        name: 'Standard Guest',
        color: '#10B981',
        multiplier: 1.0,
        nextTier: 'SILVER',
        pointsNeeded: Math.max(0, 500 - lifetimePoints),
        progressPct: Math.min(100, Math.round((lifetimePoints / 500) * 100)),
        perks: ['1x Points on dining (1 pt per ₹10)', 'Instant Point Redemption at Checkout']
      };
  }
};

// @desc    Get loyalty balance & tier details by customer phone
// @route   GET /api/loyalty/balance/:phone
// @access  Public
export const getLoyaltyBalance = asyncHandler(async (req, res) => {
  const rawPhone = String(req.params.phone || '').trim();
  if (!rawPhone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const user = await User.findOne({ phone: rawPhone });
  if (!user) {
    return res.json({
      success: true,
      data: {
        phone: rawPhone,
        isRegistered: false,
        loyaltyPoints: 0,
        lifetimePoints: 0,
        loyaltyTier: 'STANDARD',
        cashValue: 0,
        tierMeta: getTierMeta('STANDARD', 0),
        recentTransactions: []
      }
    });
  }

  // Refresh tier in case lifetimePoints changed
  const currentTier = calculateTier(user.lifetimePoints || 0);
  if (user.loyaltyTier !== currentTier) {
    user.loyaltyTier = currentTier;
    await user.save();
  }

  const recentTransactions = await LoyaltyTransaction.find({ customerPhone: rawPhone })
    .sort({ createdAt: -1 })
    .limit(10);

  const cashValue = Math.round((user.loyaltyPoints || 0) * 0.5 * 100) / 100;

  res.json({
    success: true,
    data: {
      userId: user._id,
      name: user.name,
      phone: user.phone,
      isRegistered: true,
      loyaltyPoints: user.loyaltyPoints || 0,
      lifetimePoints: user.lifetimePoints || 0,
      loyaltyTier: user.loyaltyTier || 'STANDARD',
      cashValue,
      tierMeta: getTierMeta(user.loyaltyTier || 'STANDARD', user.lifetimePoints || 0),
      recentTransactions
    }
  });
});

// @desc    Get loyalty transactions audit log for customer
// @route   GET /api/loyalty/transactions/:phone
// @access  Public
export const getLoyaltyTransactions = asyncHandler(async (req, res) => {
  const rawPhone = String(req.params.phone || '').trim();
  const limit = parseInt(req.query.limit, 10) || 50;

  const transactions = await LoyaltyTransaction.find({ customerPhone: rawPhone })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: transactions
  });
});

// @desc    Claim bonus loyalty points for rating dining experience
// @route   POST /api/loyalty/feedback-reward
// @access  Public
export const claimFeedbackReward = asyncHandler(async (req, res) => {
  const { phone, orderId, rating, feedback } = req.body;
  const cleanPhone = String(phone || '').trim();

  if (!cleanPhone) {
    return res.status(400).json({ message: 'Customer phone number is required to credit loyalty points.' });
  }

  const user = await User.findOne({ phone: cleanPhone });
  if (!user) {
    return res.status(404).json({ message: 'Please register or log in to claim loyalty points for feedback.' });
  }

  // Check if feedback points already awarded for this specific orderId
  if (orderId) {
    const existingTx = await LoyaltyTransaction.findOne({
      customerPhone: cleanPhone,
      orderId: String(orderId),
      type: 'EARNED_FEEDBACK'
    });
    if (existingTx) {
      return res.status(400).json({
        success: false,
        message: `Feedback bonus already claimed for Order #${orderId}. Thank you!`,
        data: { loyaltyPoints: user.loyaltyPoints }
      });
    }
  } else {
    const recentTx = await LoyaltyTransaction.findOne({
      customerPhone: cleanPhone,
      type: 'EARNED_FEEDBACK',
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    });
    if (recentTx) {
      return res.status(400).json({
        success: false,
        message: 'A feedback reward was already credited recently for your account. Thank you!'
      });
    }
  }

  const bonusPoints = 50; // +50 AURA Points
  user.loyaltyPoints = (user.loyaltyPoints || 0) + bonusPoints;
  user.lifetimePoints = (user.lifetimePoints || 0) + bonusPoints;
  user.loyaltyTier = calculateTier(user.lifetimePoints);
  await user.save();

  const tx = await LoyaltyTransaction.create({
    userId: user._id,
    customerPhone: cleanPhone,
    orderId: orderId || undefined,
    type: 'EARNED_FEEDBACK',
    points: bonusPoints,
    balanceAfter: user.loyaltyPoints,
    description: `Dining Review Bonus (+${bonusPoints} PTS) for Order #${orderId || 'Recent Session'}`,
    metadata: { rating, feedback }
  });

  res.json({
    success: true,
    message: `🎉 +${bonusPoints} AURA Points added to your wallet! Thank you for reviewing your dining experience.`,
    data: {
      loyaltyPoints: user.loyaltyPoints,
      lifetimePoints: user.lifetimePoints,
      loyaltyTier: user.loyaltyTier,
      transaction: tx
    }
  });
});

// @desc    Admin / Cashier manual loyalty points adjustment
// @route   POST /api/loyalty/admin/adjust
// @access  Private / Staff / Admin
export const adminAdjustPoints = asyncHandler(async (req, res) => {
  const { phone, points, reason, adjustedBy } = req.body;
  const cleanPhone = String(phone || '').trim();
  const ptsNum = parseInt(points, 10);

  if (!cleanPhone || isNaN(ptsNum) || ptsNum === 0) {
    return res.status(400).json({ message: 'Valid phone and non-zero points adjustment amount required' });
  }

  const user = await User.findOne({ phone: cleanPhone });
  if (!user) {
    return res.status(404).json({ message: 'Customer with this phone number not found' });
  }

  const newBalance = Math.max(0, (user.loyaltyPoints || 0) + ptsNum);
  user.loyaltyPoints = newBalance;
  if (ptsNum > 0) {
    user.lifetimePoints = (user.lifetimePoints || 0) + ptsNum;
    user.loyaltyTier = calculateTier(user.lifetimePoints);
  }
  await user.save();

  const tx = await LoyaltyTransaction.create({
    userId: user._id,
    customerPhone: cleanPhone,
    type: 'ADMIN_ADJUSTMENT',
    points: ptsNum,
    balanceAfter: newBalance,
    description: reason || `Manual adjustment by ${adjustedBy || 'Staff'}`,
    metadata: { adjustedBy: adjustedBy || 'Cashier / Admin', reason }
  });

  res.json({
    success: true,
    message: `Successfully adjusted points for ${user.name} (${ptsNum > 0 ? `+${ptsNum}` : ptsNum} PTS). New balance: ${newBalance} PTS`,
    data: {
      loyaltyPoints: user.loyaltyPoints,
      loyaltyTier: user.loyaltyTier,
      transaction: tx
    }
  });
});
