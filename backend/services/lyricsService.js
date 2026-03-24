const axios = require('axios');
const CacheService = require('../infrastructure/cache/cacheService');

// 24 hours in seconds
const CACHE_TTL_HIT = 24 * 60 * 60;
// 2 hours in seconds
const CACHE_TTL_MISS = 2 * 60 * 60;
const NOT_FOUND_FLAG = '__NOT_FOUND__';

/**
 * Robustly sanitizes a song title to improve API matches.
 * Strips out:
 * 1. Parentheses and brackets with "feat", "ft", "live", "remastered"
 * 2. Trailing "- Live", "- Remastered", etc.
 * @param {string} title 
 * @returns {string}
 */
function cleanTitle(title) {
    if (!title) return '';

    let cleaned = title;

    // Remove trailing details like "- Remastered", "- Live", "- Single Version"
    cleaned = cleaned.replace(/\s*-\s*(remastered|live|single version|radio edit|bonus track).*/i, '');

    // Remove content in parenthesis/brackets featuring "feat.", "ft.", "with", "remastered", "live"
    cleaned = cleaned.replace(/\s*[([].*?(feat\.?|ft\.?|remastered|live).*?[)\]]/gi, '');

    return cleaned.trim();
}

/**
 * Gets lyrics for a given artist and title.
 * Implements a Cache-Aside pattern with 2 TTL strategies.
 * @param {string} artist 
 * @param {string} title 
 * @returns {Promise<{lyrics: string | null, source: string}>}
 */
async function getLyrics(artist, title) {
    if (!artist || !title) return { lyrics: null, source: null };

    // Normalize key
    const cacheKey = `lyrics:${artist.toLowerCase().trim()}:${title.toLowerCase().trim()}`;

    // 1. Check Cache
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
        if (cachedData === NOT_FOUND_FLAG) {
            return { lyrics: null, source: 'cache_fallback' };
        }
        return { lyrics: cachedData, source: 'cache' };
    }

    // 2. Cache Miss - Fetch from API
    const tryFetch = async (queryTitle) => {
        try {
            const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(queryTitle)}`;
            const { data } = await axios.get(url, {
                timeout: 8000,
                headers: {
                    'User-Agent': 'MusicSelector App v1.0'
                }
            });
            if (data && (data.syncedLyrics || data.plainLyrics)) {
                return data.syncedLyrics || data.plainLyrics;
            }
        } catch (error) {
            // Return null on completely failed fetches (404s or timeouts) so we can retry or fallback
            if (error.response && error.response.status === 404) {
                return null;
            }
        }
        return null;
    };

    // Attempt 1: Raw Title
    let lyrics = await tryFetch(title);

    // Attempt 2: Cleaned Title
    if (!lyrics) {
        const cleaned = cleanTitle(title);
        if (cleaned !== title) {
            lyrics = await tryFetch(cleaned);
        }
    }

    // 3. Store Result in Cache
    if (lyrics) {
        await CacheService.set(cacheKey, lyrics, CACHE_TTL_HIT);
        return { lyrics, source: 'api' };
    } else {
        // Prevent hammering API for empty results
        await CacheService.set(cacheKey, NOT_FOUND_FLAG, CACHE_TTL_MISS);
        return { lyrics: null, source: 'api_fallback' };
    }
}

module.exports = {
    getLyrics,
    cleanTitle
};
