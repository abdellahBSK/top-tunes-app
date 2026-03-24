const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchFromApple() {
  const r = await fetch(`${BASE}/songs/fetch`);
  if (!r.ok) throw new Error('Apple fetch failed');
  return r.json();
}

export async function getSongs(search = '') {
  const url = search
    ? `${BASE}/songs?search=${encodeURIComponent(search)}`
    : `${BASE}/songs`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Failed to load songs');
  return r.json();
}

export async function getFavorites() {
  const r = await fetch(`${BASE}/favorites`);
  if (!r.ok) throw new Error('Failed to load favorites');
  return r.json();
}

export async function addFavorite(song) {
  const r = await fetch(`${BASE}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  });
  return r.json();
}

export async function removeFavorite(trackId) {
  const r = await fetch(`${BASE}/favorites/${encodeURIComponent(trackId)}`, {
    method: 'DELETE',
  });
  return r.json();
}
