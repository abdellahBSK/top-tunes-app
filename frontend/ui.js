export function renderSkeleton(container) {
  container.innerHTML = Array.from({ length: 10 }, (_, i) => `
    <div class="skeleton-card" style="animation-delay:${i * 0.05}s">
      <div class="skel skel-num"></div>
      <div class="skel skel-img"></div>
      <div>
        <div class="skel skel-text" style="width:60%;margin-bottom:6px"></div>
        <div class="skel skel-text" style="width:40%"></div>
      </div>
    </div>`).join('');
}

export function renderSongs(container, songs, { favIds, currentTrackId, onPlay, onFav }) {
  if (!songs.length) {
    container.innerHTML = `<div class="empty-state" style="padding:40px 0">
      <p>No songs found.</p></div>`;
    return;
  }
  container.innerHTML = songs.map((s, i) => {
    const isFav = favIds.has(s.trackId);
    const isPlaying = s.trackId === currentTrackId;
    return `
      <div class="song-card${isPlaying ? ' playing' : ''}"
           style="animation-delay:${i * 0.04}s"
           data-id="${s.trackId}"
           data-idx="${i}">
        <span class="song-rank">${s.rank ?? i + 1}</span>
        <div class="song-artwork-wrap">
          <img class="song-artwork" src="${s.image || ''}" alt="${s.title}" loading="lazy" />
          <div class="play-overlay">
            ${s.previewUrl
              ? `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><polygon points="6,4 16,10 6,16"/></svg>`
              : `<svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><path d="M8 10h4M10 8v4" stroke-linecap="round"/></svg>`
            }
          </div>
        </div>
        <div class="song-info">
          <div class="song-title">${s.title}</div>
          <div class="song-artist">${s.author}</div>
          ${s.genre ? `<div class="song-genre">${s.genre}</div>` : ''}
        </div>
        ${!s.previewUrl ? `<span class="no-preview">No preview</span>` : ''}
        <button class="btn-fav${isFav ? ' active' : ''}" data-id="${s.trackId}" title="${isFav ? 'Remove from playlist' : 'Add to playlist'}">
          <svg viewBox="0 0 20 20" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" width="18" height="18">
            <path d="M10 16s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 7c0 4.5-7 9-7 9z" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;
  }).join('');

  container.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-fav')) return;
      const idx = +card.dataset.idx;
      onPlay(songs[idx]);
    });
  });

  container.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const song = songs.find(s => s.trackId === id);
      onFav(song, btn.classList.contains('active'));
    });
  });
}

export function updateNowPlaying(song) {
  const bar = document.getElementById('now-playing');
  if (!song) { bar.style.display = 'none'; return; }
  bar.style.display = 'grid';
  document.getElementById('np-img').src = song.image || '';
  document.getElementById('np-title').textContent = song.title;
  document.getElementById('np-artist').textContent = song.author;
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('np-time').textContent = '0:00';
}

export function updateProgress(pct, seconds) {
  document.getElementById('progress-bar').style.width = `${pct}%`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  document.getElementById('np-time').textContent = `${m}:${s}`;
}

export function renderFavorites(container, emptyEl, favorites, { currentTrackId, onPlay, onRemove }) {
  if (!favorites.length) {
    container.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  const songs = favorites.map((f, i) => ({ ...f, rank: i + 1 }));
  container.innerHTML = songs.map((s, i) => {
    const isPlaying = s.trackId === currentTrackId;
    return `
      <div class="song-card${isPlaying ? ' playing' : ''}"
           style="animation-delay:${i * 0.04}s"
           data-id="${s.trackId}" data-idx="${i}">
        <span class="song-rank">${i + 1}</span>
        <div class="song-artwork-wrap">
          <img class="song-artwork" src="${s.image || ''}" alt="${s.title}" loading="lazy" />
          <div class="play-overlay">
            ${s.previewUrl
              ? `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><polygon points="6,4 16,10 6,16"/></svg>`
              : `<svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><path d="M8 10h4M10 8v4" stroke-linecap="round"/></svg>`
            }
          </div>
        </div>
        <div class="song-info">
          <div class="song-title">${s.title}</div>
          <div class="song-artist">${s.author}</div>
        </div>
        <button class="btn-fav active" data-id="${s.trackId}" title="Remove">
          <svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1.5" width="18" height="18">
            <path d="M10 16s-7-4.5-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 7c0 4.5-7 9-7 9z" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;
  }).join('');

  container.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-fav')) return;
      onPlay(songs[+card.dataset.idx]);
    });
  });
  container.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      onRemove(btn.dataset.id);
    });
  });
}
