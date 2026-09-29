import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  categoryId: { type: Number, required: true },
  categoryName: { type: String },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  
  isVegetarian: { type: Boolean, default: false },
  isNonVeg: { type: Boolean, default: false },
  isJain: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  isChefSpecial: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  spiceLevel: { type: Number, default: 0 },
  
  preparationTimeMinutes: { type: Number, required: true },
  calories: { type: Number },
  rating: { type: Number },
  reviewCount: { type: Number },
  
  ingredients: [{ type: String }],
  allergens: [{ type: String }],
  
  customizationGroups: [{
    id: { type: String },
    title: { type: String },
    required: { type: Boolean },
    options: [{
      id: { type: String },
      name: { type: String },
      price: { type: Number }
    }]
  }]
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
