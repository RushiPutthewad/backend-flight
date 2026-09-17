const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error connecting to MongoDB');
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
