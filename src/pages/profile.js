import {
  getCurrentUser,
  getProfile,
  updateProfile
} from '../services/authService.js';
import {
  deleteListing,
  listListings
} from '../services/listingService.js';
import {
  deleteListingPhotoFiles,
  uploadAvatar,
  validateAvatarFile
} from '../services/storageService.js';
import { createFormController } from '../shared/formController.js';
import {
  getCurrentLanguage,
  localizedStatus,
  setCurrentLanguage,
  SUPPORTED_LANGUAGES,
  t
} from '../shared/i18n.js';
import { escapeHtml, formatPrice } from '../shared/listingView.js';
import { renderPage } from '../shared/page.js';

let currentUser = null;
let currentProfile = null;
let currentListings = [];
let avatarPreviewUrl = null;

renderPage({
  activePage: 'profile',
  eyebrow: t('profile.eyebrow'),
  title: t('profile.title'),
  intro: t('profile.intro'),
  actions: `<a class="btn btn-primary" href="/listing-form.html">${t('profile.newListing')}</a>`,
  content: `
    <div class="row g-4">
      <div class="col-lg-5">
        <form class="form-card" id="profileForm" novalidate>
          <div class="alert" data-form-message hidden></div>
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="avatar-preview" data-avatar-preview>
              <span>NO</span>
            </div>
            <div class="flex-grow-1">
              <label class="form-label" for="avatar">${t('form.avatar')}</label>
              <input class="form-control" id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
              <div class="form-text">${t('profile.avatarHelp')}</div>
              <div class="invalid-feedback" data-field-error="avatar"></div>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="displayName">${t('form.name')}</label>
            <input class="form-control" id="displayName" name="displayName" type="text" minlength="2" maxlength="80" required />
            <div class="invalid-feedback" data-field-error="displayName"></div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="phone">${t('form.phone')}</label>
            <input class="form-control" id="phone" name="phone" type="tel" />
          </div>
          <div class="mb-3">
            <label class="form-label" for="location">${t('form.location')}</label>
            <input class="form-control" id="location" name="location" type="text" />
          </div>
          <div class="mb-3">
            <label class="form-label" for="preferredLanguage">${t('profile.language')}</label>
            <select class="form-select" id="preferredLanguage" name="preferredLanguage">
              ${SUPPORTED_LANGUAGES.map((language) => `
                <option value="${language}">${t(`nav.${language}`)}</option>
              `).join('')}
            </select>
            <div class="form-text">${t('profile.languageHelp')}</div>
          </div>
          <div class="mb-4">
            <label class="form-label" for="bio">${t('form.bio')}</label>
            <textarea class="form-control" id="bio" name="bio" rows="4" maxlength="500"></textarea>
            <div class="invalid-feedback" data-field-error="bio"></div>
          </div>
          <button class="btn btn-primary w-100" type="submit">${t('profile.save')}</button>
        </form>
      </div>
      <div class="col-lg-7">
        <section class="surface-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
            <h2 class="h5 fw-semibold mb-0">${t('profile.myListings')}</h2>
            <a class="btn btn-sm btn-outline-primary" href="/listing-form.html">${t('profile.addListing')}</a>
          </div>
          <div data-profile-listings>
            <div class="empty-state">
              <div class="empty-state-title loading-dots">${t('profile.loadingListings')}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
});

const profileForm = createFormController('#profileForm');
const avatarInput = profileForm.form.elements.avatar;
const avatarPreview = document.querySelector('[data-avatar-preview]');
const listingsEl = document.querySelector('[data-profile-listings]');

function redirectToLogin() {
  const redirect = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login.html?redirect=${encodeURIComponent(redirect)}`);
}

function initials(name = 'NOTOLX') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'NO';
}

function setAvatarPreview(url, name) {
  if (url) {
    avatarPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="${escapeHtml(name ?? t('form.avatar'))}" />`;
    return;
  }

  avatarPreview.innerHTML = `<span>${escapeHtml(initials(name))}</span>`;
}

function renderEmptyState(title, body = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-title">${title}</div>
      ${body ? `<p class="mb-0">${body}</p>` : ''}
    </div>
  `;
}

function validateProfile(values) {
  const errors = {};

  if (!values.displayName) {
    errors.displayName = t('validation.nameRequired');
  } else if (values.displayName.length < 2) {
    errors.displayName = t('validation.nameMin');
  } else if (values.displayName.length > 80) {
    errors.displayName = t('validation.nameMax');
  }

  if (values.bio.length > 500) {
    errors.bio = t('validation.bioMax');
  }

  const avatarError = validateAvatarFile(avatarInput.files[0]);

  if (avatarError) {
    errors.avatar = avatarError;
  }

  return errors;
}

function fillProfile(profile, user) {
  const fallbackName = user.email?.split('@')[0] ?? t('profile.defaultSeller');
  const displayName = profile?.display_name ?? fallbackName;

  profileForm.form.elements.displayName.value = displayName;
  profileForm.form.elements.phone.value = profile?.phone ?? '';
  profileForm.form.elements.location.value = profile?.location ?? '';
  profileForm.form.elements.preferredLanguage.value = profile?.preferred_language ?? getCurrentLanguage();
  profileForm.form.elements.bio.value = profile?.bio ?? '';
  setAvatarPreview(profile?.avatar_url, displayName);
}

function renderListings(listings) {
  if (listings.length === 0) {
    listingsEl.innerHTML = renderEmptyState(t('profile.noListings'), t('profile.noListingsHint'));
    return;
  }

  listingsEl.innerHTML = `
    <div class="list-group profile-listings">
      ${listings.map((listing) => `
        <div class="list-group-item d-flex flex-column flex-md-row justify-content-between gap-3" data-listing-row="${escapeHtml(listing.id)}">
          <div class="min-width-0">
            <a class="fw-semibold text-decoration-none" href="/listing.html?id=${encodeURIComponent(listing.id)}">
              ${escapeHtml(listing.title)}
            </a>
            <span class="text-secondary small d-block">
              ${escapeHtml(localizedStatus(listing.status))} - ${escapeHtml(listing.location)}
            </span>
            <span class="fw-semibold d-block mt-1">${formatPrice(listing.price, listing.currency)}</span>
          </div>
          ${listing.owner_id === currentUser.id ? `
            <div class="d-flex flex-wrap align-items-start gap-2 profile-listing-actions">
              <a class="btn btn-sm btn-outline-primary" href="/listing.html?id=${encodeURIComponent(listing.id)}">
                ${t('profile.viewListing')}
              </a>
              <a class="btn btn-sm btn-outline-primary" href="/listing-form.html?id=${encodeURIComponent(listing.id)}">
                ${t('profile.editListing')}
              </a>
              <button class="btn btn-sm btn-outline-danger" type="button" data-delete-listing-id="${escapeHtml(listing.id)}">
                ${t('profile.deleteListing')}
              </button>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

async function loadListings() {
  const { listings, error } = await listListings({
    ownerId: currentUser.id,
    status: null,
    limit: 20
  });

  if (error) {
    listingsEl.innerHTML = renderEmptyState(t('profile.listingsError'), t('home.categoriesUnavailableHint'));
    return;
  }

  currentListings = listings;
  renderListings(listings);
}

async function handleDeleteListing(listingId, button) {
  const row = button.closest('[data-listing-row]');
  const listingToDelete = currentListings.find((listing) => listing.id === listingId);
  const confirmed = window.confirm(t('profile.deleteConfirm'));

  if (!confirmed) {
    return;
  }

  button.disabled = true;
  button.textContent = t('profile.deletingListing');

  const { listing, error } = await deleteListing(listingId, {
    ownerId: currentUser.id
  });

  if (error || !listing) {
    button.disabled = false;
    button.textContent = t('profile.deleteListing');
    profileForm.showMessage(t('profile.deleteListingError'));
    return;
  }

  row?.remove();
  currentListings = currentListings.filter((listing) => listing.id !== listingId);
  await deleteListingPhotoFiles(listingToDelete?.photos ?? []);
  profileForm.showMessage(t('profile.deleteListingSuccess'), 'success');

  if (!listingsEl.querySelector('[data-listing-row]')) {
    listingsEl.innerHTML = renderEmptyState(t('profile.noListings'), t('profile.noListingsHint'));
  }
}

async function initializeProfile() {
  profileForm.setLoading(true, t('profile.loading'));

  try {
    const { user, error: userError } = await getCurrentUser();

    if (userError || !user) {
      redirectToLogin();
      return;
    }

    currentUser = user;
    const { profile, error: profileError } = await getProfile(user.id);

    if (profileError) {
      profileForm.showMessage(t('profile.profileLoadError'));
    }

    currentProfile = profile;
    fillProfile(profile, user);
    await loadListings();
    profileForm.setLoading(false);
  } catch {
    profileForm.showMessage(t('profile.configError'));
    profileForm.setLoading(true, t('form.unavailable'));
    listingsEl.innerHTML = renderEmptyState(t('profile.listingsUnavailable'), t('home.categoriesUnavailableHint'));
  }
}

avatarInput.addEventListener('change', () => {
  if (avatarPreviewUrl) {
    URL.revokeObjectURL(avatarPreviewUrl);
    avatarPreviewUrl = null;
  }

  const file = avatarInput.files[0];

  if (!file) {
    setAvatarPreview(currentProfile?.avatar_url, profileForm.form.elements.displayName.value);
    return;
  }

  avatarPreviewUrl = URL.createObjectURL(file);
  setAvatarPreview(avatarPreviewUrl, profileForm.form.elements.displayName.value);
});

listingsEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-listing-id]');

  if (!button) {
    return;
  }

  handleDeleteListing(button.dataset.deleteListingId, button);
});

profileForm.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  profileForm.clearMessage();

  const values = profileForm.values();
  const errors = validateProfile(values);

  if (Object.keys(errors).length > 0) {
    profileForm.setErrors(errors);
    return;
  }

  profileForm.clearErrors();
  profileForm.setLoading(true, t('profile.saving'));

  try {
    let avatarUrl = currentProfile?.avatar_url;
    const avatarFile = avatarInput.files[0];

    if (avatarFile) {
      profileForm.setLoading(true, t('profile.uploadingAvatar'));
      const { publicUrl, error } = await uploadAvatar({
        userId: currentUser.id,
        file: avatarFile
      });

      if (error) {
        profileForm.showMessage(t('profile.avatarUploadError'));
        return;
      }

      avatarUrl = publicUrl;
    }

    const { profile, error } = await updateProfile({
      displayName: values.displayName,
      phone: values.phone,
      location: values.location,
      bio: values.bio,
      avatarUrl,
      preferredLanguage: values.preferredLanguage
    }, currentUser.id);

    if (error) {
      profileForm.showMessage(t('profile.saveError'));
      return;
    }

    currentProfile = profile;
    setCurrentLanguage(profile.preferred_language ?? values.preferredLanguage);
    avatarInput.value = '';
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      avatarPreviewUrl = null;
    }
    setAvatarPreview(profile.avatar_url, profile.display_name);
    profileForm.showMessage(t('profile.saved'), 'success');
  } catch {
    profileForm.showMessage(t('profile.configSaveError'));
  } finally {
    profileForm.setLoading(false);
  }
});

await initializeProfile();
