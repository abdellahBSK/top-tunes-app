const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected:', MONGO_URI);
}

module.exports = { connectDB };
