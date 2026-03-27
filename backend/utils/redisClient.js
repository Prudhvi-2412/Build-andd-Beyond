const { createClient } = require('redis');
const { REDIS_URL, REDIS_ENABLED } = require('../config/constants');

let client = null;
let redisReady = false;

const isRedisEnabled = () => REDIS_ENABLED !== 'false';

const initRedis = async () => {
  if (!isRedisEnabled()) {
    console.log('Redis disabled via REDIS_ENABLED=false');
    return null;
  }

  if (!REDIS_URL) {
    console.log('Redis not configured (REDIS_URL missing); continuing without cache');
    return null;
  }

  if (client) return client;

  client = createClient({ url: REDIS_URL });

  client.on('error', (error) => {
    redisReady = false;
    console.error('Redis error:', error.message);
  });

  client.on('ready', () => {
    redisReady = true;
    console.log('Redis connected');
  });

  client.on('end', () => {
    redisReady = false;
    console.log('Redis connection closed');
  });

  try {
    await client.connect();
  } catch (error) {
    redisReady = false;
    console.error('Failed to connect Redis; continuing without cache:', error.message);
  }

  return client;
};

const getRedisClient = () => (redisReady && client ? client : null);

module.exports = {
  initRedis,
  getRedisClient,
};
