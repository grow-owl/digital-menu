import mongoose from 'mongoose';
import Faq from '../models/Faq.js';
import Gallery from '../models/Gallery.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all active FAQs
// @route   GET /api/content/faqs
// @access  Public
export const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ data: faqs });
});

// @desc    Get all active gallery items
// @route   GET /api/content/gallery
// @access  Public
export const getGallery = asyncHandler(async (req, res) => {
  const galleryItems = await Gallery.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ data: galleryItems });
});

// @desc    Create dining reservation
// @route   POST /api/content/reservations
// @access  Public
export const createReservation = asyncHandler(async (req, res) => {
  const { userId, customerName, phone, email, date, time, partySize, specialRequests } = req.body;
  if (!customerName || !phone || !date) {
    return res.status(400).json({ success: false, message: 'Customer name, phone, and reservation date are required.' });
  }

  const numParty = Math.max(1, Math.min(50, parseInt(partySize, 10) || 2));

  const reservation = await Reservation.create({
    userId: userId && mongoose.isValidObjectId(userId) ? userId : null,
    customerName: String(customerName).trim().slice(0, 100),
    phone: String(phone).trim().slice(0, 20),
    email: email ? String(email).trim().slice(0, 100) : '',
    date: String(date),
    time: String(time || '19:30'),
    partySize: numParty,
    specialRequests: specialRequests ? String(specialRequests).slice(0, 300) : ''
  });
  
  res.status(201).json({ success: true, data: reservation });
});

// @desc    Get user wishlist
// @route   GET /api/content/users/:userId/wishlist
// @access  Private / Customer
export const getUserWishlist = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user identifier format.' });
  }

  const user = await User.findById(userId).populate('wishlist');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  res.json({ success: true, data: user.wishlist || [] });
});

// @desc    Toggle wishlist item for user
// @route   POST /api/content/users/:userId/wishlist/toggle
// @access  Private / Customer
export const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { itemId } = req.body;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user identifier format.' });
  }
  if (!itemId) {
    return res.status(400).json({ success: false, message: 'Dish item identifier is required.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.wishlist = user.wishlist || [];
  const itemIndex = user.wishlist.findIndex(id => String(id) === String(itemId));
  if (itemIndex > -1) {
    // Remove
    user.wishlist.splice(itemIndex, 1);
  } else {
    // Add
    user.wishlist.push(itemId);
  }
  await user.save();
  
  // Return populated wishlist
  const populatedUser = await User.findById(userId).populate('wishlist');
  res.json({ success: true, data: populatedUser.wishlist || [] });
});
