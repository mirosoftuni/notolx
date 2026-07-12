import { getCurrentUser } from '../services/authService.js';
import {
  createListing,
  getListing,
  listCategories,
  updateListing
} from '../services/listingService.js';
import {
  uploadListingPhotos,
  validateListingPhotoFiles
} from '../services/storageService.js';
import { createFormController } from '../shared/formController.js';
import {
  localizedCategoryName,
  t
} from '../shared/i18n.js';
import { escapeHtml } from '../shared/listingView.js';
import { renderPage } from '../shared/page.js';

const params = new URLSearchParams(window.location.search);
const listingId = params.get('id');
let currentUser = null;
let editingListing = null;

renderPage({
  activePage: 'create',
  eyebrow: t('listingForm.sell'),
  title: listingId ? t('listingForm.editTitle') : t('listingForm.createTitle'),
  intro: listingId
    ? t('listingForm.editIntro')
    : t('listingForm.createIntro'),
  content: `
    <form class="form-card" id="listingForm" novalidate>
      <div class="alert" data-form-message hidden></div>
      <div class="row g-3">
        <div class="col-lg-8">
          <label class="form-label" for="title">${t('form.title')}</label>
          <input class="form-control" id="title" name="title" type="text" minlength="3" maxlength="120" required />
          <div class="invalid-feedback" data-field-error="title"></div>
        </div>
        <div class="col-sm-6 col-lg-2">
          <label class="form-label" for="price">${t('form.price')}</label>
          <input class="form-control" id="price" name="price" type="number" min="0" step="0.01" required />
          <div class="invalid-feedback" data-field-error="price"></div>
        </div>
        <div class="col-sm-6 col-lg-2">
          <label class="form-label" for="currency">${t('form.currency')}</label>
          <select class="form-select" id="currency" name="currency">
            <option value="BGN">BGN</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="categoryId">${t('form.category')}</label>
          <select class="form-select" id="categoryId" name="categoryId" required>
            <option value="">${t('listingForm.loadingCategories')}</option>
          </select>
          <div class="invalid-feedback" data-field-error="categoryId"></div>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="location">${t('form.location')}</label>
          <input class="form-control" id="location" name="location" type="text" required />
          <div class="invalid-feedback" data-field-error="location"></div>
        </div>
        <div class="col-12">
          <label class="form-label" for="description">${t('form.description')}</label>
          <textarea class="form-control" id="description" name="description" rows="5" minlength="10" required></textarea>
          <div class="invalid-feedback" data-field-error="description"></div>
        </div>
        <div class="col-12">
          <label class="form-label" for="photos">${t('form.photos')}</label>
          <input class="form-control" id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <div class="form-text" data-existing-photo-summary>${t('listingForm.photoHelp')}</div>
          <div class="invalid-feedback" data-field-error="photos"></div>
        </div>
      </div>
      <div class="d-flex flex-column flex-sm-row gap-2 mt-4">
        <button class="btn btn-primary" type="submit">${listingId ? t('listingForm.saveChanges') : t('listingForm.save')}</button>
        <a class="btn btn-outline-primary" href="${listingId ? `/listing.html?id=${encodeURIComponent(listingId)}` : '/'}">${t('form.cancel')}</a>
      </div>
    </form>
  `
});

const listingForm = createFormController('#listingForm');
const categorySelect = listingForm.form.elements.categoryId;
const existingPhotoSummary = document.querySelector('[data-existing-photo-summary]');

function redirectToLogin() {
  const redirect = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login.html?redirect=${encodeURIComponent(redirect)}`);
}

function validateListing(values) {
  const errors = {};
  const price = Number(values.price);

  if (!values.title) {
    errors.title = t('validation.titleRequired');
  } else if (values.title.length < 3) {
    errors.title = t('validation.titleMin');
  }

  if (!values.categoryId) {
    errors.categoryId = t('validation.categoryRequired');
  }

  if (!values.price) {
    errors.price = t('validation.priceRequired');
  } else if (!Number.isFinite(price) || price < 0) {
    errors.price = t('validation.priceInvalid');
  }

  if (!values.location) {
    errors.location = t('validation.locationRequired');
  }

  if (!values.description) {
    errors.description = t('validation.descriptionRequired');
  } else if (values.description.length < 10) {
    errors.description = t('validation.descriptionMin');
  }

  const photoError = validateListingPhotoFiles(listingForm.form.elements.photos.files);

  if (photoError) {
    errors.photos = photoError;
  }

  return errors;
}

function fillForm(listing) {
  listingForm.form.elements.title.value = listing.title ?? '';
  listingForm.form.elements.categoryId.value = listing.category_id ?? '';
  listingForm.form.elements.price.value = listing.price ?? '';
  listingForm.form.elements.currency.value = listing.currency ?? 'BGN';
  listingForm.form.elements.location.value = listing.location ?? '';
  listingForm.form.elements.description.value = listing.description ?? '';

  const photoCount = listing.photos?.length ?? 0;

  if (photoCount > 0) {
    existingPhotoSummary.textContent = photoCount === 1
      ? t('listingForm.uploadedPhoto')
      : t('listingForm.uploadedPhotos', { count: photoCount });
  }
}

async function requireAuthenticatedUser() {
  try {
    const { user, error } = await getCurrentUser();

    if (error || !user) {
      redirectToLogin();
      return null;
    }

    return user;
  } catch {
    listingForm.showMessage(t('listingForm.configError'));
    listingForm.setLoading(true, t('form.unavailable'));
    return null;
  }
}

async function loadCategories() {
  const { categories, error } = await listCategories();

  if (error) {
    listingForm.showMessage(t('listingForm.categoriesError'));
    categorySelect.innerHTML = `<option value="">${t('listingForm.categoriesUnavailable')}</option>`;
    return false;
  }

  categorySelect.innerHTML = `
    <option value="">${t('listingForm.chooseCategory')}</option>
    ${categories.map((category) => `
      <option value="${category.id}">${escapeHtml(localizedCategoryName(category))}</option>
    `).join('')}
  `;

  return true;
}

async function loadEditableListing() {
  if (!listingId) {
    return true;
  }

  const { listing, error } = await getListing(listingId);

  if (error || !listing) {
    listingForm.showMessage(t('listingForm.editLoadError'));
    listingForm.setLoading(true, t('form.unavailable'));
    return false;
  }

  if (listing.owner_id !== currentUser.id) {
    listingForm.showMessage(t('listingForm.ownerOnly'));
    listingForm.setLoading(true, t('form.notAllowed'));
    return false;
  }

  editingListing = listing;
  fillForm(listing);
  return true;
}

async function initializeForm() {
  listingForm.setLoading(true, t('listingForm.loading'));
  currentUser = await requireAuthenticatedUser();

  if (!currentUser) {
    return;
  }

  const categoriesLoaded = await loadCategories();
  const listingLoaded = await loadEditableListing();

  if (categoriesLoaded && listingLoaded) {
    listingForm.clearMessage();
    listingForm.setLoading(false);
  }
}

listingForm.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  listingForm.clearMessage();

  const values = listingForm.values();
  const errors = validateListing(values);

  if (Object.keys(errors).length > 0) {
    listingForm.setErrors(errors);
    return;
  }

  listingForm.clearErrors();
  listingForm.setLoading(true, t('listingForm.saving'));

  try {
    const payload = {
      ownerId: currentUser.id,
      title: values.title,
      categoryId: values.categoryId,
      price: values.price,
      currency: values.currency,
      location: values.location,
      description: values.description
    };
    const result = editingListing
      ? await updateListing(editingListing.id, payload)
      : await createListing(payload);

    if (result.error || !result.listing?.id) {
      listingForm.showMessage(t('listingForm.saveError'));
      return;
    }

    const photoFiles = listingForm.form.elements.photos.files;

    if (photoFiles.length > 0) {
      listingForm.setLoading(true, t('listingForm.uploadingPhotos'));

      const uploadResult = await uploadListingPhotos({
        listingId: result.listing.id,
        ownerId: currentUser.id,
        files: photoFiles,
        altText: values.title,
        startSortOrder: editingListing?.photos?.length ?? 0,
        hasExistingPrimary: editingListing?.photos?.some((photo) => photo.is_primary) ?? false
      });

      if (uploadResult.error) {
        listingForm.showMessage(t('listingForm.photoUploadError'));
        return;
      }
    }

    window.location.assign(`/listing.html?id=${encodeURIComponent(result.listing.id)}`);
  } catch {
    listingForm.showMessage(t('listingForm.configSaveError'));
  } finally {
    listingForm.setLoading(false);
  }
});

await initializeForm();
