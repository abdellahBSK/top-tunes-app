const router = require('express').Router();
const { getFavorites, addFavorite, removeFavorite } = require('../services/favoriteService');

router.get('/', async (req, res, next) => {
  try {
    const favorites = await getFavorites();
    res.json({ ok: true, count: favorites.length, favorites });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { alreadyExists, favorite } = await addFavorite(req.body);
    res.status(alreadyExists ? 200 : 201).json({ ok: true, alreadyExists, favorite });
  } catch (err) { next(err); }
});

router.delete('/:trackId', async (req, res, next) => {
  try {
    const deleted = await removeFavorite(req.params.trackId);
    res.json({ ok: deleted });
  } catch (err) { next(err); }
});

module.exports = router;
