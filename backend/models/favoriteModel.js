const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  trackId:    { type: String, required: true, unique: true },
  title:      { type: String, required: true },
  author:     { type: String, required: true },
  image:      { type: String },
  previewUrl: { type: String },
  addedAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Favorite', favoriteSchema);
