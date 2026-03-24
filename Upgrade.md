# Music Selector v2

App 1 upgraded to surpass App 2 — with audio previews, favorites/playlist, search, dark/light mode, and a clean layered backend.

---
docker rm -f music-mongo music-redis music-backend 2>/dev/null; docker compose down 2>/dev/null

# Get a shell inside the mongo container
docker exec -it music-mongo mongosh

# Then inside mongosh:
use musicdb
db.songs.find().pretty()
db.favorites.find().pretty()
db.songs.countDocuments()  



I have implemented the "Ultimate Real Audio Synchronization" as you requested!

I replaced the old API with the industry-standard LRCLIB (lrclib.net) to fetch real synced LRC lyrics. However, since the iTunes previews are arbitrary 30-second clips cut from random parts of a song (like a chorus), perfectly aligning an exact timestamp of 00:00 isn't possible.

To solve this beautifully, I've implemented Interactive Offset Calibration in the frontend. If a preview starts in the middle of a song, you will see the full lyrics and a hint saying: "Preview unaligned? Tap the exact line you hear to sync it!". When you tap the lyric playing, the app instantly recalculates the offset for the rest of the clip, bringing the scrolling animation flawlessly in real-sync with the audio!

Everything is documented in the walkthrough. Feel free to try it out by reloading the app!

## What's new vs v1

| Feature | v1 | v2 |
|---|---|---|
| 30s audio preview | ✗ | ✅ via iTunes Lookup API |
| Playback progress bar | ✗ | ✅ animated |
| Favorites / playlist | ✗ | ✅ persisted in MongoDB |
| Search / filter | ✗ | ✅ client-side + text index |
| Dark / light mode toggle | ✗ | ✅ with system preference detection |
| Cached DB endpoint | ✗ | ✅ `GET /songs` (no Apple call) |
| Layered backend | ✗ | ✅ config / database / models / routes / services |
| Makefile | ✗ | ✅ `make dev`, `make build`, `make clean` |
| Vite proxy (no CORS in dev) | ✗ | ✅ |
| Express static serving (prod) | ✗ | ✅ serves built frontend |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vite (vanilla JS), HTML5, CSS3 |
| Backend | Node.js 20, Express, Axios, xml2js |
| Database | MongoDB 7 (Mongoose) |
| DevOps | Docker, Docker Compose, Makefile |

---

## Project structure

```
music-selector-v2/
├── backend/
│   ├── app/
│   │   └── createExpressApp.js   # App factory, middleware, routes
│   ├── config/
│   │   └── env.js                # Centralised env vars
│   ├── database/
│   │   └── mongo.js              # Mongoose connection
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handler
│   ├── models/
│   │   ├── songModel.js          # Song schema (+ text index)
│   │   └── favoriteModel.js      # Favorites schema
│   ├── routes/
│   │   ├── songRoutes.js         # GET /songs, GET /songs/fetch
│   │   └── favoriteRoutes.js     # GET/POST/DELETE /favorites
│   ├── services/
│   │   ├── songService.js        # iTunes RSS + Lookup enrichment
│   │   └── favoriteService.js    # Favorites CRUD
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── main.js                   # App init, audio, tabs, search, theme
│   ├── apiClient.js              # fetch wrappers for all endpoints
│   ├── ui.js                     # Render songs, favorites, skeleton, NowPlaying
│   ├── style.css                 # Dark/light theme, editorial aesthetic
│   ├── vite.config.js            # Dev proxy + prod build
│   └── package.json
├── docker-compose.yml
├── Makefile
└── .gitignore
```

---

## Quick start

### Development (recommended)
Runs the backend + MongoDB in Docker, frontend on Vite's dev server (with HMR):

```bash
make dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Vite proxies `/songs`, `/favorites`, `/health` to the backend — no CORS issues.

### Production build
Builds the frontend with Vite, then Express serves the `dist/` folder:

```bash
make build
```

- Everything at: http://localhost:5000

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/songs` | Return cached songs from MongoDB. Accepts `?search=` |
| `GET` | `/songs/fetch` | Hit Apple RSS + iTunes Lookup, refresh DB, return songs |
| `GET` | `/favorites` | Return all favorites |
| `POST` | `/favorites` | Add a song to favorites |
| `DELETE` | `/favorites/:trackId` | Remove a song from favorites |
| `GET` | `/health` | Health check |

---

## Makefile targets

| Target | Description |
|---|---|
| `make dev` | Start Docker backend + Vite dev server |
| `make build` | Build frontend, start full prod stack |
| `make up` | Docker-compose up (backend + mongo only) |
| `make down` | Stop containers |
| `make logs` | Follow backend logs |
| `make install` | npm install in both backend and frontend |
| `make clean` | Stop containers, remove volumes + node_modules |

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://mongo:27017/musicdb` | MongoDB connection string |
| `PORT` | `5000` | Express port |
| `NODE_ENV` | `development` | Set to `production` to serve Vite build |
