import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is missing.');
  }
  return secret;
};

/**
 * Generate Access Token (7d default for reliable station persistence) with cryptographically signed role
 */
export const generateAccessToken = (userId, role = 'CUSTOMER') => {
  const normalizedRole = String(role || 'CUSTOMER').toUpperCase();
  return jwt.sign(
    { id: userId, role: normalizedRole },
    getJwtSecret(),
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '7d',
    }
  );
};

/**
 * Generate long-lived Refresh Token (90d default)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    getRefreshSecret(),
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '90d',
    }
  );
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    getRefreshSecret()
  );
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
