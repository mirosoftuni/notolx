-- NOTOLX demo data seed.
-- Apply manually through Supabase MCP `_execute_sql` or the Supabase SQL editor.
-- Do not use these public demo credentials in production.

create extension if not exists pgcrypto with schema extensions;

with demo_users as (
  select *
  from (values
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'demo@example.com',
      'Demo123!',
      'Демо Потребител',
      '+359 888 000 101',
      'София',
      'user'::public.app_role,
      'bg'
    ),
    (
      '22222222-2222-4222-8222-222222222222'::uuid,
      'admin@example.com',
      'Admin123!',
      'Админ NOTOLX',
      '+359 888 000 202',
      'Пловдив',
      'admin'::public.app_role,
      'bg'
    ),
    (
      '33333333-3333-4333-8333-333333333333'::uuid,
      'test@test.com',
      'Test123!',
      'Тест Купувач',
      '+359 888 000 303',
      'Варна',
      'user'::public.app_role,
      'en'
    )
  ) as users(id, email, password, display_name, phone, location, app_role, preferred_language)
),
upsert_auth_users as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    id,
    'authenticated',
    'authenticated',
    email,
    extensions.crypt(password, extensions.gen_salt('bf')),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object(
      'display_name', display_name,
      'phone', phone,
      'location', location,
      'preferred_language', preferred_language
    ),
    now(),
    now()
  from demo_users
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
    confirmed_at = coalesce(auth.users.confirmed_at, excluded.confirmed_at),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now()
  returning id
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  email
)
select
  gen_random_uuid(),
  demo_users.id::text,
  demo_users.id,
  jsonb_build_object(
    'sub', demo_users.id::text,
    'email', demo_users.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now(),
  demo_users.email
from demo_users
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now(),
  email = excluded.email;

with demo_users as (
  select *
  from (values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'Демо Потребител', '+359 888 000 101', 'София', 'bg'),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'Админ NOTOLX', '+359 888 000 202', 'Пловдив', 'bg'),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'Тест Купувач', '+359 888 000 303', 'Варна', 'en')
  ) as users(id, display_name, phone, location, preferred_language)
)
insert into public.profiles (
  id,
  display_name,
  phone,
  location,
  bio,
  preferred_language
)
select
  id,
  display_name,
  phone,
  location,
  'Демо профил за представяне на NOTOLX.',
  preferred_language
from demo_users
on conflict (id) do update
set
  display_name = excluded.display_name,
  phone = excluded.phone,
  location = excluded.location,
  bio = excluded.bio,
  preferred_language = excluded.preferred_language,
  updated_at = now();

insert into public.user_roles (user_id, role)
values
  ('11111111-1111-4111-8111-111111111111', 'user'),
  ('22222222-2222-4222-8222-222222222222', 'user'),
  ('22222222-2222-4222-8222-222222222222', 'admin'),
  ('33333333-3333-4333-8333-333333333333', 'user')
on conflict (user_id, role) do nothing;

insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('Phones', 'phones', 'Mobile phones, accessories, and smart devices.', 10, true),
  ('Cars', 'cars', 'Cars, parts, and vehicle accessories.', 20, true),
  ('Home', 'home', 'Furniture, appliances, and home goods.', 30, true),
  ('Electronics', 'electronics', 'Computers, audio, cameras, and gadgets.', 40, true),
  ('Fashion', 'fashion', 'Clothing, shoes, bags, and accessories.', 50, true),
  ('Sports', 'sports', 'Sports gear, bikes, and outdoor equipment.', 60, true),
  ('Jobs', 'jobs', 'Local jobs, gigs, and services.', 70, true),
  ('Pets', 'pets', 'Pet supplies and local pet-related offers.', 80, true),
  ('Books', 'books', 'Books, textbooks, comics, and magazines.', 90, true),
  ('Kids', 'kids', 'Toys, baby gear, and children products.', 100, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

with category_ids as (
  select slug, id
  from public.categories
  where slug in ('phones', 'cars', 'home', 'electronics', 'sports', 'books', 'kids')
),
demo_listings as (
  select *
  from (values
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'phones',
      'iPhone 13 128GB',
      'Запазен телефон с оригинална кутия, кабел и калъф. Батерията е в добро състояние.',
      780.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'София',
      '+359 888 000 101',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'home',
      'Дървена маса за трапезария',
      'Стабилна маса за шестима. Има леки следи от употреба, подходяща за апартамент или къща.',
      220.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'София',
      '+359 888 000 101',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'cars',
      'VW Golf 1.6 бензин',
      'Поддържан градски автомобил с валиден технически преглед. Възможен оглед след уговорка.',
      6900.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'Пловдив',
      '+359 888 000 202',
      true
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'electronics',
      'Dell Latitude лаптоп',
      'Бизнес лаптоп с SSD, 16GB RAM и зарядно. Подходящ за учене, работа и браузване.',
      540.00,
      'BGN',
      'like_new'::public.listing_condition,
      'active'::public.listing_status,
      'Пловдив',
      '+359 888 000 202',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'sports',
      'Градски велосипед',
      'Лек велосипед с 21 скорости. Подходящ за градско каране и кратки разходки.',
      180.00,
      'BGN',
      'fair'::public.listing_condition,
      'draft'::public.listing_status,
      'София',
      '+359 888 000 101',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      'books',
      'Учебници по английски език',
      'Комплект учебници и работни тетрадки за ниво B1. Част от страниците са попълвани с молив.',
      45.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'Варна',
      '+359 888 000 303',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      'kids',
      'Детско столче за кола',
      'Столче за кола 9-18 кг, чисто и запазено. Без инциденти.',
      95.00,
      'BGN',
      'good'::public.listing_condition,
      'sold'::public.listing_status,
      'Варна',
      '+359 888 000 303',
      false
    )
  ) as listings(id, owner_id, category_slug, title, description, price, currency, condition, status, location, contact_phone, is_featured)
)
insert into public.listings (
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
  sold_at
)
select
  demo_listings.id,
  demo_listings.owner_id,
  category_ids.id,
  demo_listings.title,
  demo_listings.description,
  demo_listings.price,
  demo_listings.currency,
  demo_listings.condition,
  demo_listings.status,
  demo_listings.location,
  demo_listings.contact_phone,
  demo_listings.is_featured,
  case when demo_listings.status in ('active'::public.listing_status, 'sold'::public.listing_status) then now() else null end,
  case when demo_listings.status = 'sold'::public.listing_status then now() else null end
from demo_listings
join category_ids on category_ids.slug = demo_listings.category_slug
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  condition = excluded.condition,
  status = excluded.status,
  location = excluded.location,
  contact_phone = excluded.contact_phone,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at,
  sold_at = excluded.sold_at,
  updated_at = now();

insert into public.favorites (user_id, listing_id)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4')
on conflict (user_id, listing_id) do nothing;
