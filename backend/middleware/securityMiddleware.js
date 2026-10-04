import rateLimit from 'express-rate-limit';

/**
 * Recursive sanitizer that cleans input objects against NoSQL injection & prototype pollution
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Strip keys starting with $ (MongoDB query operators like $where, $ne, $regex)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (value && typeof value === 'object') {
      cleanObj[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      // Trim excessive whitespaces
      cleanObj[key] = value.trim();
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

/**
 * Middleware: Sanitize req.body, req.query, and req.params against NoSQL injection
 */
const nosqlSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const cleaned = sanitizeObject(req.query);
    for (const key of Object.keys(req.query)) {
      delete req.query[key];
    }
    Object.assign(req.query, cleaned);
  }
  if (req.params && typeof req.params === 'object') {
    const cleaned = sanitizeObject(req.params);
    for (const key of Object.keys(req.params)) {
      delete req.params[key];
    }
    Object.assign(req.params, cleaned);
  }
  next();
};

/**
 * Rate Limiter for Authentication (Register, Login)
 * Max 20 attempts per 15 minutes per IP
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes for security.'
  }
});

/**
 * Rate Limiter for Order Placement
 * Max 200 orders per 15 minutes per IP
 */
const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many order requests submitted in a short period. Please wait a moment before trying again.'
  }
});

/**
 * General API Rate Limiter
 * 600 requests per minute per IP (~10 req/sec).
 * Exempts all safe, idempotent GET requests (polling, menu browsing, table status, KDS) and preflights.
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute rolling window
  max: 600,
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    if (req.method === 'OPTIONS' || req.path === '/health' || req.path === '/') return true;
    // Safe idempotent GET requests across restaurant POS, menu, order tracking, and KDS never trigger rate limit
    if (req.method === 'GET') return true;
    return false;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded. Please wait a moment before trying again.'
  }
});

export {
  nosqlSanitizer,
  authRateLimiter,
  orderRateLimiter,
  generalRateLimiter
};
