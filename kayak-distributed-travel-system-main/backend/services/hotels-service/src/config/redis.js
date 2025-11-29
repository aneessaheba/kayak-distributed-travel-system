const redis = require('redis');
require('dotenv').config();

let client = null;
let isConnected = false;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            console.log('⚠️  Redis connection failed after retries, continuing without Redis');
            return false;
          }
          return 1000;
        }
      }
    });

    client.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.error('❌ Redis error:', err.message);
      }
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isConnected = true;
    });

    await client.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️  Service will continue without Redis caching');
    isConnected = false;
  }
};

// Get from cache
const getCache = async (key) => {
  if (!isConnected || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error.message);
    return null;
  }
};

// Set cache with expiry (default 1 hour)
const setCache = async (key, value, expiry = 3600) => {
  if (!isConnected || !client) return;
  try {
    await client.setEx(key, expiry, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error.message);
  }
};

// Delete from cache
const deleteCache = async (key) => {
  if (!isConnected || !client) return;
  try {
    await client.del(key);
  } catch (error) {
    console.error('Redis delete error:', error.message);
  }
};

// Clear cache by pattern (e.g., 'hotels:*')
const clearCachePattern = async (pattern) => {
  if (!isConnected || !client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Redis clear pattern error:', error.message);
  }
};

const disconnectRedis = async () => {
  if (client && isConnected) {
    try {
      await client.quit();
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error.message);
    }
  }
};

module.exports = {
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  disconnectRedis
};
