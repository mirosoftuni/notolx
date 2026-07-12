import {
  getCurrentLanguage,
  localizedCategoryName,
  t
} from './i18n.js';

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatPrice(price, currency = 'BGN') {
  const amount = Number(price ?? 0);

  return new Intl.NumberFormat(getCurrentLanguage() === 'bg' ? 'bg-BG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount);
}

export function renderListingCard(listing) {
  const photoUrl = listing.primaryPhoto?.publicUrl;
  const title = escapeHtml(listing.title);
  const location = escapeHtml(listing.location);
  const category = escapeHtml(listing.category ? localizedCategoryName(listing.category) : t('listing.categoryFallback'));
  const price = formatPrice(listing.price, listing.currency);

  return `
    <div class="col-md-6 col-xl-4">
      <a class="listing-card h-100" href="/listing.html?id=${encodeURIComponent(listing.id)}">
        <div
          class="listing-card-media d-flex align-items-start justify-content-end p-3"
          ${photoUrl ? `style="background-image: url('${escapeHtml(photoUrl)}')"` : ''}
        >
          <span class="badge text-bg-light">${category}</span>
        </div>
        <div class="p-4">
          <p class="text-secondary small mb-1">${location}</p>
          <h3 class="h5 fw-bold mb-2">${title}</h3>
          <p class="listing-card-price h5 mb-0">${price}</p>
        </div>
      </a>
    </div>
  `;
}
