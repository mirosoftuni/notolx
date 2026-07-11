import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../styles/main.css';
import { renderNavigation } from './navigation.js';

export function renderPage({ activePage, title, eyebrow, intro, actions = '', content = '' }) {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="app-shell min-vh-100 bg-body-tertiary">
      ${renderNavigation(activePage)}
      <main>
        <section class="page-heading bg-white border-bottom">
          <div class="container py-4 py-lg-5">
            ${eyebrow ? `<p class="text-uppercase text-primary fw-semibold small mb-2">${eyebrow}</p>` : ''}
            <div class="row align-items-end g-3">
              <div class="col-lg-8">
                <h1 class="h2 fw-bold mb-2">${title}</h1>
                ${intro ? `<p class="lead text-secondary mb-0">${intro}</p>` : ''}
              </div>
              ${actions ? `<div class="col-lg-4 text-lg-end">${actions}</div>` : ''}
            </div>
          </div>
        </section>
        <section class="container py-4 py-lg-5">
          ${content}
        </section>
      </main>
    </div>
  `;
}
