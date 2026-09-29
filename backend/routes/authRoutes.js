import express from 'express';
import {
  registerUser,
  phoneLogin,
  loginUser,
  refreshAccessToken,
  updateUserProfile,
  getMe,
  verifyTerminalKey,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post(['/phone-login', '/customer-quick-login'], phoneLogin);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/verify-terminal', verifyTerminalKey);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

export default router;


