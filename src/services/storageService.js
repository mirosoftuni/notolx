import { getSupabaseClient } from './supabaseClient.js';

const LISTING_PHOTOS_BUCKET = 'listing-photos';
const AVATARS_BUCKET = 'avatars';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LISTING_PHOTO_MAX_SIZE = 10 * 1024 * 1024;
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

function sanitizeFileName(name = 'image') {
  const [baseName = 'image'] = name.split(/[\\/]/).pop().split('.');
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';
}

function fileExtension(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  return file.type?.split('/')[1] ?? 'jpg';
}

function publicUrl(supabase, bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function validateImageFile(file, {
  maxSizeBytes,
  required = false
} = {}) {
  if (!file || file.size === 0) {
    return required ? 'Choose an image file.' : '';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Use a JPG, PNG, or WebP image.';
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    return `Image must be up to ${Math.floor(maxSizeBytes / 1024 / 1024)} MB.`;
  }

  return '';
}

export function validateListingPhotoFiles(files) {
  const selectedFiles = Array.from(files ?? []);

  if (selectedFiles.length > 6) {
    return 'Upload up to 6 photos.';
  }

  return selectedFiles
    .map((file) => validateImageFile(file, { maxSizeBytes: LISTING_PHOTO_MAX_SIZE }))
    .find(Boolean) ?? '';
}

export function validateAvatarFile(file) {
  return validateImageFile(file, { maxSizeBytes: AVATAR_MAX_SIZE });
}

export async function uploadListingPhotos({
  listingId,
  ownerId,
  files,
  altText,
  startSortOrder = 0,
  hasExistingPrimary = false
}) {
  const selectedFiles = Array.from(files ?? []).filter((file) => file.size > 0);

  if (selectedFiles.length === 0) {
    return {
      photos: [],
      error: null
    };
  }

  const validationError = validateListingPhotoFiles(selectedFiles);

  if (validationError) {
    return {
      photos: [],
      error: new Error(validationError)
    };
  }

  const supabase = getSupabaseClient();
  const uploadedPaths = [];

  try {
    const records = [];

    for (const [index, file] of selectedFiles.entries()) {
      const extension = fileExtension(file);
      const safeName = sanitizeFileName(file.name);
      const path = `${ownerId}/${listingId}/${Date.now()}-${index + 1}-${safeName}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(LISTING_PHOTOS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(path);
      records.push({
        listing_id: listingId,
        owner_id: ownerId,
        bucket_id: LISTING_PHOTOS_BUCKET,
        storage_path: path,
        alt_text: altText?.slice(0, 160),
        sort_order: startSortOrder + index,
        is_primary: !hasExistingPrimary && index === 0
      });
    }

    const { data, error } = await supabase
      .from('listing_photos')
      .insert(records)
      .select('id, bucket_id, storage_path, alt_text, sort_order, is_primary');

    if (error) {
      throw error;
    }

    return {
      photos: (data ?? []).map((photo) => ({
        ...photo,
        publicUrl: publicUrl(supabase, photo.bucket_id, photo.storage_path)
      })),
      error: null
    };
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(LISTING_PHOTOS_BUCKET).remove(uploadedPaths);
    }

    return {
      photos: [],
      error
    };
  }
}

export async function uploadAvatar({ userId, file }) {
  const validationError = validateAvatarFile(file);

  if (validationError) {
    return {
      path: null,
      publicUrl: null,
      error: new Error(validationError)
    };
  }

  const supabase = getSupabaseClient();
  const extension = fileExtension(file);
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false
    });

  return {
    path: error ? null : path,
    publicUrl: error ? null : publicUrl(supabase, AVATARS_BUCKET, path),
    error
  };
}

export const storageService = {
  uploadListingPhotos,
  uploadAvatar,
  validateImageFile,
  validateListingPhotoFiles,
  validateAvatarFile
};
