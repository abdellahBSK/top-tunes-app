# Music Selector v2 - End-to-End Workflow

This document details the complete workflow, architecture, and data cycle of the **Music Selector v2** application.

---

## 1. System Architecture overview

The application uses a 3-tier architecture:
- **Frontend**: Vanilla HTML/JS/CSS utilizing Vite for bundling and hot-module reloading (HMR).
- **Backend**: Node.js v20 with Express, organized in a layered architecture (Routes -> Services -> Models).
- **Database**: MongoDB v7, used for persisting both the fetched songs and the user's favorites.

### Containerization (Docker)
Docker is used to standardize the environment across development and production:
- A `docker-compose.yml` file defines two services: `mongo` (creates the database) and `backend` (builds the Node.js application from a Dockerfile).
- The Mongo container utilizes health checks and a persistent volume (`mongo-data`) to retain data across restarts.
- The Backend container automatically connects to Mongo via the `MONGO_URI` internal docker network URL (`mongodb://mongo:27017/musicdb`).

---

## 2. End-to-End User & Data Workflow

### Initialization (Booting the App)
1. **Developer kicks off the stack** by running `make dev`.
2. **Backend & DB Boot**: Docker Compose starts the MongoDB container and builds/runs the Backend container on port 5000.
3. **Frontend Boot**: The Makefile spins up the Vite development server locally on port 5173. 
4. **CORS/Proxy Bypass**: Vite proxies any frontend requests bound for `/songs`, `/favorites`, and `/health` straight to `localhost:5000`, bypassing standard CORS constraints during development.

### Step 1: Loading Initial Data (The "Fast" Load)
When a user opens the web layout:
1. The frontend (`main.js`) triggers `loadSongs(false)`.
2. It hits the backend at `GET /songs`.
3. The backend fetches cached songs directly from the MongoDB database collection (no external API calls), ensuring an instant render.
4. The frontend simultaneously invokes `getFavorites()` fetching the user's liked tracks from the `/favorites` table. 

### Step 2: Fetching Fresh Data from Apple
If the user clicks the "Refresh" button (or hits an empty state where Apple needs to be queried):
1. The frontend calls `fetchFromApple()`, routing to `GET /songs/fetch`.
2. **Apple RSS Feed**: The backend `songService` queries the Apple Marketing API (`https://rss.applemarketingtools.com/...`) for the top 10 most played songs.
3. **Apple iTunes Lookup (Data Enrichment)**: The RSS feed doesn't contain audio previews. The backend loops through the entries, extracts the `trackId`, and makes sequential calls to the Apple iTunes Lookup API (`https://itunes.apple.com/lookup?id=...`). This yields the `previewUrl`.
4. **Database Sync**: The backend wipes the existing cached `songs` collection in Mongo and inserts this newly enriched track list.
5. The fresh queue is returned and hydrated dynamically into the frontend UI.

### Step 3: Audio Playback (HTML5 Audio)
1. When a user clicks play on a song, the frontend grabs the Apple `previewUrl`.
2. It sets this URL as the source of a hidden HTML5 `<audio id="audio-player">` element and invokes `.play()`.
3. An event listener tracks the `timeupdate` property of the audio stream, calculating the percentage progress and dynamically updating the customized playback progress bar CSS width. 

### Step 4: Interactivity (Favorites & Search)
- **Favorites**: Users clicking the heart icon triggers a `POST /favorites` with the song object. The backend saves this document to the MongoDB `favorites` collection. The frontend recalculates the Favs tab. Deselecting it triggers `DELETE /favorites/:trackId`.
- **Search Filtering**: When a user types in the search bar, the frontend debounce listens and filters the currently loaded array of songs by title/author (`filteredSongs()`), smoothly transitioning the DOM. Wait, the backend (`songService.js`) also provisions a `$text` search index trigger for `GET /songs?search=...` if needed by future pagination implementations!

### Step 5: Production Build Deployment (`make build`)
When preparing for production:
1. `make build` compiles minified standard JS/CSS assets into a `dist/` directory via Vite.
2. The `NODE_ENV` switches to `production`.
3. Express natively serves these static files from `dist/` when users visit the root. The separate Vite dev server is no longer necessary.

---

## 3. Summary of API integrations

| External API | Purpose | 
|--|--|
| `rss.applemarketingtools.com` | Fetches the raw Top 10 JSON/XML listing. |
| `itunes.apple.com/lookup` | Enriches the results with `previewUrl` audio streams. | 
