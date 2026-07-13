import { listCategories, listListings } from '../services/listingService.js';
import {
  localizedCategoryDescription,
  localizedCategoryName,
  t
} from '../shared/i18n.js';
import { renderPage } from '../shared/page.js';
import { escapeHtml, renderListingCard } from '../shared/listingView.js';

const state = {
  search: '',
  categoryId: ''
};

renderPage({
  activePage: 'home',
  headingStyle: 'hero',
  eyebrow: t('home.eyebrow'),
  title: t('home.title'),
  intro: t('home.intro'),
  actions: `
    <a class="btn btn-primary btn-lg" href="/listing-form.html">${t('home.post')}</a>
    <a class="btn btn-outline-primary btn-lg" href="#browseListings">${t('home.browse')}</a>
  `,
  heroAside: `
    <div class="hero-panel p-3 p-sm-4">
      <form class="hero-search mb-4" id="listingSearchForm">
        <input
          class="form-control form-control-lg"
          name="search"
          type="search"
          placeholder="${t('home.search.placeholder')}"
          aria-label="${t('home.search.aria')}"
        />
        <button class="btn btn-primary btn-lg" type="submit">${t('home.search.button')}</button>
      </form>
      <div class="row g-3">
        <div class="col-6">
          <div class="hero-stat pt-3">
            <p class="h4 fw-bold mb-0" data-listing-count>0</p>
            <p class="text-secondary small mb-0">${t('home.activeOffers')}</p>
          </div>
        </div>
        <div class="col-6">
          <div class="hero-stat pt-3">
            <p class="h4 fw-bold mb-0" data-category-count>0</p>
            <p class="text-secondary small mb-0">${t('home.categories')}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  content: `
    <section id="browseListings">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <p class="eyebrow mb-2">${t('home.browseListings')}</p>
          <h2 class="h3 fw-bold mb-0">${t('home.freshFinds')}</h2>
        </div>
        <form class="d-flex flex-column flex-sm-row gap-2" id="listingFilterForm">
          <select class="form-select" name="category" aria-label="${t('home.filterAria')}">
            <option value="">${t('home.allCategories')}</option>
          </select>
          <button class="btn btn-outline-primary" type="submit">${t('home.filter')}</button>
        </form>
      </div>

      <div class="alert" data-listing-message hidden></div>
      <div class="row g-4 mb-5" data-listing-results>
        <div class="col-12">
          <div class="surface-card empty-state p-4">
            <div class="empty-state-title loading-dots">${t('home.loadingListings')}</div>
            <p class="mb-0">${t('home.loadingHint')}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="surface-card p-4">
      <div class="row g-3 align-items-center">
        <div class="col-lg-4">
          <p class="eyebrow mb-2">${t('home.browseByCategory')}</p>
          <h2 class="h4 fw-bold mb-0">${t('home.startWithNeed')}</h2>
        </div>
        <div class="col-lg-8">
          <div class="row g-3" data-category-grid>
            <div class="col-12">
              <div class="empty-state">
                <div class="empty-state-title loading-dots">${t('home.loadingCategories')}</div>
              </div>
            </div>
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

function renderEmptyState(title, body = '') {
  return `
    <div class="surface-card empty-state p-4">
      <div class="empty-state-title">${title}</div>
      ${body ? `<p class="mb-0">${body}</p>` : ''}
    </div>
  `;
}

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
    <option value="">${t('home.allCategories')}</option>
    ${categories.map((category) => `
      <option value="${category.id}">${escapeHtml(localizedCategoryName(category))}</option>
    `).join('')}
  `;
}

function renderCategoryGrid(categories) {
  if (categories.length === 0) {
    categoryGrid.innerHTML = `
      <div class="col-12">
        ${renderEmptyState(t('home.categoriesUnavailable'), t('home.categoriesUnavailableHint'))}
      </div>
    `;
    return;
  }

  categoryGrid.innerHTML = categories.map((category) => `
    <div class="col-6 col-md-4 col-xl-3">
      <button class="category-tile w-100" type="button" data-category-id="${category.id}">
        <span class="category-icon category-icon-${escapeHtml(category.slug)}">
          ${escapeHtml(localizedCategoryName(category).slice(0, 1))}
        </span>
        <span class="category-name">${escapeHtml(localizedCategoryName(category))}</span>
        <span class="category-description">${escapeHtml(localizedCategoryDescription(category))}</span>
      </button>
    </div>
  `).join('');
}

function renderListings(listings) {
  listingCountEl.textContent = listings.length.toString();

  if (listings.length === 0) {
    listingResults.innerHTML = `
      <div class="col-12">
        ${renderEmptyState(t('home.noMatches'), t('home.noMatchesHint'))}
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
    showMessage(t('home.configError'));
    categoryGrid.innerHTML = `
      <div class="col-12">
        ${renderEmptyState(t('home.categoriesUnavailable'), t('home.categoriesUnavailableHint'))}
      </div>
    `;
    categoryCountEl.textContent = '0';
    return;
  }

  const { categories, error } = result;

  if (error) {
    showMessage(t('home.categoriesLoadError'));
    categoryGrid.innerHTML = `
      <div class="col-12">
        ${renderEmptyState(t('home.categoriesUnavailable'), t('home.categoriesUnavailableHint'))}
      </div>
    `;
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
      <div class="surface-card empty-state p-4">
        <div class="empty-state-title loading-dots">${t('home.loadingListings')}</div>
        <p class="mb-0">${t('home.loadingHint')}</p>
      </div>
    </div>
  `;

  let result;

  try {
    result = await listListings({
      search: state.search,
      categoryId: state.categoryId
    });
  } catch {
    showMessage(t('home.configError'));
    listingCountEl.textContent = '0';
    listingResults.innerHTML = `
      <div class="col-12">
        ${renderEmptyState(t('home.listingsUnavailable'), t('home.categoriesUnavailableHint'))}
      </div>
    `;
    return;
  }

  const { listings, error } = result;

  if (error) {
    showMessage(t('home.listingsLoadError'));
    listingCountEl.textContent = '0';
    listingResults.innerHTML = `
      <div class="col-12">
        ${renderEmptyState(t('home.listingsUnavailable'), t('home.categoriesUnavailableHint'))}
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
