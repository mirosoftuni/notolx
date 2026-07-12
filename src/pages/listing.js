import { getListing, listListings } from '../services/listingService.js';
import { renderPage } from '../shared/page.js';
import { escapeHtml, formatPrice, renderListingCard } from '../shared/listingView.js';

renderPage({
  activePage: 'listing',
  eyebrow: 'Listing',
  title: 'Listing details',
  intro: 'View photos, seller details, price, and location.',
  actions: '<a class="btn btn-outline-primary" href="/listing-form.html">Post similar</a>',
  content: `
    <div class="alert" data-listing-message hidden></div>
    <div data-listing-detail>
      <div class="surface-card p-4 text-center text-secondary">Loading listing...</div>
    </div>
    <section class="mt-5">
      <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h2 class="h4 fw-bold mb-0">Similar listings</h2>
        <a class="btn btn-sm btn-outline-primary" href="/">Browse more</a>
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
        <span class="text-secondary fw-semibold">No photo yet</span>
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
  const ownerName = escapeHtml(listing.owner?.display_name ?? 'NOTOLX seller');
  const ownerLocation = escapeHtml(listing.owner?.location ?? listing.location ?? '');
  const contactPhone = listing.contact_phone ?? listing.owner?.phone;
  const categoryName = escapeHtml(listing.category?.name ?? 'Listing');

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
          <h3 class="h6 fw-semibold">Seller</h3>
          <p class="mb-1">${ownerName}</p>
          ${ownerLocation ? `<p class="text-secondary small mb-3">${ownerLocation}</p>` : ''}
          ${contactPhone
            ? `<a class="btn btn-primary w-100" href="tel:${escapeHtml(contactPhone)}">Call seller</a>`
            : '<a class="btn btn-primary w-100" href="/login.html">Contact seller</a>'
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
    : '<div class="col-12 text-secondary">No similar listings yet.</div>';
}

async function loadListing() {
  try {
    const listingId = await resolveListingId();

    if (!listingId) {
      detailEl.innerHTML = '<div class="surface-card p-4 text-center text-secondary">No active listings found.</div>';
      similarEl.innerHTML = '';
      return;
    }

    const { listing, error } = await getListing(listingId);

    if (error || !listing) {
      showMessage('Listing could not be loaded. Check the Supabase schema and relationship names.');
      detailEl.innerHTML = '<div class="surface-card p-4 text-center text-secondary">Listing unavailable.</div>';
      similarEl.innerHTML = '';
      return;
    }

    document.title = `${listing.title} | NOTOLX`;
    renderDetail(listing);
    await loadSimilarListings(listing);
  } catch {
    showMessage('Listing could not be loaded. Check Supabase configuration.');
    detailEl.innerHTML = '<div class="surface-card p-4 text-center text-secondary">Listing unavailable.</div>';
    similarEl.innerHTML = '';
  }
}

await loadListing();
