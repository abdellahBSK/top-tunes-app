const redisClient = require('./redisClient');
const { CACHE_TTL } = require('../../config/env');

/**
 * cacheService provides abstraction over raw Redis.
 * It swallows connection errors and returns `null` so services can gracefully fall back to DB.
 */
class CacheService {
    /**
     * Get parsed JSON value from cache
     * @param {string} key
     * @returns {Promise<any | null>}
     */
    static async get(key) {
        try {
            const data = await redisClient.get(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            console.warn(`[CacheService] Failed GET for key ${key}: ${error.message}`);
            return null; // Fail gracefully
        }
    }

    /**
     * Set JSON value in cache with TTL
     * @param {string} key
     * @param {any} value
     * @param {number} [ttl=CACHE_TTL]
     */
    static async set(key, value, ttl = CACHE_TTL) {
        try {
            const serialized = JSON.stringify(value);
            await redisClient.set(key, serialized, 'EX', ttl);
        } catch (error) {
            console.warn(`[CacheService] Failed SET for key ${key}: ${error.message}`);
        }
    }

    /**
     * Delete keys matching a pattern (e.g. invalidate search results)
     * @param {string} matchPattern
     */
    static async deletePattern(matchPattern) {
        try {
            const stream = redisClient.scanStream({
                match: matchPattern,
                count: 100
            });

            const keys = [];
            stream.on('data', (resultKeys) => {
                // `resultKeys` is an array of strings representing key names
                for (let i = 0; i < resultKeys.length; i++) {
                    keys.push(resultKeys[i]);
                }
            });

            stream.on('end', () => {
                if (keys.length > 0) {
                    redisClient.unlink(keys); // Non-blocking delete
                }
            });
        } catch (error) {
            console.warn(`[CacheService] Failed to delete pattern ${matchPattern}: ${error.message}`);
        }
    }
}

module.exports = CacheService;
