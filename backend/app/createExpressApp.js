const express = require('express');
const cors = require('cors');
const path = require('path');
const { NODE_ENV } = require('../config/env');
const songRoutes = require('../routes/songRoutes');
const favoriteRoutes = require('../routes/favoriteRoutes');
const lyricsRoutes = require('../routes/lyricsRoutes');
const errorHandler = require('../middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/songs', songRoutes);
  app.use('/favorites', favoriteRoutes);
  app.use('/lyrics', lyricsRoutes);

  // Serve Vite build in production
  if (NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
