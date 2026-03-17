/**
 * main.js — Top 10 Music Selector
 *
 * Responsibilities:
 *  1. On page load, call /fetch to pull fresh iTunes data into MongoDB.
 *  2. Call /songs to retrieve and render the stored songs.
 *  3. Expose a Refresh button that re-runs both calls.
 *  4. Guard against concurrent fetch calls.
 */

const API_BASE = 'http://localhost:5000';

const loadingEl = document.getElementById('loading');
const gridEl = document.getElementById('song-grid');
const errorEl = document.getElementById('error-banner');
const refreshBtn = document.getElementById('refresh-btn');

let isFetching = false; // prevent concurrent calls

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Show/hide skeleton loader */
function setLoading(active) {
    loadingEl.classList.toggle('hidden', !active);
    gridEl.classList.toggle('hidden', active);
    errorEl.classList.add('hidden');
    refreshBtn.disabled = active;
    refreshBtn.classList.toggle('spinning', active);
}

/** Display an error message */
function showError(message) {
    errorEl.textContent = `⚠️  ${message}`;
    errorEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
}

/** Build a single song card element */
function createCard(song, rank) {
    const card = document.createElement('a');
    card.className = 'song-card';
    card.href = song.link || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', `${song.title} by ${song.artist} — listen on iTunes`);

    card.innerHTML = `
    <span class="card-rank">#${rank}</span>
    <div class="card-img-wrap">
      <img
        src="${song.image || 'https://placehold.co/300x300/161921/7c3aed?text=♪'}"
        alt="${song.title} album art"
        loading="lazy"
        onerror="this.src='https://placehold.co/300x300/161921/7c3aed?text=♪'"
      />
    </div>
    <div class="card-body">
      <div>
        <p class="card-title">${song.title}</p>
        <p class="card-artist">${song.artist}</p>
      </div>
      <span class="card-listen">Listen on iTunes</span>
    </div>
  `;

    return card;
}

/** Render an array of song objects into the grid */
function renderSongs(songs) {
    gridEl.innerHTML = '';

    if (!songs.length) {
        showError('No songs found. Try refreshing.');
        return;
    }

    songs.forEach((song, i) => {
        gridEl.appendChild(createCard(song, i + 1));
    });

    gridEl.classList.remove('hidden');
}

// ── Core data flow ─────────────────────────────────────────────────────────────

/**
 * Fetch fresh data from iTunes (via backend), then load stored songs.
 * Guarded by `isFetching` to prevent duplicate calls.
 */
async function loadSongs() {
    if (isFetching) return;
    isFetching = true;
    setLoading(true);

    try {
        // Step 1: trigger backend to fetch + store songs from iTunes RSS
        const fetchRes = await fetch(`${API_BASE}/fetch`);
        if (!fetchRes.ok) {
            const body = await fetchRes.json().catch(() => ({}));
            throw new Error(body.error || `Fetch failed with status ${fetchRes.status}`);
        }

        // Step 2: retrieve the stored songs and render them
        const songsRes = await fetch(`${API_BASE}/songs`);
        if (!songsRes.ok) {
            throw new Error(`Could not load songs (status ${songsRes.status})`);
        }

        const songs = await songsRes.json();
        renderSongs(songs);
    } catch (err) {
        console.error('[loadSongs]', err);
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        setLoading(false);
        isFetching = false;
    }
}

// ── Init ───────────────────────────────────────────────────────────────────────

refreshBtn.addEventListener('click', loadSongs);

// Load on page startup
loadSongs();
