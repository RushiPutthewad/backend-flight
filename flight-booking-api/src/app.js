const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const env = require('./config/env');
const errorHandler = require('./middlewares/error-handler');
const notFound = require('./middlewares/not-found');
const mongoose = require('mongoose');
const { redisClient } = require('./config/redis');

// Initialize app
const app = express();

// Global Middlewares
app.use(helmet()); // Security headers
app.use(cors({ origin: env.CLIENT_URL, credentials: true })); // CORS
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger })); // Request logging

// Health Check Route
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    database: mongoStatus,
    redis: redisStatus,
    timestamp: new Date(),
  });
});

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/tasks', require('./routes/task.routes'));
app.use('/api/v1/flights', require('./routes/flight.routes'));
app.use('/api/v1/bookings', require('./routes/booking.routes'));

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
