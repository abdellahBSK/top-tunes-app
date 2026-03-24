const router = require('express').Router();
const { getLyrics } = require('../services/lyricsService');

// GET /lyrics?artist=...&title=...
router.get('/', async (req, res, next) => {
    try {
        const { artist, title } = req.query;

        if (!artist || !title) {
            return res.status(400).json({ error: 'Missing artist or title query parameters' });
        }

        const { lyrics, source } = await getLyrics(artist, title);

        if (!lyrics) {
            return res.status(404).json({
                error: 'Lyrics not found',
                source
            });
        }

        res.json({ ok: true, source, lyrics });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
