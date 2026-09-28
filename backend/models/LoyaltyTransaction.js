import mongoose from 'mongoose';

const loyaltyTransactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  customerPhone: { 
    type: String, 
    required: true, 
    index: true 
  },
  orderId: { 
    type: String 
  },
  type: {
    type: String,
    enum: [
      'WELCOME_BONUS',
      'EARNED_DINING',
      'EARNED_FEEDBACK',
      'REDEEMED_ORDER',
      'REFUND_DEDUCTION',
      'ORDER_CANCEL_RESTORE',
      'ADMIN_ADJUSTMENT'
    ],
    required: true
  },
  points: { 
    type: Number, 
    required: true 
  },
  balanceAfter: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { timestamps: true });

export default mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
