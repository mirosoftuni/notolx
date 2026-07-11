const navItems = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'listing', label: 'Listing', href: '/listing.html' },
  { id: 'create', label: 'Sell', href: '/listing-form.html' },
  { id: 'profile', label: 'Profile', href: '/profile.html' },
  { id: 'admin', label: 'Admin', href: '/admin.html' }
];

const authItems = [
  { id: 'login', label: 'Login', href: '/login.html' },
  { id: 'register', label: 'Register', href: '/register.html' }
];

function renderNavLink(item, activePage) {
  const isActive = item.id === activePage;
  return `
    <li class="nav-item">
      <a class="nav-link${isActive ? ' active fw-semibold' : ''}" ${isActive ? 'aria-current="page"' : ''} href="${item.href}">
        ${item.label}
      </a>
    </li>
  `;
}

export function renderNavigation(activePage = 'home') {
  return `
    <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold" href="/">NOTOLX</a>
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
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${navItems.map((item) => renderNavLink(item, activePage)).join('')}
          </ul>
          <ul class="navbar-nav gap-lg-2">
            ${authItems.map((item) => renderNavLink(item, activePage)).join('')}
          </ul>
        </div>
      </div>
    </nav>
  `;
}
