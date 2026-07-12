import { renderPage } from '../shared/page.js';
import { t } from '../shared/i18n.js';

renderPage({
  activePage: 'admin',
  eyebrow: t('admin.eyebrow'),
  title: t('admin.title'),
  intro: t('admin.intro'),
  content: `
    <div class="row g-3 mb-4">
      ${[
        [t('admin.users'), '128'],
        [t('admin.listings'), '342'],
        [t('admin.pending'), '9'],
        [t('admin.reports'), '3']
      ].map(([label, value]) => `
        <div class="col-sm-6 col-xl-3">
          <div class="metric-card p-4">
            <p class="text-secondary mb-1">${label}</p>
            <p class="h3 fw-bold mb-0">${value}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <section class="surface-card p-4">
      <h2 class="h5 fw-semibold mb-3">${t('admin.queue')}</h2>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">${t('nav.listing')}</th>
              <th scope="col">${t('admin.seller')}</th>
              <th scope="col">${t('admin.status')}</th>
              <th scope="col" class="text-end">${t('admin.action')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Used city bike</td>
              <td>Maria Petrova</td>
              <td><span class="badge text-bg-warning">${t('admin.pending')}</span></td>
              <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="/listing.html">${t('admin.review')}</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
});
