import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes: verifies valid JWT in Authorization header
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No authentication token provided.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET is not configured.'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized: Token verification failed.' });
  }
};

const normalizeRole = (role) => {
  if (!role) return 'CUSTOMER';
  const upper = String(role).trim().toUpperCase();
  if (upper === 'ADMIN' || upper === 'RESTAURANT_OWNER' || upper === 'MANAGER') return 'OWNER';
  if (upper === 'KITCHEN') return 'CHEF';
  if (['OWNER', 'CASHIER', 'CHEF', 'WAITER', 'CUSTOMER'].includes(upper)) return upper;
  return 'CUSTOMER';
};

/**
 * Require specific user role(s): OWNER, CASHIER, CHEF, WAITER, CUSTOMER
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

    // OWNER has top-level super access across all staff actions
    if (!normalizedAllowed.includes(userRole) && userRole !== 'OWNER') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is ${userRole}.`
      });
    }

    next();
  };
};

/**
 * Optional authentication: attaches user if token is provided, otherwise proceeds as guest
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          req.user = await User.findById(decoded.id).select('-password');
        }
      }
    }
  } catch (_) {
    // Proceed silently without setting req.user
  }
  next();
};

export {
  protect,
  requireRole,
  optionalAuth
};
