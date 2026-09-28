import express from 'express';
import {
  getFaqs,
  getGallery,
  createReservation,
  getUserWishlist,
  toggleWishlistItem,
} from '../controllers/contentController.js';

const router = express.Router();

router.get('/faqs', getFaqs);
router.get('/gallery', getGallery);
router.post('/reservations', createReservation);
router.get('/users/:userId/wishlist', getUserWishlist);
router.post('/users/:userId/wishlist/toggle', toggleWishlistItem);

export default router;

