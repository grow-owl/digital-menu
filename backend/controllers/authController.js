import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/generateToken.js';

// @desc    Register a new customer account
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  
  if (!name || typeof name !== 'string' || !phone || typeof phone !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Name, phone number, and password are required strings.' });
  }

  const cleanPhone = phone.trim();
  if (cleanPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
  }

  const userExists = await User.findOne({ phone: cleanPhone });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'An account with this phone number already exists.' });
  }

  const user = await User.create({
    name: name.trim(),
    phone: cleanPhone,
    password
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: 'CUSTOMER',
      status: user.status || 'Standard',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: 'CUSTOMER',
        status: user.status || 'Standard'
      }
    }
  });
});

// @desc    Fast Mobile / Number-Only Login for Customers & Staff
// @route   POST /api/auth/phone-login, POST /api/auth/customer-quick-login
// @access  Public
export const phoneLogin = asyncHandler(async (req, res) => {
  const { phone, name } = req.body;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ success: false, message: 'Please provide a valid mobile number or staff code.' });
  }

  const rawInput = phone.trim().toLowerCase();

  const cleanDigits = rawInput.replace(/\D/g, '').slice(-10);

  if (cleanDigits.length !== 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please enter a valid 10-digit mobile number (e.g. 9876543210).' 
    });
  }

  let user = await User.findOne({ 
    $or: [{ phone: cleanDigits }, { phone: `+91${cleanDigits}` }] 
  });

  // Security: Staff accounts MUST NOT use passwordless phoneLogin
  if (user && user.role && user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Staff members must sign in via the Staff Portal using their credentials.'
    });
  }

  let isNewUser = false;
  let welcomeBonus = 0;

  if (!user) {
    isNewUser = true;
    welcomeBonus = 100;
    const customerName = (name && typeof name === 'string' && name.trim()) 
      ? name.trim() 
      : `Diner-${cleanDigits.slice(-4)}`;

    user = await User.create({
      name: customerName,
      phone: cleanDigits,
      password: 'aura@' + cleanDigits,
      role: 'customer',
      status: 'Standard'
    });
  } else if (name && typeof name === 'string' && name.trim() && user.name.startsWith('Diner-')) {
    user.name = name.trim();
    await user.save();
  }

  let rawRole = (user.role || 'customer').toLowerCase();
  let roleUpper = rawRole.toUpperCase();
  if (roleUpper === 'KITCHEN') roleUpper = 'CHEF';
  if (roleUpper === 'RESTAURANT_OWNER' || roleUpper === 'ADMIN' || roleUpper === 'MANAGER') roleUpper = 'OWNER';
  if (!['OWNER', 'CHEF', 'WAITER', 'CUSTOMER'].includes(roleUpper)) {
    roleUpper = 'CUSTOMER';
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return res.json({
    success: true,
    data: {
      token: accessToken,
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: roleUpper,
        status: user.status || 'Standard'
      }
    }
  });
});

// @desc    Staff & Customer standard login
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { identifier, email, phone, password } = req.body;
  const loginId = identifier || email || phone;

  if (!loginId || typeof loginId !== 'string') {
    return res.status(400).json({ success: false, message: 'Please provide valid credentials (phone or email).' });
  }

  // If password is not provided, allow ONLY customers to login with phone
  if (!password) {
    const cleanDigits = String(loginId).trim().replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number or your password.' });
    }

    const user = await User.findOne({ $or: [{ phone: cleanDigits }, { phone: `+91${cleanDigits}` }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register or enter password.' });
    }

    if (user.role && user.role !== 'customer') {
      return res.status(401).json({ success: false, message: 'Staff accounts require a password to sign in.' });
    }

    let roleUpper = 'CUSTOMER';
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: roleUpper,
          status: user.status
        }
      }
    });
  }

  const cleanId = String(loginId).trim().toLowerCase();
  const cleanDigits = String(loginId).trim().replace(/\D/g, '').slice(-10);

  let user = await User.findOne({
    $or: [
      { email: cleanId },
      { phone: cleanId },
      ...(cleanDigits.length === 10 ? [{ phone: cleanDigits }, { phone: `+91${cleanDigits}` }] : [])
    ]
  });

  if (user && (await user.matchPassword(password))) {
    let rawRole = (user.role || 'customer').toLowerCase();
    let roleUpper = rawRole.toUpperCase();
    if (roleUpper === 'KITCHEN') roleUpper = 'CHEF';
    if (roleUpper === 'RESTAURANT_OWNER' || roleUpper === 'ADMIN' || roleUpper === 'MANAGER') roleUpper = 'OWNER';
    if (!['OWNER', 'CHEF', 'WAITER', 'CUSTOMER'].includes(roleUpper)) {
      roleUpper = 'CUSTOMER';
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: roleUpper,
          status: user.status
        }
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/phone and password.' });
  }
});

// @desc    Get currently authenticated user profile
// @route   GET /api/auth/me
// @access  Private (JWT Protected)
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  let rawRole = (user.role || 'customer').toLowerCase();
  let roleUpper = rawRole.toUpperCase();
  if (roleUpper === 'KITCHEN') roleUpper = 'CHEF';
  if (roleUpper === 'RESTAURANT_OWNER' || roleUpper === 'ADMIN' || roleUpper === 'MANAGER') roleUpper = 'OWNER';
  if (!['OWNER', 'CHEF', 'WAITER', 'CUSTOMER'].includes(roleUpper)) {
    roleUpper = 'CUSTOMER';
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: roleUpper,
      status: user.status || 'Standard'
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private (JWT Protected)
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId, name, phone } = req.body;
  const targetId = req.user ? req.user._id : userId;

  if (!targetId) {
    return res.status(400).json({ message: 'User identifier required' });
  }

  const user = await User.findById(targetId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (phone && phone !== user.phone) {
    const cleanPhone = phone.trim();
    const phoneExists = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already in use by another account' });
    }
    user.phone = cleanPhone;
  }

  if (name && typeof name === 'string') {
    user.name = name.trim();
  }

  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      status: user.status
    }
  });
});

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required.'
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token.'
    });
  }

  if (!decoded || !decoded.id) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token payload.'
    });
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User belonging to this token no longer exists.'
    });
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  res.json({
    success: true,
    data: {
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  });
});

