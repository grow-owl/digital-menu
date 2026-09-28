import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, default: 4 },
  guestCount: { type: Number, default: 0 },
  qrToken: { type: String, required: true }, // The secure token embedded in the QR code
  status: { type: String, enum: ['available', 'occupied', 'billing', 'cleaning', 'reserved', 'maintenance'], default: 'available' },
  cleaningStartedAt: { type: Date },
  activeWaiterCall: {
    reason: { type: String },
    timestamp: { type: String },
    status: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);
