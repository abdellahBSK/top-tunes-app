const router = require('express').Router();
const { fetchFromApple, getSongsFromDB } = require('../services/songService');

// GET /songs — cached from DB, optional ?search=
router.get('/', async (req, res, next) => {
  try {
    const songs = await getSongsFromDB(req.query.search || '');
    res.json({ ok: true, count: songs.length, songs });
  } catch (err) { next(err); }
});

// GET /songs/fetch — hit Apple API, refresh DB
router.get('/fetch', async (req, res, next) => {
  try {
    const songs = await fetchFromApple();
    res.json({ ok: true, count: songs.length, songs });
  } catch (err) { next(err); }
});

module.exports = router;
