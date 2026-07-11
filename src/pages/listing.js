import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'listing',
  eyebrow: 'Listing',
  title: 'Featured local offer',
  intro: 'A simple detail page shell for photos, price, seller info, and description.',
  actions: '<a class="btn btn-outline-primary" href="/listing-form.html">Post similar</a>',
  content: `
    <div class="row g-4">
      <div class="col-lg-7">
        <div class="listing-photo bg-white border rounded-3 d-flex align-items-center justify-content-center">
          <span class="text-secondary">Listing photo</span>
        </div>
      </div>
      <div class="col-lg-5">
        <article class="bg-white border rounded-3 p-4 h-100">
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
  `
});
