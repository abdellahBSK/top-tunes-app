# Project File Explainer - Music Selector v2

This document provides a detailed breakdown of every file in the project, organized by their respective functional roles.

---

## 🏗️ Root Configuration & DevOps

| File | Purpose |
|------|---------|
| `docker-compose.yml` | **Multi-container Orchestration**: Defines and runs the `mongo` (database) and `backend` (app) services. Handles networking, port mapping, and data volume persistence. |
| `Makefile` | **Command Runner**: Provides a simple interface for common tasks: `make dev` (start development stack), `make build` (build for production), `make clean` (reset environment). |
| `README.md` | **Documentation Entry Point**: Contains the high-level description, tech stack overview, quick-start guide, and core API summary. |
| `APP_WORKFLOW.md` | **Operational Guide**: Describes the end-to-end data flow, specifically how the backend integrates the Apple Music APIs and handles state. |
| `PROJECT_FILES.md` | **Current File Explorer**: (This file) A comprehensive index of the project's codebase. |

---

## ⚙️ Backend Layer (`backend/`)

The backend is built with Node.js and Express, following a modular "Layered Architecture".

### Entry & App Factory
- **`server.js`**: The primary entry point. It initializes the database connection and invokes the `createApp` factory to start the HTTP server.
- **`app/createExpressApp.js`**: An "App Factory" that configures Express middleware (CORS, JSON), initializes the routes, and handles static file serving when in production mode.

### Data & Configuration
- **`config/env.js`**: Centralized configuration that parses environment variables with sensible defaults for Local vs Docker environments.
- **`database/mongo.js`**: Encapsulates the Mongoose connection lifecycle and logging.

### Routes (The Controllers)
- **`routes/songRoutes.js`**: Maps URLs to the `songService`. Handles endpoints for loading cached songs and refreshing the list from Apple.
- **`routes/favoriteRoutes.js`**: Maps URLs to the `favoriteService` for adding, listing, and removing favorites.

### Services (The Business Logic)
- **`services/songService.js`**: **The Engine**. Fetches the initial JSON feed from Apple's RSS API, enriches it with sample audio previews via the Apple iTunes Lookup API, and upserts the results into MongoDB.
- **`services/favoriteService.js`**: Handles the logic for interacting with the database to manage the user's liked tracks.

### Models & Middleware
- **`models/songModel.js` / `favoriteModel.js`**: Defines the data structures (schemas) and indexes for interactions with the MongoDB collections.
- **`middleware/errorHandler.js`**: A global safety net that catches errors across the application and returns consistent JSON responses to the client.

### Build & Dependencies
- **`Dockerfile`**: Defines the optimized production image for the backend service.
- **`package.json`**: Lists backend-specific dependencies (Express, Mongoose, Axios, xml2js).

---

## 🌐 Frontend Layer (`frontend/`)

The frontend is a modern, responsive Single Page Application (SPA) using Vanilla JavaScript and Vite.

| File | Role |
|------|------|
| `index.html` | **The Skeleton**: Defines the base structure, navigation tabs, search inputs, and placeholders for dynamic rendering. |
| `main.js` | **The Brain**: The central orchestrator that manages state (songs, favorites, active theme, and the global audio player state). |
| `apiClient.js` | **The Connector**: Reusable `fetch` wrappers for all backend API endpoints. Centralizes URL building and error handling. |
| `ui.js` | **The Painter**: Contains all logic for building and updating the DOM, including the skeleton loaders, the track list cards, and the animated "Now Playing" bar. |
| `style.css` | **The Design System**: Defines the visual identity, dark/light theme variables, and responsive layout for desktop/mobile views. |
| `vite.config.js` | **The Builder**: Configures the development proxy so the frontend can talk to the backend without CORS issues, and handles the production build process. |
| `package.json` | Lists the Vite development tools and build scripts. |

---

## 📁 Other Files
- **`.gitignore`**: Specifies which files (like `node_modules`, `.env`, or build artifacts) should NOT be tracked by Git.
