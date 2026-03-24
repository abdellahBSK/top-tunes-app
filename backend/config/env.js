module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://mongo:27017/musicdb',
  REDIS_URI: process.env.REDIS_URI || 'redis://redis:6379',
  CACHE_TTL: parseInt(process.env.CACHE_TTL, 10) || 600,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
