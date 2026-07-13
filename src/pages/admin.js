import { getCurrentUser, isAdmin } from '../services/authService.js';
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  listAdminListings,
  listUsersWithRoles,
  LISTING_STATUSES,
  setUserRole,
  updateListingStatus,
  USER_ROLES
} from '../services/adminService.js';
import {
  localizedCategoryName,
  localizedStatus,
  t
} from '../shared/i18n.js';
import { escapeHtml, formatPrice } from '../shared/listingView.js';
import { renderPage } from '../shared/page.js';

const state = {
  currentUser: null,
  listings: [],
  categories: [],
  users: []
};

renderPage({
  activePage: 'admin',
  eyebrow: t('admin.eyebrow'),
  title: t('admin.title'),
  intro: t('admin.intro'),
  content: `
    <div class="alert" data-admin-message hidden></div>
    <div data-admin-content>
      <div class="surface-card p-4 text-secondary">${t('admin.loading')}</div>
    </div>
  `
});

const messageEl = document.querySelector('[data-admin-message]');
const contentEl = document.querySelector('[data-admin-content]');

function redirectToLogin() {
  const redirect = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login.html?redirect=${encodeURIComponent(redirect)}`);
}

function showMessage(message, type = 'danger') {
  messageEl.className = `alert alert-${type}`;
  messageEl.textContent = message;
  messageEl.hidden = false;
}

function clearMessage() {
  messageEl.hidden = true;
  messageEl.textContent = '';
}

function roleForUser(user) {
  const roles = user.roles?.map((row) => row.role) ?? [];
  return roles.includes('admin') ? 'admin' : 'user';
}

function statusOptions(selectedStatus) {
  return LISTING_STATUSES.map((status) => `
    <option value="${status}" ${status === selectedStatus ? 'selected' : ''}>
      ${escapeHtml(localizedStatus(status))}
    </option>
  `).join('');
}

function roleOptions(selectedRole) {
  return USER_ROLES.map((role) => `
    <option value="${role}" ${role === selectedRole ? 'selected' : ''}>
      ${escapeHtml(t(`role.${role}`))}
    </option>
  `).join('');
}

function renderMetrics() {
  const activeListings = state.listings.filter((listing) => listing.status === 'active').length;
  const pendingListings = state.listings.filter((listing) => listing.status === 'draft').length;
  const adminUsers = state.users.filter((user) => roleForUser(user) === 'admin').length;

  return `
    <div class="row g-3 mb-4">
      ${[
        [t('admin.users'), state.users.length],
        [t('admin.listings'), state.listings.length],
        [t('admin.activeListings'), activeListings],
        [t('admin.pending'), pendingListings],
        [t('admin.categories'), state.categories.length],
        [t('admin.admins'), adminUsers]
      ].map(([label, value]) => `
        <div class="col-6 col-xl-2">
          <div class="metric-card p-3 p-lg-4 h-100">
            <p class="text-secondary mb-1">${label}</p>
            <p class="h3 fw-bold mb-0">${value}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderListings() {
  const rows = state.listings.map((listing) => `
    <tr>
      <td>
        <a class="fw-semibold text-decoration-none" href="/listing.html?id=${encodeURIComponent(listing.id)}">
          ${escapeHtml(listing.title)}
        </a>
        <span class="text-secondary small d-block">${escapeHtml(listing.location)}</span>
      </td>
      <td>${escapeHtml(listing.owner?.display_name ?? t('admin.unknownUser'))}</td>
      <td>${escapeHtml(listing.category ? localizedCategoryName(listing.category) : t('listing.categoryFallback'))}</td>
      <td>${formatPrice(listing.price, listing.currency)}</td>
      <td>
        <select class="form-select form-select-sm admin-inline-select" data-listing-status="${escapeHtml(listing.id)}">
          ${statusOptions(listing.status)}
        </select>
      </td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-primary" href="/listing-form.html?id=${encodeURIComponent(listing.id)}">
          ${t('admin.edit')}
        </a>
      </td>
    </tr>
  `).join('');

  return `
    <section class="surface-card p-4 mb-4">
      <div class="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">${t('admin.allListings')}</h2>
          <p class="text-secondary mb-0">${t('admin.allListingsHelp')}</p>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table align-middle mb-0 admin-table">
          <thead>
            <tr>
              <th scope="col">${t('nav.listing')}</th>
              <th scope="col">${t('admin.seller')}</th>
              <th scope="col">${t('form.category')}</th>
              <th scope="col">${t('form.price')}</th>
              <th scope="col">${t('admin.status')}</th>
              <th scope="col" class="text-end">${t('admin.action')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td class="text-secondary" colspan="6">${t('admin.noListings')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCategories() {
  const rows = state.categories.map((category) => `
    <tr>
      <td>
        <span class="fw-semibold">${escapeHtml(localizedCategoryName(category))}</span>
        <span class="text-secondary small d-block">${escapeHtml(category.slug)}</span>
      </td>
      <td>${category.sort_order}</td>
      <td>
        <span class="badge ${category.is_active ? 'text-bg-success' : 'text-bg-secondary'}">
          ${category.is_active ? t('admin.active') : t('admin.inactive')}
        </span>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" type="button" data-delete-category="${category.id}">
          ${t('admin.delete')}
        </button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="row g-4 mb-4">
      <div class="col-lg-5">
        <form class="surface-card p-4 h-100" id="categoryForm" novalidate>
          <h2 class="h5 fw-semibold mb-3">${t('admin.createCategory')}</h2>
          <div class="mb-3">
            <label class="form-label" for="categoryName">${t('form.name')}</label>
            <input class="form-control" id="categoryName" name="name" type="text" required />
          </div>
          <div class="mb-3">
            <label class="form-label" for="categorySlug">${t('admin.slug')}</label>
            <input class="form-control" id="categorySlug" name="slug" type="text" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            <div class="form-text">${t('admin.slugHelp')}</div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="categoryDescription">${t('form.description')}</label>
            <textarea class="form-control" id="categoryDescription" name="description" rows="3"></textarea>
          </div>
          <div class="row g-3">
            <div class="col-sm-6">
              <label class="form-label" for="categorySortOrder">${t('admin.sortOrder')}</label>
              <input class="form-control" id="categorySortOrder" name="sortOrder" type="number" value="0" />
            </div>
            <div class="col-sm-6 d-flex align-items-end">
              <div class="form-check mb-2">
                <input class="form-check-input" id="categoryIsActive" name="isActive" type="checkbox" checked />
                <label class="form-check-label" for="categoryIsActive">${t('admin.active')}</label>
              </div>
            </div>
          </div>
          <button class="btn btn-primary w-100 mt-3" type="submit">${t('admin.createCategory')}</button>
        </form>
      </div>
      <div class="col-lg-7">
        <section class="surface-card p-4 h-100">
          <h2 class="h5 fw-semibold mb-3">${t('admin.categories')}</h2>
          <div class="table-responsive">
            <table class="table align-middle mb-0 admin-table">
              <thead>
                <tr>
                  <th scope="col">${t('form.category')}</th>
                  <th scope="col">${t('admin.sortOrder')}</th>
                  <th scope="col">${t('admin.status')}</th>
                  <th scope="col" class="text-end">${t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td class="text-secondary" colspan="4">${t('admin.noCategories')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderUsers() {
  const rows = state.users.map((user) => {
    const role = roleForUser(user);
    const isCurrentUser = user.id === state.currentUser.id;

    return `
      <tr>
        <td>
          <span class="fw-semibold">${escapeHtml(user.display_name ?? t('admin.unknownUser'))}</span>
          <span class="text-secondary small d-block">${escapeHtml(user.id)}</span>
        </td>
        <td>${escapeHtml(user.phone ?? '-')}</td>
        <td>${escapeHtml(user.location ?? '-')}</td>
        <td>
          <select class="form-select form-select-sm admin-inline-select" data-user-role="${escapeHtml(user.id)}" ${isCurrentUser ? 'disabled' : ''}>
            ${roleOptions(role)}
          </select>
          ${isCurrentUser ? `<span class="text-secondary small">${t('admin.currentAdmin')}</span>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <section class="surface-card p-4">
      <h2 class="h5 fw-semibold mb-3">${t('admin.userRoles')}</h2>
      <div class="table-responsive">
        <table class="table align-middle mb-0 admin-table">
          <thead>
            <tr>
              <th scope="col">${t('admin.user')}</th>
              <th scope="col">${t('form.phone')}</th>
              <th scope="col">${t('form.location')}</th>
              <th scope="col">${t('admin.role')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td class="text-secondary" colspan="4">${t('admin.noUsers')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAdminPanel() {
  contentEl.innerHTML = `
    ${renderMetrics()}
    ${renderListings()}
    ${renderCategories()}
    ${renderUsers()}
  `;
}

async function loadAdminData({ clear = true } = {}) {
  if (clear) {
    clearMessage();
  }

  const [listingsResult, categoriesResult, usersResult] = await Promise.all([
    listAdminListings(),
    listAdminCategories(),
    listUsersWithRoles()
  ]);

  if (listingsResult.error || categoriesResult.error || usersResult.error) {
    showMessage(t('admin.loadError'));
  }

  state.listings = listingsResult.listings;
  state.categories = categoriesResult.categories;
  state.users = usersResult.users;
  renderAdminPanel();
}

async function initializeAdmin() {
  try {
    const { user, error } = await getCurrentUser();

    if (error || !user) {
      redirectToLogin();
      return;
    }

    const adminResult = await isAdmin(user.id);

    if (adminResult.error || !adminResult.isAdmin) {
      contentEl.innerHTML = `<div class="surface-card p-4 text-secondary">${t('admin.notAllowed')}</div>`;
      return;
    }

    state.currentUser = user;
    await loadAdminData();
  } catch {
    contentEl.innerHTML = `<div class="surface-card p-4 text-secondary">${t('admin.configError')}</div>`;
  }
}

contentEl.addEventListener('change', async (event) => {
  const listingStatusSelect = event.target.closest('[data-listing-status]');
  const roleSelect = event.target.closest('[data-user-role]');

  if (listingStatusSelect) {
    listingStatusSelect.disabled = true;
    const { listing, error } = await updateListingStatus(
      listingStatusSelect.dataset.listingStatus,
      listingStatusSelect.value
    );

    if (error || !listing) {
      showMessage(t('admin.statusError'));
      listingStatusSelect.disabled = false;
      return;
    }

    state.listings = state.listings.map((item) => item.id === listing.id ? listing : item);
    showMessage(t('admin.statusSaved'), 'success');
    renderAdminPanel();
    return;
  }

  if (roleSelect) {
    roleSelect.disabled = true;
    const { error } = await setUserRole(roleSelect.dataset.userRole, roleSelect.value);

    if (error) {
      showMessage(t('admin.roleError'));
      roleSelect.disabled = false;
      return;
    }

    showMessage(t('admin.roleSaved'), 'success');
    await loadAdminData({ clear: false });
  }
});

contentEl.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('[data-delete-category]');

  if (!deleteButton) {
    return;
  }

  const confirmed = window.confirm(t('admin.deleteCategoryConfirm'));

  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  const { category, error } = await deleteCategory(deleteButton.dataset.deleteCategory);

  if (error || !category) {
    showMessage(t('admin.deleteCategoryError'));
    deleteButton.disabled = false;
    return;
  }

  showMessage(t('admin.deleteCategorySuccess'), 'success');
  await loadAdminData({ clear: false });
});

contentEl.addEventListener('submit', async (event) => {
  const form = event.target.closest('#categoryForm');

  if (!form) {
    return;
  }

  event.preventDefault();
  const formData = new FormData(form);
  const name = formData.get('name')?.trim() ?? '';

  if (name.length < 2) {
    showMessage(t('admin.categoryNameRequired'));
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;

  const { category, error } = await createCategory({
    name,
    slug: formData.get('slug')?.trim(),
    description: formData.get('description')?.trim(),
    sortOrder: formData.get('sortOrder'),
    isActive: formData.has('isActive')
  });

  if (error || !category) {
    showMessage(t('admin.createCategoryError'));
    submitButton.disabled = false;
    return;
  }

  form.reset();
  form.elements.isActive.checked = true;
  showMessage(t('admin.createCategorySuccess'), 'success');
  await loadAdminData({ clear: false });
});

await initializeAdmin();
