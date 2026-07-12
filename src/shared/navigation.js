import {
  getCurrentLanguage,
  setCurrentLanguage,
  SUPPORTED_LANGUAGES,
  t
} from './i18n.js';

const navItems = [
  { id: 'home', labelKey: 'nav.home', href: '/' },
  { id: 'listing', labelKey: 'nav.listing', href: '/listing.html' },
  { id: 'create', labelKey: 'nav.create', href: '/listing-form.html' },
  { id: 'profile', labelKey: 'nav.profile', href: '/profile.html' },
  { id: 'admin', labelKey: 'nav.admin', href: '/admin.html' }
];

const authItems = [
  { id: 'login', labelKey: 'nav.login', href: '/login.html' },
  { id: 'register', labelKey: 'nav.register', href: '/register.html', style: 'button' }
];

function renderNavLink(item, activePage) {
  const isActive = item.id === activePage;
  const className = item.style === 'button'
    ? `nav-link nav-cta${isActive ? ' active' : ''}`
    : `nav-link${isActive ? ' active fw-semibold' : ''}`;

  return `
    <li class="nav-item">
      <a class="${className}" ${isActive ? 'aria-current="page"' : ''} href="${item.href}">
        ${t(item.labelKey)}
      </a>
    </li>
  `;
}

function renderLanguageSwitcher() {
  const currentLanguage = getCurrentLanguage();

  return `
    <li class="nav-item dropdown">
      <button
        class="nav-link dropdown-toggle bg-transparent border-0"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        ${t('nav.language')}: ${t(`nav.${currentLanguage}`)}
      </button>
      <ul class="dropdown-menu dropdown-menu-lg-end">
        ${SUPPORTED_LANGUAGES.map((language) => `
          <li>
            <button
              class="dropdown-item${language === currentLanguage ? ' active' : ''}"
              type="button"
              data-language="${language}"
            >
              ${t(`nav.${language}`)}
            </button>
          </li>
        `).join('')}
      </ul>
    </li>
  `;
}

export function bindLanguageSwitcher() {
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      setCurrentLanguage(button.dataset.language);
      window.location.reload();
    });
  });
}

export function renderNavigation(activePage = 'home') {
  return `
    <nav class="navbar navbar-expand-lg app-navbar bg-white border-bottom sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="/">
          <span class="brand-mark">N</span>
          <span>NOTOLX</span>
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavigation"
          aria-controls="mainNavigation"
          aria-expanded="false"
          aria-label="${t('nav.toggle')}"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="mainNavigation">
          <ul class="navbar-nav me-auto mb-3 mb-lg-0">
            ${navItems.map((item) => renderNavLink(item, activePage)).join('')}
          </ul>
          <ul class="navbar-nav align-items-lg-center gap-lg-2">
            ${renderLanguageSwitcher()}
            ${authItems.map((item) => renderNavLink(item, activePage)).join('')}
          </ul>
        </div>
      </div>
    </nav>
  `;
}
