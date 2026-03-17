# Top 10 Music Selector

A full-stack application that fetches the **Top 10 songs** from the iTunes RSS feed, stores them in MongoDB, and displays them in a sleek dark-themed Vite frontend.

---

## Tech stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Frontend  | Vite (vanilla JS), HTML5, CSS3        |
| Backend   | Node.js 20, Express, Axios, xml2js    |
| Database  | MongoDB 7 (via Mongoose)              |
| DevOps    | Docker, Docker Compose                |

---

## Project structure

```
music-selector/
├── backend/
│   ├── models/
│   │   └── Song.js          # Mongoose schema
│   ├── routes/
│   │   └── songs.js         # GET /fetch  &  GET /songs
│   ├── server.js            # Express entry point
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── index.html
│   ├── main.js              # Fetch logic, card rendering
│   ├── style.css            # Dark theme, animations
│   └── package.json
└── docker-compose.yml
```

---

## Running the application

### Requirements

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2 (included with Docker Desktop)

### 1 — Start the backend + database

```bash
cd music-selector
docker-compose up --build
```

This will:
1. Pull and start **MongoDB 7** (port `27017`)
2. Build and start the **Node.js backend** (port `5000`)
3. The backend waits for MongoDB to be healthy before starting.

### 2 — Open the frontend

The frontend is a plain Vite app (no Docker container needed — open it directly):

```bash
cd frontend
npm install
npm run dev
```

Then visit **http://localhost:5173** in your browser.

> **Alternatively**, open `frontend/index.html` directly in your browser — it will still call `http://localhost:5000` for data.

---

## API endpoints

| Method | Endpoint  | Description                                      |
|--------|-----------|--------------------------------------------------|
| GET    | `/fetch`  | Pulls iTunes RSS, parses XML, stores in MongoDB  |
| GET    | `/songs`  | Returns all stored songs as JSON                 |
| GET    | `/health` | Simple health-check → `{ "status": "ok" }`       |

---

## Environment variables

| Variable    | Default                          | Description              |
|-------------|----------------------------------|--------------------------|
| `MONGO_URI` | `mongodb://mongo:27017/musicdb`  | MongoDB connection string |
| `PORT`      | `5000`                           | Express server port       |

---

## Features

- 🎵 **Live iTunes data** — fetched fresh on every page load
- 🔄 **Refresh button** — re-fetches without reloading the page
- 💀 **Skeleton loader** — animated shimmer while data loads
- 🚫 **Duplicate-call guard** — prevents concurrent fetch requests
- 📱 **Responsive grid** — 2-column on mobile, auto-fill on desktop
- 🎨 **Dark theme** — glassmorphism header, staggered card animations

---

## Stopping the services

```bash
docker-compose down          # stop containers
docker-compose down -v       # stop and remove MongoDB volume
```
