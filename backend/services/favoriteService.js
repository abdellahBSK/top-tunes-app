const Favorite = require('../models/favoriteModel');

async function getFavorites() {
  return Favorite.find().sort({ addedAt: -1 }).lean();
}

async function addFavorite(song) {
  const existing = await Favorite.findOne({ trackId: song.trackId });
  if (existing) return { alreadyExists: true, favorite: existing };
  const fav = await Favorite.create(song);
  return { alreadyExists: false, favorite: fav };
}

async function removeFavorite(trackId) {
  const result = await Favorite.deleteOne({ trackId });
  return result.deletedCount > 0;
}

module.exports = { getFavorites, addFavorite, removeFavorite };
