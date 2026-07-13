import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../styles/main.css';
import { getCurrentLanguage } from './i18n.js';
import { bindAuthNavigation, bindLanguageSwitcher, renderNavigation } from './navigation.js';

export function renderPage({
  activePage,
  title,
  eyebrow,
  intro,
  actions = '',
  content = '',
  heroAside = '',
  headingStyle = 'standard',
  contentClass = ''
}) {
  const app = document.querySelector('#app');
  const isHero = headingStyle === 'hero';
  document.documentElement.lang = getCurrentLanguage();

  app.innerHTML = `
    <div class="app-shell min-vh-100">
      ${renderNavigation(activePage)}
      <main>
        <section class="${isHero ? 'hero-section' : 'page-heading bg-white border-bottom'}">
          <div class="container ${isHero ? 'py-5 py-lg-6' : 'py-4 py-lg-5'}">
            ${eyebrow ? `<p class="eyebrow mb-2">${eyebrow}</p>` : ''}
            <div class="row align-items-center g-4">
              <div class="${heroAside ? 'col-lg-7' : 'col-lg-8'}">
                <h1 class="${isHero ? 'hero-title' : 'h2'} fw-bold mb-3">${title}</h1>
                ${intro ? `<p class="${isHero ? 'hero-copy' : 'lead text-secondary'} mb-0">${intro}</p>` : ''}
                ${isHero && actions ? `<div class="hero-actions d-flex flex-wrap gap-2 mt-4">${actions}</div>` : ''}
              </div>
              ${heroAside ? `<div class="col-lg-5">${heroAside}</div>` : ''}
              ${!isHero && actions ? `<div class="col-lg-4 text-lg-end">${actions}</div>` : ''}
            </div>
          </div>
        </section>
        <section class="container page-content py-4 py-lg-5 ${contentClass}">
          ${content}
        </section>
      </main>
    </div>
  `;

  bindLanguageSwitcher();
  bindAuthNavigation(activePage);
}
