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
 * Generate short-lived Access Token (8h default)
 */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    getJwtSecret(),
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '8h',
    }
  );
};

/**
 * Generate long-lived Refresh Token (30d default)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    getRefreshSecret(),
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d',
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
