const mongoose = require('mongoose');

/**
 * Song schema — stores one entry per top-10 track fetched from iTunes RSS.
 */
const songSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true },
    artist: { type: String, required: true },
    link:   { type: String, required: true },
    image:  { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Song', songSchema);
