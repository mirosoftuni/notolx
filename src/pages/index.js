import { renderPage } from '../shared/page.js';

const featuredListings = [
  {
    title: 'City bike with new tires',
    location: 'Sofia',
    price: 'BGN 240',
    tag: 'Sports'
  },
  {
    title: 'Oak dining table',
    location: 'Plovdiv',
    price: 'BGN 420',
    tag: 'Home'
  },
  {
    title: 'iPhone 14 Pro',
    location: 'Varna',
    price: 'BGN 1,450',
    tag: 'Phones'
  }
];

const categories = ['Phones', 'Cars', 'Home', 'Jobs'];

renderPage({
  activePage: 'home',
  headingStyle: 'hero',
  eyebrow: 'Local marketplace',
  title: 'Buy nearby. Sell without the noise.',
  intro: 'Find trusted local offers, compare prices quickly, and post what you no longer need in minutes.',
  actions: `
    <a class="btn btn-primary btn-lg" href="/listing-form.html">Post an item</a>
    <a class="btn btn-outline-primary btn-lg" href="/listing.html">Browse listings</a>
  `,
  heroAside: `
    <div class="hero-panel p-3 p-sm-4">
      <form class="hero-search mb-4">
        <input class="form-control form-control-lg" type="search" placeholder="Search bikes, phones, furniture" aria-label="Search listings" />
        <button class="btn btn-primary btn-lg" type="submit">Search</button>
      </form>
      <div class="row g-3">
        <div class="col-6">
          <div class="hero-stat pt-3">
            <p class="h4 fw-bold mb-0">2.4k</p>
            <p class="text-secondary small mb-0">Active offers</p>
          </div>
        </div>
        <div class="col-6">
          <div class="hero-stat pt-3">
            <p class="h4 fw-bold mb-0">18</p>
            <p class="text-secondary small mb-0">Cities covered</p>
          </div>
        </div>
      </div>
    </div>
  `,
  content: `
    <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
      <div>
        <p class="eyebrow mb-2">Featured listings</p>
        <h2 class="h3 fw-bold mb-0">Fresh finds near you</h2>
      </div>
      <a class="btn btn-outline-primary align-self-start" href="/listing.html">View all</a>
    </div>

    <div class="row g-4 mb-5">
      ${featuredListings.map((listing) => `
        <div class="col-md-6 col-xl-4">
          <a class="listing-card h-100" href="/listing.html">
            <div class="listing-card-media d-flex align-items-start justify-content-end p-3">
              <span class="badge text-bg-light">${listing.tag}</span>
            </div>
            <div class="p-4">
              <p class="text-secondary small mb-1">${listing.location}</p>
              <h3 class="h5 fw-bold mb-2">${listing.title}</h3>
              <p class="listing-card-price h5 mb-0">${listing.price}</p>
            </div>
          </a>
        </div>
      `).join('')}
    </div>

    <div class="surface-card p-4">
      <div class="row g-3 align-items-center">
        <div class="col-lg-4">
          <p class="eyebrow mb-2">Browse by category</p>
          <h2 class="h4 fw-bold mb-0">Start with what you need</h2>
        </div>
        <div class="col-lg-8">
          <div class="row g-3">
            ${categories.map((category) => `
              <div class="col-6 col-md-3">
                <a class="category-tile d-block border rounded-3 p-3 text-decoration-none text-body h-100" href="/listing.html">
                  <span class="fw-bold">${category}</span>
                  <p class="text-secondary small mb-0 mt-1">Local offers</p>
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `
});
