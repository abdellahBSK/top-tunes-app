const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const Song = require('../models/Song');

const router = express.Router();

const ITUNES_RSS_URL =
    'https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topsongs/limit=10/xml';

/**
 * GET /fetch
 * Fetches the iTunes Top 10 RSS feed, parses XML, stores songs in MongoDB.
 */
router.get('/fetch', async (req, res) => {
    try {
        // 1. Fetch XML from iTunes
        const response = await axios.get(ITUNES_RSS_URL, { timeout: 10000 });

        // 2. Parse XML → JS object
        const parsed = await xml2js.parseStringPromise(response.data, {
            explicitArray: false,
            trim: true,
        });

        const entries = parsed.feed.entry;

        if (!entries || entries.length === 0) {
            return res.status(502).json({ error: 'No entries found in feed.' });
        }

        // 3. Map entries to our Song shape
        const songs = entries.map((entry) => {
            // iTunes returns multiple im:image sizes — grab the last (largest)
            const images = entry['im:image'];
            const image = Array.isArray(images)
                ? images[images.length - 1]._
                : images?._ ?? '';

            return {
                title: entry['im:name']?._ ?? entry['im:name'] ?? 'Unknown Title',
                artist: entry['im:artist']?._ ?? entry['im:artist'] ?? 'Unknown Artist',
                link: entry.link?.$.href ?? '',
                image,
            };
        });

        // 4. Replace existing songs with fresh data
        await Song.deleteMany({});
        const inserted = await Song.insertMany(songs);

        return res.json({ success: true, count: inserted.length, songs: inserted });
    } catch (err) {
        console.error('[/fetch] Error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch or store songs.', details: err.message });
    }
});

/**
 * GET /songs
 * Returns all stored songs from MongoDB.
 */
router.get('/songs', async (req, res) => {
    try {
        const songs = await Song.find().sort({ createdAt: -1 });
        return res.json(songs);
    } catch (err) {
        console.error('[/songs] Error:', err.message);
        return res.status(500).json({ error: 'Failed to retrieve songs.' });
    }
});

module.exports = router;
