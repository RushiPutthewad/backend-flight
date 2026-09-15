const { createClient } = require('redis');
const env = require('./env');
const logger = require('./logger');

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.info(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    }
  }
});

redisClient.on('error', (err) => logger.error({ error: err.message }, 'Redis Client Error'));
redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('ready', () => logger.info('Redis Client Ready'));
redisClient.on('end', () => logger.info('Redis Client Disconnected'));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Redis connection established');
    }
  } catch (err) {
    logger.error({ error: err.message }, 'Could not connect to Redis');
    // Don't throw - allow app to continue without Redis (graceful degradation)
  }
};

const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis disconnected');
    }
  } catch (err) {
    logger.error({ error: err.message }, 'Error disconnecting Redis');
  }
};

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis
};
