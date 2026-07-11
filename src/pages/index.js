import { isSupabaseConfigured } from '../lib/supabase.js';
import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'home',
  eyebrow: 'Marketplace',
  title: 'Find and sell locally with NOTOLX.',
  intro: 'A clean starting point for listings, accounts, profiles, and admin workflows.',
  actions: '<a class="btn btn-primary" href="/listing-form.html">Create listing</a>',
  content: `
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="row g-3">
          ${['Phones', 'Cars', 'Home', 'Jobs'].map((category) => `
            <div class="col-sm-6">
              <a class="category-tile d-block bg-white border rounded-3 p-4 text-decoration-none text-body h-100" href="/listing.html">
                <span class="text-primary fw-semibold">${category}</span>
                <h2 class="h5 mt-2 mb-1">Browse ${category.toLowerCase()}</h2>
                <p class="text-secondary mb-0">Fresh local offers and simple listing details.</p>
              </a>
            </div>
          `).join('')}
        </div>
      </div>
      <aside class="col-lg-4">
        <div class="bg-white border rounded-3 p-4 h-100">
          <h2 class="h5 fw-semibold mb-3">App status</h2>
          <div class="d-flex justify-content-between border-bottom py-2">
            <span>Bootstrap</span>
            <span class="text-success fw-semibold">Loaded</span>
          </div>
          <div class="d-flex justify-content-between py-2">
            <span>Supabase env</span>
            <span class="${isSupabaseConfigured ? 'text-success' : 'text-warning'} fw-semibold">
              ${isSupabaseConfigured ? 'Configured' : 'Pending'}
            </span>
          </div>
        </div>
      </aside>
    </div>
  `
});
