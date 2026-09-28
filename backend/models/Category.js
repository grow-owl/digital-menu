import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
