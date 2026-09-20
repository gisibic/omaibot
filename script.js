const defaultCover = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#9564dd"/>
        <stop offset="1" stop-color="#8249d4"/>
      </linearGradient>
    </defs>
    <rect width="420" height="420" fill="#f8f7f2"/>
    <rect x="30" y="30" width="360" height="360" rx="36" fill="url(#g)"/>
    <rect x="72" y="84" width="276" height="150" rx="12" fill="#fdfdfd" fill-opacity="0.14"/>
    <rect x="108" y="140" width="204" height="22" rx="6" fill="#fff" fill-opacity="0.9"/>
    <rect x="108" y="176" width="156" height="18" rx="6" fill="#fff" fill-opacity="0.7"/>
    <circle cx="126" cy="270" r="22" fill="#fff" fill-opacity="0.85"/>
    <circle cx="208" cy="270" r="22" fill="#fff" fill-opacity="0.72"/>
    <circle cx="290" cy="270" r="22" fill="#fff" fill-opacity="0.62"/>
  </svg>
`)}`;

const state = {
  games: [],
  filtered: [],
  platform: 'all',
  query: '',
  visibleCount: 12,
};

const totalCountEl = document.querySelector('#totalCount');
const resultCountEl = document.querySelector('#resultCount');
const searchInput = document.querySelector('#searchInput');
const platformFilter = document.querySelector('#platformFilter');
const gameGrid = document.querySelector('#gameGrid');
const loadMoreBtn = document.querySelector('#loadMoreBtn');

function decodeHtmlEntities(text = '') {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function formatHeaderCount(value) {
  return `[ ${new Intl.NumberFormat('en-US').format(value)} ROMs ]`;
}

function getFilteredGames() {
  const query = state.query.trim().toLowerCase();

  return state.games.filter((game) => {
    const matchesPlatform = state.platform === 'all' || game.platform === state.platform;
    const matchesQuery = !query || decodeHtmlEntities(game.title).toLowerCase().includes(query);
    return matchesPlatform && matchesQuery;
  });
}

function populatePlatformOptions() {
  const platforms = [...new Set(state.games.map((game) => game.platform).filter(Boolean))].sort();
  platformFilter.innerHTML = '<option value="all">All Platforms</option>' +
    platforms.map((platform) => `<option value="${platform}">${platform}</option>`).join('');
}

function renderCard(game) {
  const safeTitle = decodeHtmlEntities(game.title || 'Untitled Game');
  const downloadLink = game.download_link || '#';

  return `
    <article class="game-card" aria-label="${safeTitle}">
      <div class="game-thumb">
        <img src="${game.thumbnail || defaultCover}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null;this.src='${defaultCover}'" />
      </div>
      <div class="game-card-body">
        <div class="card-top">
          <span class="badge platform">${game.platform || 'Retro'}</span>
          <span class="badge version">v${game.version || 'N/A'}</span>
        </div>
        <h4>${safeTitle}</h4>
        <div class="card-actions">
          <a class="button primary" href="${downloadLink}" target="_blank" rel="noopener noreferrer" download>
            Download ROM (.ZIP)
          </a>
        </div>
      </div>
    </article>
  `;
}

function updateCounts() {
  totalCountEl.textContent = formatHeaderCount(state.games.length);
  resultCountEl.textContent = new Intl.NumberFormat('en-US').format(state.filtered.length);
}

function renderGrid() {
  const visibleGames = state.filtered.slice(0, state.visibleCount);

  if (!visibleGames.length) {
    gameGrid.innerHTML = `
      <div class="empty-state">
        <h4>No games found matching your search.</h4>
      </div>
    `;
    loadMoreBtn.style.display = 'none';
    return;
  }

  gameGrid.innerHTML = visibleGames.map(renderCard).join('');
  loadMoreBtn.style.display = state.filtered.length > state.visibleCount ? 'inline-flex' : 'none';
}

function applyFilters() {
  state.filtered = getFilteredGames();
  state.visibleCount = Math.min(12, state.filtered.length || 12);
  renderGrid();
  updateCounts();
}

searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  applyFilters();
});

platformFilter.addEventListener('change', (event) => {
  state.platform = event.target.value;
  applyFilters();
});

loadMoreBtn.addEventListener('click', () => {
  state.visibleCount += 12;
  renderGrid();
});

fetch('games.json')
  .then((response) => {
    if (!response.ok) throw new Error('Could not load games.json');
    return response.json();
  })
  .then((games) => {
    state.games = (Array.isArray(games) ? games : [])
      .filter((game) => typeof game?.download_link === 'string' && game.download_link.trim() !== '')
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    populatePlatformOptions();
    applyFilters();
  })
  .catch((error) => {
    console.error(error);
    gameGrid.innerHTML = `
      <div class="empty-state">
        <h4>No games found matching your search.</h4>
      </div>
    `;
    totalCountEl.textContent = '[ 0 ROMs ]';
    resultCountEl.textContent = '0';
    loadMoreBtn.style.display = 'none';
  });
