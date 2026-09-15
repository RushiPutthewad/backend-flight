require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-secret-change-in-production',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Flight Provider (optional)
  FLIGHT_PROVIDER_URL: process.env.FLIGHT_PROVIDER_URL,
  FLIGHT_PROVIDER_API_KEY: process.env.FLIGHT_PROVIDER_API_KEY,

  // Payment Provider (optional)
  PAYMENT_PROVIDER_SECRET: process.env.PAYMENT_PROVIDER_SECRET,
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,

  // Client
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};
