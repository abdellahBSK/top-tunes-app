const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const songRoutes = require('./routes/songs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/musicdb';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/', songRoutes);

// Health-check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Database connection ─────────────────────────────────────────────────────
const connectWithRetry = () => {
    console.log('[DB] Attempting MongoDB connection…');
    mongoose
        .connect(MONGO_URI)
        .then(() => {
            console.log('[DB] Connected to MongoDB:', MONGO_URI);
            // Start the server only after DB is ready
            app.listen(PORT, () => {
                console.log(`[Server] Running on http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error('[DB] Connection failed. Retrying in 5 s…', err.message);
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();
