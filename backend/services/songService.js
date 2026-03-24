const axios = require('axios');
const xml2js = require('xml2js');
const Song = require('../models/songModel');
const CacheService = require('../infrastructure/cache/cacheService');

const RSS_URL = 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.json';
const LOOKUP_URL = 'https://itunes.apple.com/lookup';

async function fetchFromApple() {
  // Fetch JSON feed (Apple updated their RSS to JSON)
  let entries = [];
  try {
    const { data } = await axios.get(RSS_URL, { timeout: 8000 });
    entries = data.feed?.results || [];
  } catch {
    // Fallback to XML feed
    const xmlUrl = 'https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.rss';
    const { data: xml } = await axios.get(xmlUrl, { timeout: 8000 });
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const items = parsed?.rss?.channel?.item || [];
    entries = (Array.isArray(items) ? items : [items]).map((item, i) => ({
      id: String(i),
      name: item.title,
      artistName: item['itunes:artist'] || 'Unknown',
      artworkUrl100: item['itunes:image']?.$?.href || '',
    }));
  }

  // Enrich with iTunes Lookup for previewUrl
  const enriched = await Promise.all(
    entries.map(async (entry, index) => {
      const trackId = entry.id?.split('/')?.pop() || entry.id;
      let previewUrl = null;
      try {
        const { data: lookup } = await axios.get(LOOKUP_URL, {
          params: { id: trackId },
          timeout: 6000,
        });
        previewUrl = lookup.results?.[0]?.previewUrl || null;
      } catch { /* preview not critical */ }

      return {
        trackId,
        rank: index + 1,
        title: entry.name || entry.title,
        author: entry.artistName || 'Unknown',
        image: (entry.artworkUrl100 || '').replace('100x100', '400x400'),
        previewUrl,
        genre: entry.primaryGenreName || '',
      };
    })
  );

  // Upsert all songs
  await Song.deleteMany({});
  await Song.insertMany(enriched);

  // Update main cache and invalidate search caches
  await CacheService.set('songs:top10', enriched);
  await CacheService.deletePattern('songs:search:*');

  return enriched;
}

async function getSongsFromDB(search = '') {
  const cacheKey = search ? `songs:search:${search}` : 'songs:top10';

  // 1. Check Cache
  const cachedData = await CacheService.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // 2. Cache Miss -> Check DB
  let songs;
  if (search) {
    songs = await Song.find({ $text: { $search: search } }).sort({ rank: 1 }).lean();
  } else {
    songs = await Song.find().sort({ rank: 1 }).lean();
  }

  // 3. Store in Cache
  if (songs.length > 0) {
    await CacheService.set(cacheKey, songs);
  }

  return songs;
}

module.exports = { fetchFromApple, getSongsFromDB };
