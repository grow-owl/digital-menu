import mongoose from 'mongoose';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper to construct query matching numeric id, string id, OR Mongoose _id
const getQueryById = (paramId) => {
  const num = Number(paramId);
  const isValidMongoId = mongoose.isValidObjectId(paramId);

  const conditions = [];
  if (!isNaN(num)) {
    conditions.push({ id: num });
  }
  conditions.push({ id: String(paramId) });
  if (isValidMongoId) {
    conditions.push({ _id: paramId });
  }

  return { $or: conditions };
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('displayOrder');
  res.json({ data: categories });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, displayOrder } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  const maxCat = await Category.findOne().sort('-id');
  const newId = maxCat ? maxCat.id + 1 : 1;

  const category = await Category.create({
    id: newId,
    name,
    icon: icon || 'Utensils',
    displayOrder: displayOrder || newId
  });

  res.status(201).json({ data: category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const query = getQueryById(req.params.id);
  const category = await Category.findOneAndUpdate(
    query,
    { $set: req.body },
    { new: true }
  );

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ data: category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const query = getQueryById(req.params.id);
  await Category.findOneAndDelete(query);
  res.json({ message: 'Category deleted successfully' });
});

// @desc    Get all menu items with search and category filtering
// @route   GET /api/menu-items
// @access  Public
export const getMenuItems = asyncHandler(async (req, res) => {
  const { categoryId, search, availableOnly } = req.query;
  const filter = {};

  if (categoryId) {
    filter.categoryId = Number(categoryId);
  }

  if (availableOnly === 'true') {
    filter.isAvailable = true;
  }

  if (search) {
    const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } }
    ];
  }

  const items = await MenuItem.find(filter).sort('id');
  res.json({ data: items });
});

// @desc    Get menu item by ID
// @route   GET /api/menu-items/:id
// @access  Public
export const getMenuItemById = asyncHandler(async (req, res) => {
  const query = getQueryById(req.params.id);
  const item = await MenuItem.findOne(query);
  if (!item) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  res.json({ data: item });
});

// @desc    Create new menu item
// @route   POST /api/menu-items
// @access  Private/Admin
export const createMenuItem = asyncHandler(async (req, res) => {
  const {
    categoryId,
    name,
    description,
    price,
    imageUrl,
    isVegetarian,
    isNonVeg,
    isJain,
    isGlutenFree,
    isChefSpecial,
    isBestSeller,
    isAvailable,
    spiceLevel,
    preparationTimeMinutes,
    calories,
    ingredients,
    allergens,
    customizationGroups
  } = req.body;

  if (!name || price === undefined || !categoryId) {
    return res.status(400).json({ message: 'Name, price, and categoryId are required' });
  }

  const maxItem = await MenuItem.findOne().sort('-id');
  const newId = maxItem ? maxItem.id + 1 : 1;

  const item = await MenuItem.create({
    id: newId,
    categoryId: Number(categoryId),
    name,
    description: description || '',
    price: Number(price),
    imageUrl: imageUrl || '',
    isVegetarian: isVegetarian || false,
    isNonVeg: isNonVeg || false,
    isJain: isJain || false,
    isGlutenFree: isGlutenFree || false,
    isChefSpecial: isChefSpecial || false,
    isBestSeller: isBestSeller || false,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    spiceLevel: Number(spiceLevel) || 0,
    preparationTimeMinutes: Number(preparationTimeMinutes) || 15,
    calories: Number(calories) || 250,
    rating: 4.8,
    ingredients: ingredients || [],
    allergens: allergens || [],
    customizationGroups: customizationGroups || []
  });

  res.status(201).json({ data: item });
});

// @desc    Update menu item
// @route   PUT /api/menu-items/:id
// @access  Private/Admin
export const updateMenuItem = asyncHandler(async (req, res) => {
  const query = getQueryById(req.params.id);
  const item = await MenuItem.findOneAndUpdate(
    query,
    { $set: req.body },
    { new: true }
  );
  if (!item) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  res.json({ data: item });
});

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const query = getQueryById(req.params.id);
  await MenuItem.findOneAndDelete(query);
  res.json({ message: 'Menu item deleted successfully' });
});
