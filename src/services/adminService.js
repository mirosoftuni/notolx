import { getSupabaseClient } from './supabaseClient.js';

export const LISTING_STATUSES = ['draft', 'active', 'sold', 'archived', 'removed'];
export const USER_ROLES = ['user', 'admin'];

const ADMIN_LISTING_SELECT = `
  id,
  owner_id,
  category_id,
  title,
  price,
  currency,
  status,
  location,
  is_featured,
  published_at,
  created_at,
  updated_at,
  owner:profiles!listings_owner_id_fkey (
    id,
    display_name,
    phone
  ),
  category:categories!listings_category_id_fkey (
    id,
    name,
    slug
  )
`;

const ADMIN_PROFILE_SELECT = `
  id,
  display_name,
  phone,
  location,
  created_at,
  roles:user_roles!user_roles_user_id_fkey (
    role,
    created_at
  )
`;

function slugify(value = '') {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function categoryPayload(input = {}) {
  return {
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description || null,
    sort_order: Number(input.sortOrder ?? input.sort_order ?? 0),
    is_active: Boolean(input.isActive ?? input.is_active)
  };
}

export async function listAdminListings({ limit = 100 } = {}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listings')
    .select(ADMIN_LISTING_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  return {
    listings: data ?? [],
    error
  };
}

export async function updateListingStatus(id, status) {
  const supabase = getSupabaseClient();

  if (!LISTING_STATUSES.includes(status)) {
    return {
      listing: null,
      error: new Error('Invalid listing status.')
    };
  }

  const payload = {
    status
  };

  if (status === 'active') {
    payload.published_at = new Date().toISOString();
  }

  if (status === 'sold') {
    payload.sold_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select(ADMIN_LISTING_SELECT)
    .single();

  return {
    listing: data,
    error
  };
}

export async function listAdminCategories() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, name, slug, description, sort_order, is_active, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return {
    categories: data ?? [],
    error
  };
}

export async function createCategory(input) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryPayload(input))
    .select('id, parent_id, name, slug, description, sort_order, is_active, created_at, updated_at')
    .single();

  return {
    category: data,
    error
  };
}

export async function deleteCategory(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  return {
    category: data,
    error
  };
}

export async function listUsersWithRoles({ limit = 100 } = {}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(ADMIN_PROFILE_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  return {
    users: data ?? [],
    error
  };
}

export async function setUserRole(userId, role) {
  const supabase = getSupabaseClient();

  if (!USER_ROLES.includes(role)) {
    return {
      role: null,
      error: new Error('Invalid user role.')
    };
  }

  const { error: upsertError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

  if (upsertError) {
    return {
      role: null,
      error: upsertError
    };
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .neq('role', role);

  return {
    role,
    error
  };
}

export const adminService = {
  listAdminListings,
  updateListingStatus,
  listAdminCategories,
  createCategory,
  deleteCategory,
  listUsersWithRoles,
  setUserRole
};
