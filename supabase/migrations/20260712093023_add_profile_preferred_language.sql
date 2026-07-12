-- Store each user's preferred interface language.
-- Bulgarian is the default language; English is optional.

alter table public.profiles
add column if not exists preferred_language text not null default 'bg';

update public.profiles
set preferred_language = 'bg'
where preferred_language is null
   or preferred_language not in ('bg', 'en');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_language_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_preferred_language_check
    check (preferred_language in ('bg', 'en'));
  end if;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  fallback_name text;
  preferred_language text;
begin
  fallback_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'New user'
  );

  if char_length(trim(fallback_name)) < 2 then
    fallback_name := 'New user';
  end if;

  preferred_language := case
    when new.raw_user_meta_data->>'preferred_language' in ('bg', 'en')
      then new.raw_user_meta_data->>'preferred_language'
    else 'bg'
  end;

  insert into public.profiles (id, display_name, avatar_url, preferred_language)
  values (new.id, left(fallback_name, 80), new.raw_user_meta_data->>'avatar_url', preferred_language)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
