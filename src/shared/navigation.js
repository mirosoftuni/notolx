const navItems = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'listing', label: 'Listing', href: '/listing.html' },
  { id: 'create', label: 'Sell', href: '/listing-form.html' },
  { id: 'profile', label: 'Profile', href: '/profile.html' },
  { id: 'admin', label: 'Admin', href: '/admin.html' }
];

const authItems = [
  { id: 'login', label: 'Login', href: '/login.html' },
  { id: 'register', label: 'Register', href: '/register.html', style: 'button' }
];

function renderNavLink(item, activePage) {
  const isActive = item.id === activePage;
  const className = item.style === 'button'
    ? `nav-link nav-cta${isActive ? ' active' : ''}`
    : `nav-link${isActive ? ' active fw-semibold' : ''}`;

  return `
    <li class="nav-item">
      <a class="${className}" ${isActive ? 'aria-current="page"' : ''} href="${item.href}">
        ${item.label}
      </a>
    </li>
  `;
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
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="mainNavigation">
          <ul class="navbar-nav me-auto mb-3 mb-lg-0">
            ${navItems.map((item) => renderNavLink(item, activePage)).join('')}
          </ul>
          <ul class="navbar-nav align-items-lg-center gap-lg-2">
            ${authItems.map((item) => renderNavLink(item, activePage)).join('')}
          </ul>
        </div>
      </div>
    </nav>
  `;
}
