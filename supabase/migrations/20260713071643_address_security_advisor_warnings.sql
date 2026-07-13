-- Address Supabase security advisor warnings for NOTOLX.
-- Prepared locally; apply through Supabase MCP after review.

-- Public buckets can still serve files through public URLs without broad
-- storage.objects SELECT policies. Removing these policies prevents clients
-- from listing every object in the public buckets.
drop policy if exists "Public can read avatar files" on storage.objects;
drop policy if exists "Public can read listing photo files" on storage.objects;

-- The admin status RPC is intentionally callable by signed-in users because it
-- performs its own private.is_admin() check before updating a listing. Anonymous
-- users should not be able to call it at all.
revoke execute on function public.admin_set_listing_status(uuid, public.listing_status) from anon;
revoke execute on function public.admin_set_listing_status(uuid, public.listing_status) from public;
grant execute on function public.admin_set_listing_status(uuid, public.listing_status) to authenticated, service_role;
