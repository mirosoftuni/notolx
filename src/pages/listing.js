import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'listing',
  eyebrow: 'Listing',
  title: 'Used city bike',
  intro: 'Lightweight frame, recently serviced brakes, and ready for everyday city rides.',
  actions: '<a class="btn btn-outline-primary" href="/listing-form.html">Post similar</a>',
  content: `
    <div class="row g-4">
      <div class="col-lg-7">
        <div class="listing-photo surface-card d-flex align-items-center justify-content-center">
          <span class="text-secondary fw-semibold">Listing photo</span>
        </div>
      </div>
      <div class="col-lg-5">
        <article class="surface-card p-4 h-100">
          <p class="text-secondary mb-1">Sofia, Bulgaria</p>
          <h2 class="h3 fw-bold mb-2">Used city bike</h2>
          <p class="price mb-3">BGN 240</p>
          <p class="text-secondary">
            Lightweight frame, recently serviced brakes, and ready for everyday city rides.
          </p>
          <hr />
          <h3 class="h6 fw-semibold">Seller</h3>
          <p class="mb-3">Maria Petrova</p>
          <a class="btn btn-primary w-100" href="/login.html">Contact seller</a>
        </article>
      </div>
    </div>
    <section class="mt-5">
      <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
        <h2 class="h4 fw-bold mb-0">Similar listings</h2>
        <a class="btn btn-sm btn-outline-primary" href="/">Browse more</a>
      </div>
      <div class="row g-4">
        ${[
          ['Road helmet', 'BGN 45', 'Sofia'],
          ['Bike lock', 'BGN 28', 'Pernik'],
          ['Kids scooter', 'BGN 85', 'Sofia']
        ].map(([title, price, location]) => `
          <div class="col-md-4">
            <a class="listing-card h-100" href="/listing.html">
              <div class="listing-card-media"></div>
              <div class="p-3">
                <p class="text-secondary small mb-1">${location}</p>
                <h3 class="h6 fw-bold mb-2">${title}</h3>
                <p class="listing-card-price mb-0">${price}</p>
              </div>
            </a>
          </div>
        `).join('')}
      </div>
    </section>
  `
});
