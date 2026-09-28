import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, can be guest
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1 },
  specialRequests: { type: String },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Reservation', reservationSchema);
