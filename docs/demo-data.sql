-- NOTOLX demo data seed.
-- Apply manually through Supabase MCP `_execute_sql` or the Supabase SQL editor.
-- Do not use these public demo credentials in production.

create extension if not exists pgcrypto with schema extensions;

create temp table notolx_demo_seed_users (
  desired_id uuid primary key,
  id uuid not null,
  email text not null unique,
  password text not null,
  display_name text not null,
  phone text,
  location text,
  app_role public.app_role not null,
  preferred_language text not null
) on commit drop;

insert into notolx_demo_seed_users (
  desired_id,
  id,
  email,
  password,
  display_name,
  phone,
  location,
  app_role,
  preferred_language
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'demo@example.com',
    'demo123',
    'Демо Потребител',
    '+359 888 000 101',
    'София',
    'user',
    'bg'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'admin@example.com',
    'admin123',
    'Админ NOTOLX',
    '+359 888 000 202',
    'Пловдив',
    'admin',
    'bg'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    'test@test.com',
    '123123',
    'Тест Купувач',
    '+359 888 000 303',
    'Варна',
    'user',
    'en'
  );

-- Reuse existing auth users by email when they already exist in the project.
update notolx_demo_seed_users demo
set id = auth_users.id
from auth.users auth_users
where lower(auth_users.email) = lower(demo.email);

update auth.users auth_users
set
  encrypted_password = extensions.crypt(demo.password, extensions.gen_salt('bf')),
  email_confirmed_at = coalesce(auth_users.email_confirmed_at, now()),
  raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
  raw_user_meta_data = jsonb_build_object(
    'display_name', demo.display_name,
    'phone', demo.phone,
    'location', demo.location,
    'preferred_language', demo.preferred_language
  ),
  updated_at = now()
from notolx_demo_seed_users demo
where lower(auth_users.email) = lower(demo.email);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  demo.id,
  'authenticated',
  'authenticated',
  demo.email,
  extensions.crypt(demo.password, extensions.gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object(
    'display_name', demo.display_name,
    'phone', demo.phone,
    'location', demo.location,
    'preferred_language', demo.preferred_language
  ),
  now(),
  now()
from notolx_demo_seed_users demo
where not exists (
  select 1
  from auth.users auth_users
  where lower(auth_users.email) = lower(demo.email)
)
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

update notolx_demo_seed_users demo
set id = auth_users.id
from auth.users auth_users
where lower(auth_users.email) = lower(demo.email);

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  demo.id::text,
  demo.id,
  jsonb_build_object(
    'sub', demo.id::text,
    'email', demo.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from notolx_demo_seed_users demo
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

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
from notolx_demo_seed_users
on conflict (id) do update
set
  display_name = excluded.display_name,
  phone = excluded.phone,
  location = excluded.location,
  bio = excluded.bio,
  preferred_language = excluded.preferred_language,
  updated_at = now();

insert into public.user_roles (user_id, role)
select id, 'user'::public.app_role
from notolx_demo_seed_users
on conflict (user_id, role) do nothing;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from notolx_demo_seed_users
where email = 'admin@example.com'
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
      'demo@example.com',
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
      'demo@example.com',
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
      'admin@example.com',
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
      'admin@example.com',
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
      'demo@example.com',
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
      'test@test.com',
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
      'test@test.com',
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
  ) as listings(id, owner_email, category_slug, title, description, price, currency, condition, status, location, contact_phone, is_featured)
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
  demo_users.id,
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
join notolx_demo_seed_users demo_users on demo_users.email = demo_listings.owner_email
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

with demo_favorites as (
  select *
  from (values
    ('demo@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid),
    ('demo@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'::uuid),
    ('admin@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid),
    ('test@test.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid),
    ('test@test.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'::uuid)
  ) as favorites(user_email, listing_id)
)
insert into public.favorites (user_id, listing_id)
select demo_users.id, demo_favorites.listing_id
from demo_favorites
join notolx_demo_seed_users demo_users on demo_users.email = demo_favorites.user_email
on conflict (user_id, listing_id) do nothing;

with demo_photos as (
  select *
  from (values
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
      'demo@example.com',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
      'iPhone 13 128GB',
      0,
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
      'demo@example.com',
      'https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=900&q=80',
      'Дървена маса за трапезария',
      0,
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid,
      'admin@example.com',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80',
      'VW Golf 1.6 бензин',
      0,
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'::uuid,
      'admin@example.com',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      'Dell Latitude лаптоп',
      0,
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'::uuid,
      'demo@example.com',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
      'Градски велосипед',
      0,
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6'::uuid,
      'test@test.com',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
      'Учебници по английски език',
      0,
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7'::uuid,
      'test@test.com',
      'https://images.unsplash.com/photo-1587502536263-3b4d07170f19?auto=format&fit=crop&w=900&q=80',
      'Детско столче за кола',
      0,
      true
    )
  ) as photos(id, listing_id, owner_email, storage_path, alt_text, sort_order, is_primary)
)
insert into public.listing_photos (
  id,
  listing_id,
  owner_id,
  bucket_id,
  storage_path,
  alt_text,
  sort_order,
  is_primary
)
select
  demo_photos.id,
  demo_photos.listing_id,
  demo_users.id,
  'listing-photos',
  demo_photos.storage_path,
  demo_photos.alt_text,
  demo_photos.sort_order,
  demo_photos.is_primary
from demo_photos
join notolx_demo_seed_users demo_users on demo_users.email = demo_photos.owner_email
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order,
  is_primary = excluded.is_primary,
  updated_at = now();

-- Additional marketplace demo content with photos for a fuller browsing/admin view.
with category_ids as (
  select slug, id
  from public.categories
  where slug in ('fashion', 'pets', 'jobs', 'electronics', 'home', 'sports', 'books', 'phones')
),
demo_users as (
  select id, lower(email) as email
  from auth.users
  where lower(email) in ('demo@example.com', 'admin@example.com', 'test@test.com')
),
extra_demo_listings as (
  select *
  from (values
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'::uuid,
      'demo@example.com',
      'fashion',
      'Дамско яке Reserved',
      'Запазено пролетно яке, носено няколко пъти. Размер M, без забележки.',
      65.00,
      'BGN',
      'like_new'::public.listing_condition,
      'active'::public.listing_status,
      'София',
      '+359 888 000 101',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'::uuid,
      'admin@example.com',
      'pets',
      'Котешка драскалка с къщичка',
      'Стабилна драскалка на няколко нива. Подходяща за малка или средна котка.',
      80.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'Пловдив',
      '+359 888 000 202',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10'::uuid,
      'test@test.com',
      'jobs',
      'Почасова помощ в магазин',
      'Търси се човек за подреждане на стока и помощ на каса през уикендите.',
      12.00,
      'BGN',
      'new'::public.listing_condition,
      'active'::public.listing_status,
      'Варна',
      '+359 888 000 303',
      true
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'::uuid,
      'demo@example.com',
      'electronics',
      'Sony слушалки WH-1000XM4',
      'Безжични слушалки с активно шумопотискане, калъф и USB-C кабел.',
      240.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'София',
      '+359 888 000 101',
      true
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12'::uuid,
      'admin@example.com',
      'home',
      'Кафе машина DeLonghi',
      'Работеща кафе машина с приставка за капучино. Почистена и готова за ползване.',
      190.00,
      'BGN',
      'good'::public.listing_condition,
      'active'::public.listing_status,
      'Пловдив',
      '+359 888 000 202',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13'::uuid,
      'test@test.com',
      'sports',
      'Дъмбели 2 х 10 кг',
      'Комплект метални дъмбели за домашни тренировки. Продават се заедно.',
      70.00,
      'BGN',
      'good'::public.listing_condition,
      'draft'::public.listing_status,
      'Варна',
      '+359 888 000 303',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14'::uuid,
      'demo@example.com',
      'books',
      'Колекция криминални романи',
      'Десет книги в добро състояние. Подходящи за подарък или лична библиотека.',
      35.00,
      'BGN',
      'good'::public.listing_condition,
      'sold'::public.listing_status,
      'София',
      '+359 888 000 101',
      false
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15'::uuid,
      'admin@example.com',
      'phones',
      'Samsung Galaxy S22',
      'Телефонът е с нормални следи от употреба, 128GB памет и оригинално зарядно.',
      620.00,
      'BGN',
      'good'::public.listing_condition,
      'archived'::public.listing_status,
      'Пловдив',
      '+359 888 000 202',
      false
    )
  ) as listings(id, owner_email, category_slug, title, description, price, currency, condition, status, location, contact_phone, is_featured)
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
  extra_demo_listings.id,
  demo_users.id,
  category_ids.id,
  extra_demo_listings.title,
  extra_demo_listings.description,
  extra_demo_listings.price,
  extra_demo_listings.currency,
  extra_demo_listings.condition,
  extra_demo_listings.status,
  extra_demo_listings.location,
  extra_demo_listings.contact_phone,
  extra_demo_listings.is_featured,
  case when extra_demo_listings.status in ('active'::public.listing_status, 'sold'::public.listing_status) then now() else null end,
  case when extra_demo_listings.status = 'sold'::public.listing_status then now() else null end
from extra_demo_listings
join demo_users on demo_users.email = lower(extra_demo_listings.owner_email)
join category_ids on category_ids.slug = extra_demo_listings.category_slug
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

with demo_users as (
  select id, lower(email) as email
  from auth.users
  where lower(email) in ('demo@example.com', 'admin@example.com', 'test@test.com')
),
extra_demo_photos as (
  select *
  from (values
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'::uuid, 'demo@example.com', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=80', 'Дамско яке Reserved', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'::uuid, 'admin@example.com', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=900&q=80', 'Котешка драскалка с къщичка', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb10'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10'::uuid, 'test@test.com', 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=900&q=80', 'Почасова помощ в магазин', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb11'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'::uuid, 'demo@example.com', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 'Sony слушалки WH-1000XM4', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb12'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12'::uuid, 'admin@example.com', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', 'Кафе машина DeLonghi', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb13'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13'::uuid, 'test@test.com', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80', 'Дъмбели 2 х 10 кг', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb14'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14'::uuid, 'demo@example.com', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80', 'Колекция криминални романи', 0, true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb15'::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15'::uuid, 'admin@example.com', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80', 'Samsung Galaxy S22', 0, true)
  ) as photos(id, listing_id, owner_email, storage_path, alt_text, sort_order, is_primary)
)
insert into public.listing_photos (
  id,
  listing_id,
  owner_id,
  bucket_id,
  storage_path,
  alt_text,
  sort_order,
  is_primary
)
select
  extra_demo_photos.id,
  extra_demo_photos.listing_id,
  demo_users.id,
  'listing-photos',
  extra_demo_photos.storage_path,
  extra_demo_photos.alt_text,
  extra_demo_photos.sort_order,
  extra_demo_photos.is_primary
from extra_demo_photos
join demo_users on demo_users.email = lower(extra_demo_photos.owner_email)
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order,
  is_primary = excluded.is_primary,
  updated_at = now();

with demo_users as (
  select id, lower(email) as email
  from auth.users
  where lower(email) in ('demo@example.com', 'admin@example.com', 'test@test.com')
),
extra_demo_favorites as (
  select *
  from (values
    ('demo@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11'::uuid),
    ('demo@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12'::uuid),
    ('admin@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8'::uuid),
    ('admin@example.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10'::uuid),
    ('test@test.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9'::uuid),
    ('test@test.com', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12'::uuid)
  ) as favorites(user_email, listing_id)
)
insert into public.favorites (user_id, listing_id)
select demo_users.id, extra_demo_favorites.listing_id
from extra_demo_favorites
join demo_users on demo_users.email = lower(extra_demo_favorites.user_email)
on conflict (user_id, listing_id) do nothing;
