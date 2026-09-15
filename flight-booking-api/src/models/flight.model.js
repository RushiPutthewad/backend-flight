const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
    unique: true
  },
  airline: {
    name: { type: String, required: true },
    code: { type: String, required: true } // e.g., "AA", "UA"
  },
  aircraft: {
    type: String,
    required: true
  },
  origin: {
    airport: { type: String, required: true }, // IATA code
    city: { type: String, required: true },
    country: { type: String, required: true }
  },
  destination: {
    airport: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
  },
  departureTime: {
    scheduled: { type: Date, required: true },
    actual: Date,
    estimated: Date
  },
  arrivalTime: {
    scheduled: { type: Date, required: true },
    actual: Date,
    estimated: Date
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'on_time', 'delayed', 'cancelled', 'departed', 'arrived'],
    default: 'scheduled'
  },
  prices: {
    economy: { type: Number, required: true },
    business: Number,
    first: Number
  },
  seats: {
    total: { type: Number, required: true },
    available: {
      economy: { type: Number, required: true },
      business: Number,
      first: Number
    }
  },
  amenities: {
    wifi: { type: Boolean, default: false },
    entertainment: { type: Boolean, default: false },
    power: { type: Boolean, default: false },
    meals: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for common queries
flightSchema.index({ 'origin.airport': 1, 'destination.airport': 1 });
flightSchema.index({ 'origin.city': 1, 'destination.city': 1 });
flightSchema.index({ departureTime: 1 });
flightSchema.index({ 'prices.economy': 1 });
flightSchema.index({ status: 1 });

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;