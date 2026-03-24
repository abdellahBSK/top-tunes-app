import { fetchFromApple, getSongs, getFavorites, addFavorite, removeFavorite, getLyrics } from './apiClient.js';
import { renderSkeleton, renderSongs, updateNowPlaying, updateProgress, renderFavorites, renderLyrics, showLyricsLoading, hideLyrics, updateLyricsSync } from './ui.js';

// ── State ──────────────────────────────────────────────────────
let songs = [];
let favorites = [];
let favIds = new Set();
let currentSong = null;
let isFetching = false;

const audio = document.getElementById('audio-player');

// ── Elements ───────────────────────────────────────────────────
const songListEl = document.getElementById('song-list');
const skeletonEl = document.getElementById('skeleton');
const favListEl = document.getElementById('favorites-list');
const favEmptyEl = document.getElementById('favorites-empty');
const favCountEl = document.getElementById('fav-count');
const btnRefresh = document.getElementById('btn-refresh');
const btnTheme = document.getElementById('btn-theme');
const btnStop = document.getElementById('np-stop');
const searchInput = document.getElementById('search-input');
const iconMoon = document.getElementById('icon-moon');
const iconSun = document.getElementById('icon-sun');

// ── Theme ──────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  iconMoon.style.display = t === 'dark' ? 'none' : 'block';
  iconSun.style.display = t === 'dark' ? 'block' : 'none';
}
btnTheme.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ── Tabs ───────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn[data-tab]').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(s =>
      s.classList.toggle('active', s.id === `tab-${tab}`));
    if (tab === 'favorites') refreshFavorites();
  });
});

// ── Audio ──────────────────────────────────────────────────────
function playSong(song) {
  if (!song.previewUrl) return;
  if (currentSong?.trackId === song.trackId) {
    stopSong(); return;
  }
  currentSong = song;
  audio.src = song.previewUrl;
  audio.play().catch(() => { });
  updateNowPlaying(song);
  document.getElementById('now-playing').style.display = 'grid';
  rerenderLists();

  showLyricsLoading();
  getLyrics(song.author, song.title)
    .then(data => renderLyrics(data?.lyrics))
    .catch(() => renderLyrics(null));
}

function stopSong() {
  audio.pause();
  audio.src = '';
  currentSong = null;
  updateNowPlaying(null);
  rerenderLists();
  hideLyrics();
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  updateProgress(pct, audio.currentTime);
  updateLyricsSync(audio.currentTime, audio.duration);
});
audio.addEventListener('ended', stopSong);
btnStop?.addEventListener('click', stopSong);

// ── Render helpers ─────────────────────────────────────────────
function rerenderLists() {
  renderSongs(songListEl, filteredSongs(), {
    favIds, currentTrackId: currentSong?.trackId,
    onPlay: playSong, onFav: handleFav,
  });
  renderFavorites(favListEl, favEmptyEl, favorites, {
    currentTrackId: currentSong?.trackId,
    onPlay: playSong, onRemove: handleRemoveFav,
  });
}

function filteredSongs() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return songs;
  return songs.filter(s =>
    s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q));
}

// ── Favorites ──────────────────────────────────────────────────
async function refreshFavorites() {
  try {
    const data = await getFavorites();
    favorites = data.favorites || [];
    favIds = new Set(favorites.map(f => f.trackId));
    updateFavCount();
    renderFavorites(favListEl, favEmptyEl, favorites, {
      currentTrackId: currentSong?.trackId,
      onPlay: playSong, onRemove: handleRemoveFav,
    });
  } catch (e) { console.error(e); }
}

function updateFavCount() {
  favCountEl.textContent = favorites.length;
  favCountEl.style.display = favorites.length ? 'flex' : 'none';
}

async function handleFav(song, isAlreadyFav) {
  if (isAlreadyFav) {
    await handleRemoveFav(song.trackId);
  } else {
    await addFavorite(song);
    await refreshFavorites();
    rerenderLists();
  }
}

async function handleRemoveFav(trackId) {
  await removeFavorite(trackId);
  await refreshFavorites();
  rerenderLists();
}

// ── Load songs ─────────────────────────────────────────────────
async function loadSongs(fromApple = false) {
  if (isFetching) return;
  isFetching = true;
  btnRefresh.classList.add('loading');
  btnRefresh.textContent = 'Loading…';
  skeletonEl.style.display = 'flex';
  songListEl.innerHTML = '';

  try {
    const data = fromApple ? await fetchFromApple() : await getSongs();
    songs = data.songs || [];
  } catch {
    songs = [];
    songListEl.innerHTML = `<div class="empty-state"><p>Could not load songs.</p>
      <p class="empty-sub">Make sure the backend is running.</p></div>`;
  }

  skeletonEl.style.display = 'none';
  rerenderLists();
  isFetching = false;
  btnRefresh.classList.remove('loading');
  btnRefresh.innerHTML = `<svg viewBox="0 0 20 20" fill="none" width="16" height="16">
    <path d="M4 10a6 6 0 1 0 1.5-3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M4 5.5V10h4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg> Refresh`;
}

// ── Search ─────────────────────────────────────────────────────
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    renderSongs(songListEl, filteredSongs(), {
      favIds, currentTrackId: currentSong?.trackId,
      onPlay: playSong, onFav: handleFav,
    });
  }, 200);
});

// ── Refresh button ─────────────────────────────────────────────
btnRefresh.addEventListener('click', () => loadSongs(true));

// ── Skeleton render ────────────────────────────────────────────
renderSkeleton(skeletonEl);

// ── Init ───────────────────────────────────────────────────────
initTheme();
loadSongs(false);   // load from DB first (fast)
refreshFavorites();
