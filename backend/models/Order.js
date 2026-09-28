import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: Number, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['received', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'received'
  },
  isPrepared: { type: Boolean, default: false },
  cancelReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: String },
  customizations: [{
    groupId: String,
    groupTitle: String,
    optionId: String,
    optionName: String,
    price: Number
  }]
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // e.g. ORD-1234
  tableId: { type: String, required: true },
  customerPhone: { type: String },
  customerName: { type: String },
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['received', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'received'
  },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  pointsDiscount: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  pointsCredited: { type: Boolean, default: false },
  total: { type: Number, required: true },
  appliedCoupon: { type: String },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['UPI_QR', 'CARD_SWIPE', 'CASH', 'ONLINE', 'UPI', 'CARD'],
    default: 'CASH'
  },
  paidAt: { type: Date },
  invoiceNumber: { type: String },
  refundAmount: { type: Number, default: 0 },
  refundType: { type: String, enum: ['FULL', 'PARTIAL'] },
  refundReason: { type: String },
  refundedAt: { type: Date },
  refundedBy: { type: String },
  refundItems: [{
    name: String,
    quantity: Number,
    price: Number,
    reason: String
  }],
  refundHistory: [{
    amount: Number,
    reason: String,
    refundedBy: String,
    refundedAt: { type: Date, default: Date.now },
    items: Array,
    refundMethod: String
  }],
  netAmount: { type: Number },
  cancelReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: String }
}, { timestamps: true });

// Production Performance Compound Indexes
orderSchema.index({ tableId: 1, paymentStatus: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerPhone: 1 });

export default mongoose.model('Order', orderSchema);
