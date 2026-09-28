import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Category Routes
router.route('/categories')
  .get(getCategories)
  .post(protect, requireRole('owner'), createCategory);

router.route('/categories/:id')
  .put(protect, requireRole('owner'), updateCategory)
  .delete(protect, requireRole('owner'), deleteCategory);

// Menu Item Routes
router.route('/menu-items')
  .get(getMenuItems)
  .post(protect, requireRole('owner', 'chef'), createMenuItem);

router.route('/menu-items/:id')
  .get(getMenuItemById)
  .put(protect, requireRole('owner', 'chef'), updateMenuItem)
  .delete(protect, requireRole('owner'), deleteMenuItem);

export default router;
