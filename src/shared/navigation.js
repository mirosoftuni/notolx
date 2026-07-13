import {
  getCurrentLanguage,
  setCurrentLanguage,
  SUPPORTED_LANGUAGES,
  t
} from './i18n.js';
import { getCurrentSession, logout } from '../services/authService.js';

const navItems = [
  { id: 'home', labelKey: 'nav.home', href: '/' },
  { id: 'listing', labelKey: 'nav.listing', href: '/listing.html' },
  { id: 'create', labelKey: 'nav.create', href: '/listing-form.html' }
];

const authItems = [
  { id: 'login', labelKey: 'nav.login', href: '/login.html' },
  { id: 'register', labelKey: 'nav.register', href: '/register.html', style: 'button' }
];

const userItems = [
  { id: 'profile', labelKey: 'nav.profile', href: '/profile.html' }
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

function renderLogoutButton() {
  return `
    <li class="nav-item">
      <button class="nav-link nav-logout border-0 bg-transparent" type="button" data-logout>
        ${t('nav.logout')}
      </button>
    </li>
  `;
}

function renderAuthNavigation(isLoggedIn, activePage) {
  const items = isLoggedIn ? userItems : authItems;

  return `
    ${items.map((item) => renderNavLink(item, activePage)).join('')}
    ${isLoggedIn ? renderLogoutButton() : ''}
  `;
}

function renderLanguageSwitcher() {
  const currentLanguage = getCurrentLanguage();

  return `
    <li class="nav-item">
      <div class="language-switcher" aria-label="${t('nav.language')}">
        ${SUPPORTED_LANGUAGES.map((language) => `
          <button
            class="language-option${language === currentLanguage ? ' active' : ''}"
            type="button"
            data-language="${language}"
            aria-pressed="${language === currentLanguage ? 'true' : 'false'}"
          >
            ${t(`nav.${language}`)}
          </button>
        `).join('')}
      </div>
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

export async function bindAuthNavigation(activePage = 'home') {
  const authNavigation = document.querySelector('[data-auth-navigation]');

  if (!authNavigation) {
    return;
  }

  try {
    const { session } = await getCurrentSession();
    authNavigation.innerHTML = renderAuthNavigation(Boolean(session), activePage);
  } catch {
    authNavigation.innerHTML = renderAuthNavigation(false, activePage);
  }

  const logoutButton = authNavigation.querySelector('[data-logout]');

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = t('nav.logoutLoading');

    const { error } = await logout();

    if (error) {
      logoutButton.disabled = false;
      logoutButton.textContent = t('nav.logout');
      window.alert(t('nav.logoutError'));
      return;
    }

    window.location.assign('/');
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
          </ul>
          <ul class="navbar-nav align-items-lg-center gap-lg-2" data-auth-navigation>
            ${renderAuthNavigation(false, activePage)}
          </ul>
        </div>
      </div>
    </nav>
  `;
}
