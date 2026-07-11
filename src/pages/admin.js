import { renderPage } from '../shared/page.js';

renderPage({
  activePage: 'admin',
  eyebrow: 'Admin',
  title: 'Admin dashboard',
  intro: 'Review marketplace activity, users, listings, and reports.',
  content: `
    <div class="row g-3 mb-4">
      ${[
        ['Users', '128'],
        ['Listings', '342'],
        ['Pending', '9'],
        ['Reports', '3']
      ].map(([label, value]) => `
        <div class="col-sm-6 col-xl-3">
          <div class="bg-white border rounded-3 p-4">
            <p class="text-secondary mb-1">${label}</p>
            <p class="h3 fw-bold mb-0">${value}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <section class="bg-white border rounded-3 p-4">
      <h2 class="h5 fw-semibold mb-3">Recent moderation queue</h2>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Listing</th>
              <th scope="col">Seller</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Used city bike</td>
              <td>Maria Petrova</td>
              <td><span class="badge text-bg-warning">Pending</span></td>
              <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="/listing.html">Review</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
});
