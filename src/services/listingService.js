import { getSupabaseClient } from './supabaseClient.js';

const LISTING_SELECT = `
  id,
  owner_id,
  category_id,
  title,
  description,
  price,
  currency,
  condition,
  status,
  location,
  contact_phone,
  is_featured,
  published_at,
  created_at,
  updated_at,
  owner:profiles!listings_owner_id_fkey (
    id,
    display_name,
    phone,
    location,
    avatar_url
  ),
  category:categories!listings_category_id_fkey (
    id,
    name,
    slug
  ),
  photos:listing_photos!listing_photos_listing_id_fkey (
    id,
    bucket_id,
    storage_path,
    alt_text,
    sort_order,
    is_primary
  )
`;

function normalizeSearchTerm(search) {
  return search?.trim().replaceAll(',', ' ').replace(/\s+/g, ' ') ?? '';
}

function escapeFilterValue(value) {
  return value
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_')
    .replace(/[()]/g, ' ');
}

function addPhotoUrls(supabase, listing) {
  const photos = [...(listing.photos ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const photosWithUrls = photos.map((photo) => {
    const { data } = supabase.storage
      .from(photo.bucket_id ?? 'listing-photos')
      .getPublicUrl(photo.storage_path);

    return {
      ...photo,
      publicUrl: data.publicUrl
    };
  });

  return {
    ...listing,
    photos: photosWithUrls,
    primaryPhoto: photosWithUrls[0] ?? null
  };
}

export async function listCategories({ activeOnly = true } = {}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('categories')
    .select('id, parent_id, name, slug, description, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  return {
    categories: data ?? [],
    error
  };
}

export async function listListings({
  search = '',
  categoryId,
  ownerId,
  status = 'active',
  limit = 12
} = {}) {
  const supabase = getSupabaseClient();
  const searchTerm = normalizeSearchTerm(search);
  let query = supabase
    .from('listings')
    .select(LISTING_SELECT)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  }

  if (searchTerm) {
    const term = `%${escapeFilterValue(searchTerm)}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`);
  }

  const { data, error } = await query;

  return {
    listings: (data ?? []).map((listing) => addPhotoUrls(supabase, listing)),
    error
  };
}

export async function getListing(id) {
  const supabase = getSupabaseClient();

  if (!id) {
    return {
      listing: null,
      error: new Error('Missing listing id.')
    };
  }

  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .maybeSingle();

  return {
    listing: data ? addPhotoUrls(supabase, data) : null,
    error
  };
}

export async function createListing(input) {
  const supabase = getSupabaseClient();
  const payload = {
    owner_id: input.ownerId,
    category_id: Number(input.categoryId),
    title: input.title,
    description: input.description,
    price: Number(input.price),
    currency: input.currency ?? 'BGN',
    location: input.location,
    status: input.status ?? 'active',
    published_at: input.publishedAt ?? new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select('id')
    .single();

  return {
    listing: data,
    error
  };
}

export async function updateListing(id, input) {
  const supabase = getSupabaseClient();
  const payload = {
    category_id: Number(input.categoryId),
    title: input.title,
    description: input.description,
    price: Number(input.price),
    currency: input.currency ?? 'BGN',
    location: input.location
  };

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single();

  return {
    listing: data,
    error
  };
}

export const listingService = {
  listCategories,
  listListings,
  getListing,
  createListing,
  updateListing
};
