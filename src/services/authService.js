import { getSupabaseClient } from './supabaseClient.js';

function authCredentials(input, password, extra = {}) {
  if (typeof input === 'object' && input !== null) {
    return input;
  }

  return {
    email: input,
    password,
    ...extra
  };
}

function profilePayload(input = {}) {
  return {
    display_name: input.displayName ?? input.display_name,
    phone: input.phone,
    location: input.location,
    avatar_url: input.avatarUrl ?? input.avatar_url,
    bio: input.bio,
    preferred_language: input.preferredLanguage ?? input.preferred_language
  };
}

function compactObject(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

export async function register(input, password, profile = {}) {
  const supabase = getSupabaseClient();
  const credentials = authCredentials(input, password, profile);
  const metadata = compactObject({
    display_name: credentials.displayName ?? credentials.display_name,
    full_name: credentials.fullName ?? credentials.full_name,
    phone: credentials.phone,
    location: credentials.location,
    avatar_url: credentials.avatarUrl ?? credentials.avatar_url,
    preferred_language: credentials.preferredLanguage ?? credentials.preferred_language
  });

  const options = {
    data: metadata
  };

  if (credentials.redirectTo) {
    options.emailRedirectTo = credentials.redirectTo;
  }

  return supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options
  });
}

export async function login(input, password) {
  const supabase = getSupabaseClient();
  const credentials = authCredentials(input, password);

  return supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });
}

export async function logout(options = {}) {
  const supabase = getSupabaseClient();

  return supabase.auth.signOut(options);
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  return {
    session: data.session,
    error
  };
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  return {
    user: data.user,
    error
  };
}

export async function getProfile(userId) {
  const supabase = getSupabaseClient();
  const id = userId ?? (await getCurrentUser()).user?.id;

  if (!id) {
    return {
      profile: null,
      error: new Error('No authenticated user found.')
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return {
    profile: data,
    error
  };
}

export async function updateProfile(updates, userId) {
  const supabase = getSupabaseClient();
  const id = userId ?? (await getCurrentUser()).user?.id;

  if (!id) {
    return {
      profile: null,
      error: new Error('No authenticated user found.')
    };
  }

  const payload = compactObject({
    id,
    ...profilePayload(updates)
  });

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select()
    .single();

  return {
    profile: data,
    error
  };
}

export async function getUserRole(userId) {
  const supabase = getSupabaseClient();
  const id = userId ?? (await getCurrentUser()).user?.id;

  if (!id) {
    return {
      role: null,
      roles: [],
      error: new Error('No authenticated user found.')
    };
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', id);

  const roles = data?.map((row) => row.role) ?? [];

  return {
    role: roles.includes('admin') ? 'admin' : (roles[0] ?? null),
    roles,
    error
  };
}

export async function isAdmin(userId) {
  const { roles, error } = await getUserRole(userId);

  return {
    isAdmin: roles.includes('admin'),
    error
  };
}

export const authService = {
  register,
  login,
  logout,
  getCurrentSession,
  getCurrentUser,
  getProfile,
  updateProfile,
  getUserRole,
  isAdmin
};
