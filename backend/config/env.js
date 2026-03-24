module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://mongo:27017/musicdb',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
