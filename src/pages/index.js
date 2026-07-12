import { listCategories, listListings } from '../services/listingService.js';
import { renderPage } from '../shared/page.js';
import { escapeHtml, renderListingCard } from '../shared/listingView.js';

const state = {
  search: '',
  categoryId: ''
};

renderPage({
  activePage: 'home',
  headingStyle: 'hero',
  eyebrow: 'Local marketplace',
  title: 'Buy nearby. Sell without the noise.',
  intro: 'Find trusted local offers, compare prices quickly, and post what you no longer need in minutes.',
  actions: `
    <a class="btn btn-primary btn-lg" href="/listing-form.html">Post an item</a>
    <a class="btn btn-outline-primary btn-lg" href="#browseListings">Browse listings</a>
  `,
  heroAside: `
    <div class="hero-panel p-3 p-sm-4">
      <form class="hero-search mb-4" id="listingSearchForm">
        <input
          class="form-control form-control-lg"
          name="search"
          type="search"
          placeholder="Search bikes, phones, furniture"
          aria-label="Search listings"
        />
        <button class="btn btn-primary btn-lg" type="submit">Search</button>
      </form>
      <div class="row g-3">
        <div class="col-6">
          <div class="hero-stat pt-3">
            <p class="h4 fw-bold mb-0" data-listing-count>...</p>
            <p class="text-secondary small mb-0">Active offers</p>
          </div>
        </div>
        <div class="col-6">
          <div class="hero-stat pt-3">
            <p class="h4 fw-bold mb-0" data-category-count>...</p>
            <p class="text-secondary small mb-0">Categories</p>
          </div>
        </div>
      </div>
    </div>
  `,
  content: `
    <section id="browseListings">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <p class="eyebrow mb-2">Browse listings</p>
          <h2 class="h3 fw-bold mb-0">Fresh finds near you</h2>
        </div>
        <form class="d-flex flex-column flex-sm-row gap-2" id="listingFilterForm">
          <select class="form-select" name="category" aria-label="Filter by category">
            <option value="">All categories</option>
          </select>
          <button class="btn btn-outline-primary" type="submit">Filter</button>
        </form>
      </div>

      <div class="alert" data-listing-message hidden></div>
      <div class="row g-4 mb-5" data-listing-results>
        <div class="col-12">
          <div class="surface-card p-4 text-center text-secondary">Loading listings...</div>
        </div>
      </div>
    </section>

    <div class="surface-card p-4">
      <div class="row g-3 align-items-center">
        <div class="col-lg-4">
          <p class="eyebrow mb-2">Browse by category</p>
          <h2 class="h4 fw-bold mb-0">Start with what you need</h2>
        </div>
        <div class="col-lg-8">
          <div class="row g-3" data-category-grid>
            <div class="col-12 text-secondary">Loading categories...</div>
          </div>
        </div>
      </div>
    </div>
  `
});

const searchForm = document.querySelector('#listingSearchForm');
const filterForm = document.querySelector('#listingFilterForm');
const categorySelect = filterForm.elements.category;
const listingResults = document.querySelector('[data-listing-results]');
const categoryGrid = document.querySelector('[data-category-grid]');
const messageEl = document.querySelector('[data-listing-message]');
const listingCountEl = document.querySelector('[data-listing-count]');
const categoryCountEl = document.querySelector('[data-category-count]');

function showMessage(message, type = 'danger') {
  messageEl.className = `alert alert-${type}`;
  messageEl.textContent = message;
  messageEl.hidden = false;
}

function clearMessage() {
  messageEl.hidden = true;
  messageEl.textContent = '';
}

function renderCategoryOptions(categories) {
  categorySelect.innerHTML = `
    <option value="">All categories</option>
    ${categories.map((category) => `
      <option value="${category.id}">${escapeHtml(category.name)}</option>
    `).join('')}
  `;
}

function renderCategoryGrid(categories) {
  categoryGrid.innerHTML = categories.map((category) => `
    <div class="col-6 col-md-3">
      <button class="category-tile text-start w-100 border rounded-3 p-3 h-100 bg-white" type="button" data-category-id="${category.id}">
        <span class="fw-bold">${escapeHtml(category.name)}</span>
        <p class="text-secondary small mb-0 mt-1">${escapeHtml(category.description ?? 'Local offers')}</p>
      </button>
    </div>
  `).join('');
}

function renderListings(listings) {
  listingCountEl.textContent = listings.length.toString();

  if (listings.length === 0) {
    listingResults.innerHTML = `
      <div class="col-12">
        <div class="surface-card p-4 text-center text-secondary">
          No listings match your search yet.
        </div>
      </div>
    `;
    return;
  }

  listingResults.innerHTML = listings.map(renderListingCard).join('');
}

async function loadCategories() {
  let result;

  try {
    result = await listCategories();
  } catch {
    showMessage('Supabase is not configured. Add the project URL and anon key to .env.');
    categoryGrid.innerHTML = '<div class="col-12 text-secondary">Categories are unavailable.</div>';
    categoryCountEl.textContent = '0';
    return;
  }

  const { categories, error } = result;

  if (error) {
    showMessage('Categories could not be loaded. Check the Supabase schema and RLS policies.');
    categoryGrid.innerHTML = '<div class="col-12 text-secondary">Categories are unavailable.</div>';
    categoryCountEl.textContent = '0';
    return;
  }

  categoryCountEl.textContent = categories.length.toString();
  renderCategoryOptions(categories);
  renderCategoryGrid(categories);
}

async function loadListings() {
  clearMessage();
  listingResults.innerHTML = `
    <div class="col-12">
      <div class="surface-card p-4 text-center text-secondary">Loading listings...</div>
    </div>
  `;

  let result;

  try {
    result = await listListings({
      search: state.search,
      categoryId: state.categoryId
    });
  } catch {
    showMessage('Supabase is not configured. Add the project URL and anon key to .env.');
    listingCountEl.textContent = '0';
    listingResults.innerHTML = `
      <div class="col-12">
        <div class="surface-card p-4 text-center text-secondary">Listings are unavailable.</div>
      </div>
    `;
    return;
  }

  const { listings, error } = result;

  if (error) {
    showMessage('Listings could not be loaded. Check the Supabase schema and relationship names.');
    listingCountEl.textContent = '0';
    listingResults.innerHTML = `
      <div class="col-12">
        <div class="surface-card p-4 text-center text-secondary">Listings are unavailable.</div>
      </div>
    `;
    return;
  }

  renderListings(listings);
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.search = new FormData(searchForm).get('search')?.trim() ?? '';
  loadListings();
});

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.categoryId = categorySelect.value;
  loadListings();
});

categoryGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category-id]');

  if (!button) {
    return;
  }

  state.categoryId = button.dataset.categoryId;
  categorySelect.value = state.categoryId;
  loadListings();
  document.querySelector('#browseListings').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

await loadCategories();
await loadListings();
