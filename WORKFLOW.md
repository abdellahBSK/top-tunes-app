# End-to-End Application Workflow

> **Top 10 Music Selector** — how data flows from Apple's iTunes RSS feed all the way to the browser.

---

## High-level diagram

```
Browser (Vite)
    │
    │  GET /fetch        GET /songs
    ▼                        ▼
Express Backend (port 5000)
    │                        │
    │  HTTP GET               │  Mongoose query
    ▼                        ▼
iTunes RSS API          MongoDB (port 27017)
ax.itunes.apple.com          musicdb.songs
```

---

## Step-by-step flow

### 1 — Page load

```
Browser
  └─► main.js: loadSongs() called
       ├─ setLoading(true)          → skeleton shimmer appears
       └─ fetch("http://localhost:5000/fetch")
```

The `isFetching` boolean guard is set to `true` immediately, preventing any concurrent call from the Refresh button or a re-render.

---

### 2 — Backend calls the iTunes RSS API

**Endpoint (GET, no auth required):**
```
https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/topsongs/limit=10/xml
```

| Part | Meaning |
|---|---|
| `ax.itunes.apple.com` | Apple's RSS gateway host |
| `/WebObjects/MZStoreServices.woa/ws/RSS` | WebObjects RSS service path |
| `/topsongs` | Chart type: top songs |
| `/limit=10` | Return at most 10 entries |
| `/xml` | Response format (alternative: `json`) |

**Other available chart types:**

| Path segment | Content |
|---|---|
| `/topsongs` | Top songs |
| `/topalbums` | Top albums |
| `/newreleases` | New releases |
| `/topaudiobooks` | Top audiobooks |

**Other limits:** `/limit=25`, `/limit=100`, etc.

---

### 3 — Raw XML response

Apple returns an Atom feed. Trimmed example:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:im="http://itunes.apple.com/rss">

  <title>iTunes Store: Top Songs</title>
  <updated>2026-03-17T00:00:00-07:00</updated>

  <!-- One <entry> per song (10 total) -->
  <entry>
    <im:name>Espresso</im:name>  <!-- song title -->
    <im:artist href="https://...">Sabrina Carpenter</im:artist>  <!-- artist name -->

    <!-- Three image sizes: 55px, 60px, 170px -->
    <im:image height="55">https://...55x55bb.jpg</im:image>
    <im:image height="60">https://...60x60bb.jpg</im:image>
    <im:image height="170">https://...170x170bb.jpg</im:image>

    <link href="https://music.apple.com/..."
          type="text/html"
          title="Espresso - Sabrina Carpenter"/>

    <id>https://music.apple.com/.../id1234567890</id>
    <im:contentType term="Song" label="Song"/>
  </entry>

  <!-- ... 9 more entries -->
</feed>
```

Key namespaces:

| Namespace | Prefix | Purpose |
|---|---|---|
| Atom (`w3.org/2005/Atom`) | _(default)_ | Feed structure, links |
| iTunes (`itunes.apple.com/rss`) | `im:` | Song-specific metadata |

---

### 4 — XML → JSON parsing (`xml2js`)

```js
// routes/songs.js
const parsed = await xml2js.parseStringPromise(response.data, {
  explicitArray: false,   // single-child tags become objects, not [arrays]
  trim: true,             // strip leading/trailing whitespace from values
});

const entries = parsed.feed.entry; // array of 10 song objects
```

After parsing, each entry looks like:

```json
{
  "im:name": { "_": "Espresso" },
  "im:artist": { "_": "Sabrina Carpenter", "$": { "href": "https://..." } },
  "im:image": [
    { "_": "https://...55x55bb.jpg",   "$": { "height": "55"  } },
    { "_": "https://...60x60bb.jpg",   "$": { "height": "60"  } },
    { "_": "https://...170x170bb.jpg", "$": { "height": "170" } }
  ],
  "link": { "$": { "href": "https://music.apple.com/..." } }
}
```

> `_` → the text node content  
> `$` → XML attributes  

---

### 5 — Data extraction & normalisation

```js
// routes/songs.js
const songs = entries.map((entry) => {
  // Grab the last image (largest, 170 px)
  const images = entry['im:image'];
  const image = Array.isArray(images)
    ? images[images.length - 1]._
    : images?._ ?? '';

  return {
    title:  entry['im:name']?._ ?? entry['im:name'] ?? 'Unknown Title',
    artist: entry['im:artist']?._ ?? entry['im:artist'] ?? 'Unknown Artist',
    link:   entry.link?.$.href ?? '',
    image,
  };
});
```

The `?._ ?? entry['im:someField']` double-check handles both object form `{ "_": "value" }` and plain string form `"value"`, which can vary depending on the feed version.

---

### 6 — MongoDB upsert

```js
// routes/songs.js
await Song.deleteMany({});          // clear stale data
const inserted = await Song.insertMany(songs);  // insert fresh 10 rows
```

The **clear-then-insert** strategy keeps the collection as a simple 10-row snapshot. No timestamps or IDs from Apple are persisted — only the four fields defined in the schema.

**Mongoose Song schema:**

```js
// models/Song.js
{
  title:  String,   // song title
  artist: String,   // artist name
  link:   String,   // iTunes Store URL
  image:  String,   // 170×170 album art URL
}
```

---

### 7 — `/fetch` response to frontend

```json
{
  "success": true,
  "count": 10,
  "songs": [ { "title": "...", "artist": "...", "link": "...", "image": "..." }, ... ]
}
```

---

### 8 — `/songs` query

```js
// routes/songs.js
const songs = await Song.find().sort({ createdAt: -1 });
```

Returns the same 10 rows sorted newest-first, ensuring chart order is deterministic even if a song was somehow inserted twice in a race condition.

---

### 9 — Frontend rendering

```js
// main.js
const songsRes = await fetch(`${API_BASE}/songs`);
const songs    = await songsRes.json();

songs.forEach((song, i) => {
  gridEl.appendChild(createCard(song, i + 1)); // rank = index + 1
});
```

Each card is an `<a>` tag linking to the iTunes Store URL, containing:
- Rank badge (`#1` … `#10`)
- Album art `<img>` (with fallback on error)
- Song title and artist name
- "Listen on iTunes →" label

CSS `animation-delay` on `:nth-child` selectors creates a staggered **fade-up** entrance for all 10 cards.

---

### 10 — Refresh flow

Clicking **Refresh** calls `loadSongs()` again:

1. `isFetching` guard checked → proceeds only if `false`
2. Skeleton re-shown, existing cards hidden
3. `/fetch` → iTunes → MongoDB (old 10 rows replaced)
4. `/songs` → new rows rendered

---

## Data flow summary

```
iTunes RSS (XML)
  └─► axios.get()                   [backend, routes/songs.js]
       └─► xml2js.parseStringPromise()
            └─► map entries → { title, artist, link, image }
                 └─► Song.deleteMany() + Song.insertMany()   [MongoDB]
                      └─► GET /songs → JSON array
                           └─► createCard() × 10             [browser DOM]
```

---

## Error handling at each stage

| Stage | Error | Handling |
|---|---|---|
| iTunes HTTP timeout | `axios` 10 s timeout | `500` + `{ error }` JSON |
| Empty feed | No entries in XML | `502` + `"No entries found"` |
| MongoDB down | Mongoose throws | Retry loop in `server.js` (every 5 s) |
| `/fetch` fails in browser | `fetchRes.ok === false` | Error banner shown in UI |
| Album art 404 | `<img>` load error | `onerror` fallback placeholder |
