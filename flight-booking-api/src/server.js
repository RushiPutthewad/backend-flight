const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');

const startServer = async () => {
  try {
    // Check required env vars
    if (!env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to Data Sources
    await connectDB();
    await connectRedis();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close();
      await disconnectRedis();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
