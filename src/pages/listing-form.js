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
import { escapeHtml } from '../shared/listingView.js';
import { renderPage } from '../shared/page.js';

const params = new URLSearchParams(window.location.search);
const listingId = params.get('id');
let currentUser = null;
let editingListing = null;

renderPage({
  activePage: 'create',
  eyebrow: 'Sell',
  title: listingId ? 'Edit listing' : 'Create listing',
  intro: listingId
    ? 'Update the core details buyers need before contacting you.'
    : 'Add the core details buyers need before publishing.',
  content: `
    <form class="form-card" id="listingForm" novalidate>
      <div class="alert" data-form-message hidden></div>
      <div class="row g-3">
        <div class="col-lg-8">
          <label class="form-label" for="title">Title</label>
          <input class="form-control" id="title" name="title" type="text" minlength="3" maxlength="120" required />
          <div class="invalid-feedback" data-field-error="title"></div>
        </div>
        <div class="col-sm-6 col-lg-2">
          <label class="form-label" for="price">Price</label>
          <input class="form-control" id="price" name="price" type="number" min="0" step="0.01" required />
          <div class="invalid-feedback" data-field-error="price"></div>
        </div>
        <div class="col-sm-6 col-lg-2">
          <label class="form-label" for="currency">Currency</label>
          <select class="form-select" id="currency" name="currency">
            <option value="BGN">BGN</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="categoryId">Category</label>
          <select class="form-select" id="categoryId" name="categoryId" required>
            <option value="">Loading categories...</option>
          </select>
          <div class="invalid-feedback" data-field-error="categoryId"></div>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="location">Location</label>
          <input class="form-control" id="location" name="location" type="text" required />
          <div class="invalid-feedback" data-field-error="location"></div>
        </div>
        <div class="col-12">
          <label class="form-label" for="description">Description</label>
          <textarea class="form-control" id="description" name="description" rows="5" minlength="10" required></textarea>
          <div class="invalid-feedback" data-field-error="description"></div>
        </div>
        <div class="col-12">
          <label class="form-label" for="photos">Photos</label>
          <input class="form-control" id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <div class="form-text" data-existing-photo-summary>Upload up to 6 JPG, PNG, or WebP photos.</div>
          <div class="invalid-feedback" data-field-error="photos"></div>
        </div>
      </div>
      <div class="d-flex flex-column flex-sm-row gap-2 mt-4">
        <button class="btn btn-primary" type="submit">${listingId ? 'Save changes' : 'Save listing'}</button>
        <a class="btn btn-outline-primary" href="${listingId ? `/listing.html?id=${encodeURIComponent(listingId)}` : '/'}">Cancel</a>
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
    errors.title = 'Enter a listing title.';
  } else if (values.title.length < 3) {
    errors.title = 'The title must be at least 3 characters.';
  }

  if (!values.categoryId) {
    errors.categoryId = 'Choose a category.';
  }

  if (!values.price) {
    errors.price = 'Enter a price.';
  } else if (!Number.isFinite(price) || price < 0) {
    errors.price = 'Enter a valid non-negative price.';
  }

  if (!values.location) {
    errors.location = 'Enter a location.';
  }

  if (!values.description) {
    errors.description = 'Enter a description.';
  } else if (values.description.length < 10) {
    errors.description = 'The description must be at least 10 characters.';
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
    existingPhotoSummary.textContent = `${photoCount} uploaded photo${photoCount === 1 ? '' : 's'}. Add more JPG, PNG, or WebP photos.`;
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
    listingForm.showMessage('Supabase is not configured. Check your .env file.');
    listingForm.setLoading(true, 'Unavailable');
    return null;
  }
}

async function loadCategories() {
  const { categories, error } = await listCategories();

  if (error) {
    listingForm.showMessage('Categories could not be loaded. Check the Supabase schema.');
    categorySelect.innerHTML = '<option value="">Categories unavailable</option>';
    return false;
  }

  categorySelect.innerHTML = `
    <option value="">Choose category</option>
    ${categories.map((category) => `
      <option value="${category.id}">${escapeHtml(category.name)}</option>
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
    listingForm.showMessage('Listing could not be loaded for editing.');
    listingForm.setLoading(true, 'Unavailable');
    return false;
  }

  if (listing.owner_id !== currentUser.id) {
    listingForm.showMessage('Only the listing owner can edit this listing.');
    listingForm.setLoading(true, 'Not allowed');
    return false;
  }

  editingListing = listing;
  fillForm(listing);
  return true;
}

async function initializeForm() {
  listingForm.setLoading(true, 'Loading...');
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
  listingForm.setLoading(true, 'Saving...');

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
      listingForm.showMessage('Listing could not be saved. Check the fields and try again.');
      return;
    }

    const photoFiles = listingForm.form.elements.photos.files;

    if (photoFiles.length > 0) {
      listingForm.setLoading(true, 'Uploading photos...');

      const uploadResult = await uploadListingPhotos({
        listingId: result.listing.id,
        ownerId: currentUser.id,
        files: photoFiles,
        altText: values.title,
        startSortOrder: editingListing?.photos?.length ?? 0,
        hasExistingPrimary: editingListing?.photos?.some((photo) => photo.is_primary) ?? false
      });

      if (uploadResult.error) {
        listingForm.showMessage('Listing details were saved, but photos could not be uploaded. Check the files and try again.');
        return;
      }
    }

    window.location.assign(`/listing.html?id=${encodeURIComponent(result.listing.id)}`);
  } catch {
    listingForm.showMessage('Listing could not be saved. Check Supabase configuration and try again.');
  } finally {
    listingForm.setLoading(false);
  }
});

await initializeForm();
