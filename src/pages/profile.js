import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'profile',
  eyebrow: 'Profile',
  title: 'Your marketplace profile',
  intro: 'Manage profile details and published listings from one place.',
  actions: '<a class="btn btn-primary" href="/listing-form.html">New listing</a>',
  content: `
    <div class="row g-4">
      <div class="col-lg-4">
        <section class="bg-white border rounded-3 p-4 h-100">
          <h2 class="h5 fw-semibold">Seller details</h2>
          <p class="text-secondary mb-1">Name</p>
          <p class="fw-semibold">Demo Seller</p>
          <p class="text-secondary mb-1">Location</p>
          <p class="fw-semibold mb-0">Sofia</p>
        </section>
      </div>
      <div class="col-lg-8">
        <section class="bg-white border rounded-3 p-4">
          <h2 class="h5 fw-semibold mb-3">My listings</h2>
          <div class="list-group">
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" href="/listing.html">
              <span>Used city bike</span>
              <span class="fw-semibold">BGN 240</span>
            </a>
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" href="/listing.html">
              <span>Wooden desk</span>
              <span class="fw-semibold">BGN 120</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  `
});
