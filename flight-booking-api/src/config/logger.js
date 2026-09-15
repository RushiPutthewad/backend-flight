const pino = require('pino');
const env = require('./env');

// Simple logger without pino-pretty to avoid optional dependency
const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info'
});

module.exports = logger;
