-- Backfill NOTOLX profile records for auth users that existed before the
-- accidental recipe schema was replaced with the NOTOLX schema.

insert into public.profiles (id, display_name, avatar_url, created_at, updated_at)
select
  users.id,
  left(coalesce(
    nullif(trim(users.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(users.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(users.email, '@', 1), ''),
    'New user'
  ), 80) as display_name,
  users.raw_user_meta_data->>'avatar_url' as avatar_url,
  now(),
  now()
from auth.users
where not exists (
  select 1
  from public.profiles
  where profiles.id = users.id
);

insert into public.user_roles (user_id, role)
select users.id, 'user'::public.app_role
from auth.users
where not exists (
  select 1
  from public.user_roles
  where user_roles.user_id = users.id
    and user_roles.role = 'user'::public.app_role
);
