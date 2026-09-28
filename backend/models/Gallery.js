import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  category: { type: String, enum: ['Ambiance', 'Food', 'Events', 'VIP Lounge'], default: 'Food' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Gallery', gallerySchema);
