const express = require('express');
const axios = require('axios');
const https = require('https');
const xml2js = require('xml2js');
const Song = require('../models/Song');

const router = express.Router();

const ITUNES_RSS_URL =
    'https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topsongs/limit=10/xml';

/**
 * Custom HTTPS agent that bypasses TLS hostname verification.
 *
 * Apple's ax.itunes.apple.com is served via Akamai CDN. The CDN's TLS
 * certificate is issued to *.akamaized.net, not ax.itunes.apple.com, which
 * causes Node's default TLS verifier to reject the connection with:
 *   "Hostname/IP does not match certificate's altnames"
 *
 * We scope rejectUnauthorized: false to this single agent so nothing else
 * in the process is affected.
 */
const itunesAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * GET /fetch
 * Fetches the iTunes Top 10 RSS feed, parses XML, stores songs in MongoDB.
 */
router.get('/fetch', async (req, res) => {
    try {
        // 1. Fetch XML from iTunes (custom agent handles Akamai TLS mismatch)
        const response = await axios.get(ITUNES_RSS_URL, {
            timeout: 10000,
            httpsAgent: itunesAgent,
        });

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

            // Handle link which can be an array of objects (one alternate text/html, one enclosure)
            const links = Array.isArray(entry.link) ? entry.link : [entry.link];
            const htmlLink = links.find(l => l?.$?.type === 'text/html') || links[0];
            const link = htmlLink?.$?.href ?? '';

            return {
                title: entry['im:name']?._ ?? entry['im:name'] ?? 'Unknown Title',
                artist: entry['im:artist']?._ ?? entry['im:artist'] ?? 'Unknown Artist',
                link,
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
