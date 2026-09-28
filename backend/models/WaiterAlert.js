import mongoose from 'mongoose';

const waiterAlertSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  tableId: { type: String, required: true },
  tableNumber: { type: String, required: true },
  reason: { type: String, required: true, default: 'Call Waiter to Table' },
  timestamp: { type: String },
  status: { type: String, enum: ['PENDING', 'RESOLVED'], default: 'PENDING' },
  resolvedAt: { type: Date }
}, { timestamps: true });

// Index for high-speed active alerts query
waiterAlertSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('WaiterAlert', waiterAlertSchema);
