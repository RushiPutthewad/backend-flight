const BOOKING_STATUS = {
  PENDING: 'pending',
  PAYMENT_PENDING: 'payment_pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const ALLOWED_TRANSITIONS = {
  pending: ['payment_pending'],
  payment_pending: ['confirmed', 'failed', 'expired'],
  confirmed: ['cancelled'],
  failed: ['payment_pending'],
  expired: [],
  cancelled: [],
};

module.exports = { BOOKING_STATUS, ALLOWED_TRANSITIONS };
