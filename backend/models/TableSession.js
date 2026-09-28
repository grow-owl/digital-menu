import mongoose from 'mongoose';

const tableSessionSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  sessionId: { type: String, required: true, unique: true }, // E.g. a random UUID for this specific dining session
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of users who joined this table
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // Orders placed during this session
  activeCart: [{ type: Object, default: [] }], // Real-time shared table cart items for all devices
  status: { type: String, enum: ['active', 'billing', 'completed', 'cancelled'], default: 'active' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  totalAmount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('TableSession', tableSessionSchema);
