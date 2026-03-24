const Redis = require('ioredis');
const { REDIS_URI } = require('../../config/env');

const redisOptions = {
    // Graceful connection and retry strategy
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
};

const redisClient = new Redis(REDIS_URI, redisOptions);

redisClient.on('connect', () => {
    console.log('[Redis] Connected gracefully');
});

redisClient.on('error', (err) => {
    console.error('[Redis] Connection Error:', err.message);
});

module.exports = redisClient;
