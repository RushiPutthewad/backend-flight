const mongoose = require('mongoose');
const { BOOKING_STATUS, ALLOWED_TRANSITIONS } = require('../constants/booking-status');

const passengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  passportNumber: String,
  passportExpiry: Date,
  nationality: String
}, { _id: true });

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight'
  },
  // For mock data - flight details embedded
  flightDetails: {
    flightNumber: String,
    airline: String,
    origin: String,
    destination: String,
    departureTime: Date,
    arrivalTime: Date,
    price: Number,
    currency: { type: String, default: 'USD' }
  },
  passengers: [passengerSchema],
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING
  },
  totalPrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  specialRequests: String,
  bookingReference: {
    type: String,
    unique: true,
    sparse: true
  },
  cancellationReason: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Generate booking reference before saving (format: BK-XXXXXX)
bookingSchema.pre('save', function() {
  if (!this.bookingReference) {
    // Generate 6-character alphanumeric reference
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let reference = '';
    for (let i = 0; i < 6; i++) {
      reference += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingReference = `BK-${reference}`;
  }
});

// Validate status transition
bookingSchema.methods.canTransitionTo = function(newStatus) {
  return ALLOWED_TRANSITIONS[this.status]?.includes(newStatus);
};

bookingSchema.methods.transitionTo = function(newStatus) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  this.status = newStatus;
  return this.save();
};

// Indexes (from section 4)
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ 'flightDetails.departureTime': 1 });
bookingSchema.index({ user: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;