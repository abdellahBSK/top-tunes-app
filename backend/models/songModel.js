const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  author:     { type: String, required: true },
  image:      { type: String },
  previewUrl: { type: String },
  trackId:    { type: String, unique: true, sparse: true },
  genre:      { type: String },
  rank:       { type: Number },
}, { timestamps: true });

songSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Song', songSchema);
