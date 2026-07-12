import { getListing, listListings } from '../services/listingService.js';
import {
  localizedCategoryName,
  t
} from '../shared/i18n.js';
import { renderPage } from '../shared/page.js';
import { escapeHtml, formatPrice, renderListingCard } from '../shared/listingView.js';

renderPage({
  activePage: 'listing',
  eyebrow: t('listing.eyebrow'),
  title: t('listing.title'),
  intro: t('listing.intro'),
  actions: `<a class="btn btn-outline-primary" href="/listing-form.html">${t('listing.postSimilar')}</a>`,
  content: `
    <div class="alert" data-listing-message hidden></div>
    <div data-listing-detail>
      <div class="surface-card p-4 text-center text-secondary">${t('listing.loading')}</div>
    </div>
    <section class="mt-5">
      <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h2 class="h4 fw-bold mb-0">${t('listing.similar')}</h2>
        <a class="btn btn-sm btn-outline-primary" href="/">${t('listing.browseMore')}</a>
      </div>
      <div class="row g-4" data-similar-listings></div>
    </section>
  `
});

const params = new URLSearchParams(window.location.search);
const detailEl = document.querySelector('[data-listing-detail]');
const similarEl = document.querySelector('[data-similar-listings]');
const messageEl = document.querySelector('[data-listing-message]');

function showMessage(message, type = 'danger') {
  messageEl.className = `alert alert-${type}`;
  messageEl.textContent = message;
  messageEl.hidden = false;
}

function renderPhoto(listing) {
  const photoUrl = listing.primaryPhoto?.publicUrl;

  if (!photoUrl) {
    return `
      <div class="listing-photo surface-card d-flex align-items-center justify-content-center">
        <span class="text-secondary fw-semibold">${t('listing.noPhoto')}</span>
      </div>
    `;
  }

  return `
    <div class="listing-photo surface-card listing-photo-image" style="background-image: url('${escapeHtml(photoUrl)}')">
      <span class="visually-hidden">${escapeHtml(listing.primaryPhoto.alt_text ?? listing.title)}</span>
    </div>
  `;
}

function renderDetail(listing) {
  const ownerName = escapeHtml(listing.owner?.display_name ?? t('listing.defaultSeller'));
  const ownerLocation = escapeHtml(listing.owner?.location ?? listing.location ?? '');
  const contactPhone = listing.contact_phone ?? listing.owner?.phone;
  const categoryName = escapeHtml(listing.category ? localizedCategoryName(listing.category) : t('listing.categoryFallback'));

  detailEl.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-7">
        ${renderPhoto(listing)}
      </div>
      <div class="col-lg-5">
        <article class="surface-card p-4 h-100">
          <div class="d-flex justify-content-between gap-3 align-items-start mb-2">
            <p class="text-secondary mb-0">${escapeHtml(listing.location)}</p>
            <span class="badge text-bg-light">${categoryName}</span>
          </div>
          <h2 class="h3 fw-bold mb-2">${escapeHtml(listing.title)}</h2>
          <p class="price mb-3">${formatPrice(listing.price, listing.currency)}</p>
          <p class="text-secondary white-space-pre-line">${escapeHtml(listing.description)}</p>
          <hr />
          <h3 class="h6 fw-semibold">${t('listing.seller')}</h3>
          <p class="mb-1">${ownerName}</p>
          ${ownerLocation ? `<p class="text-secondary small mb-3">${ownerLocation}</p>` : ''}
          ${contactPhone
            ? `<a class="btn btn-primary w-100" href="tel:${escapeHtml(contactPhone)}">${t('listing.callSeller')}</a>`
            : `<a class="btn btn-primary w-100" href="/login.html">${t('listing.contactSeller')}</a>`
          }
        </article>
      </div>
    </div>
  `;
}

async function resolveListingId() {
  const id = params.get('id');

  if (id) {
    return id;
  }

  const { listings } = await listListings({ limit: 1 });
  return listings[0]?.id ?? null;
}

async function loadSimilarListings(currentListing) {
  const { listings, error } = await listListings({
    categoryId: currentListing.category_id,
    limit: 4
  });

  if (error) {
    similarEl.innerHTML = '';
    return;
  }

  const similarListings = listings.filter((listing) => listing.id !== currentListing.id).slice(0, 3);
  similarEl.innerHTML = similarListings.length > 0
    ? similarListings.map(renderListingCard).join('')
    : `<div class="col-12 text-secondary">${t('listing.noSimilar')}</div>`;
}

async function loadListing() {
  try {
    const listingId = await resolveListingId();

    if (!listingId) {
      detailEl.innerHTML = `<div class="surface-card p-4 text-center text-secondary">${t('listing.noActive')}</div>`;
      similarEl.innerHTML = '';
      return;
    }

    const { listing, error } = await getListing(listingId);

    if (error || !listing) {
      showMessage(t('listing.loadError'));
      detailEl.innerHTML = `<div class="surface-card p-4 text-center text-secondary">${t('listing.unavailable')}</div>`;
      similarEl.innerHTML = '';
      return;
    }

    document.title = `${listing.title} | NOTOLX`;
    renderDetail(listing);
    await loadSimilarListings(listing);
  } catch {
    showMessage(t('listing.configError'));
    detailEl.innerHTML = `<div class="surface-card p-4 text-center text-secondary">${t('listing.unavailable')}</div>`;
    similarEl.innerHTML = '';
  }
}

await loadListing();
