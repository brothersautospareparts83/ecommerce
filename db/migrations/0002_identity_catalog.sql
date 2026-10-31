-- 0002: identity (roles, profiles, customers), catalog (categories, brands, products, images)

create table roles (
  name            text primary key,
  description     text not null,
  is_admin_role   boolean not null default false,
  permissions     jsonb not null default '[]'::jsonb
);

-- Application profile. auth_user_id links to the auth provider's user id (Phase 3).
create table profiles (
  id                  uuid primary key default gen_random_uuid(),
  auth_user_id        text unique,
  email               citext unique,
  full_name           text,
  phone               text check (phone ~ '^\+255[0-9]{9}$'),
  role                text not null default 'customer' references roles (name),
  preferred_language  text not null default 'en' check (preferred_language in ('en', 'sw')),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- Customers may never change their own role; only admin/owner sessions (or the migration owner) can.
create function guard_profile_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and current_user in ('app_customer', 'app_staff')
     and coalesce(current_setting('app.user_role', true), '') not in ('admin', 'owner') then
    raise exception 'Only an admin or owner can change roles';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on profiles for each row execute function guard_profile_role();

create table customers (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null unique references profiles (id) on delete cascade,
  customer_type     customer_type not null default 'retail',
  business_name     text,
  tin_number        text,
  approval_status   approval_status not null default 'approved',
  discount_percent  numeric(5, 2) not null default 0 check (discount_percent between 0 and 100),
  approved_by       uuid references profiles (id),
  approved_at       timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger customers_updated before update on customers for each row execute function set_updated_at();

create table addresses (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  label       text,
  full_name   text not null,
  phone       text not null check (phone ~ '^\+255[0-9]{9}$'),
  region      text not null,
  city        text not null,
  district    text,
  street      text,
  landmark    text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index addresses_profile_idx on addresses (profile_id);
create unique index addresses_one_default on addresses (profile_id) where is_default;
create trigger addresses_updated before update on addresses for each row execute function set_updated_at();

-- Catalog -------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories (id) on delete set null,
  slug        text not null unique,
  name_en     text not null,
  name_sw     text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index categories_parent_idx on categories (parent_id);

-- Product brands (e.g. the maker of a brake pad). Not vehicle makers.
create table brands (
  id          uuid primary key default gen_random_uuid(),
  name        citext not null unique,
  slug        text not null unique,
  country     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Vehicle makers (Toyota, Nissan, ...).
create table manufacturers (
  id          uuid primary key default gen_random_uuid(),
  name        citext not null unique,
  slug        text not null unique,
  country     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table products (
  id                uuid primary key default gen_random_uuid(),
  sku               citext not null unique,
  slug              text not null unique,
  name              text not null,
  description       text,
  brand_id          uuid references brands (id),
  category_id       uuid references categories (id),
  classification    product_classification not null,
  condition         product_condition not null default 'new',
  price_tzs         bigint not null check (price_tzs >= 0),
  cost_price_tzs    bigint check (cost_price_tzs >= 0),  -- admin only (column privileges)
  weight_kg         numeric(8, 3) check (weight_kg >= 0),
  status            product_status not null default 'draft',
  published_at      timestamptz,
  search_vector     tsvector generated always as (
                      to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(sku::text, '') || ' ' || coalesce(description, ''))
                    ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_status_idx on products (status);
create index products_category_idx on products (category_id);
create index products_brand_idx on products (brand_id);
create index products_price_idx on products (price_tzs);
create index products_search_idx on products using gin (search_vector);
create index products_name_trgm on products using gin (name gin_trgm_ops);
create index products_sku_trgm on products using gin ((sku::text) gin_trgm_ops);
create trigger products_updated before update on products for each row execute function set_updated_at();

create table product_categories (
  product_id   uuid not null references products (id) on delete cascade,
  category_id  uuid not null references categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_cat_idx on product_categories (category_id);

create table product_images (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references products (id) on delete cascade,
  storage_path         text not null,
  url                  text not null,
  kind                 image_kind not null,
  is_primary           boolean not null default false,
  source_name          text,
  source_url           text,
  license              text,
  attribution          text,
  width                int check (width > 0),
  height               int check (height > 0),
  verification_status  verification_status not null default 'pending',
  verified_by          uuid references profiles (id),
  verified_at          timestamptz,
  created_at           timestamptz not null default now(),
  -- An illustrative / generated picture can never be approved as a real product photo.
  constraint illustrative_never_approved check (not (kind = 'illustrative' and verification_status = 'approved'))
);
create index product_images_product_idx on product_images (product_id);
create unique index product_images_one_primary on product_images (product_id) where is_primary;

-- A product may only be published with an approved real photograph.
create function guard_product_publish() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not exists (
      select 1 from product_images
      where product_id = new.id and verification_status = 'approved' and kind <> 'illustrative'
    ) then
      raise exception 'IMAGE REQUIRED: product % cannot be published without an approved real photograph', new.sku;
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end $$;
create trigger products_publish_guard before insert or update on products
  for each row execute function guard_product_publish();

-- If the last approved photo is removed/rejected, a published product drops back to image_required.
create function demote_product_without_image() returns trigger language plpgsql as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  if not exists (
    select 1 from product_images
    where product_id = pid and verification_status = 'approved' and kind <> 'illustrative'
  ) then
    update products set status = 'image_required' where id = pid and status = 'published';
  end if;
  return null;
end $$;
create trigger product_images_demote after update or delete on product_images
  for each row execute function demote_product_without_image();

create table oem_part_numbers (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products (id) on delete cascade,
  part_number       text not null,
  normalized        text generated always as (normalize_part_number(part_number)) stored,
  manufacturer_id   uuid references manufacturers (id),
  brand_id          uuid references brands (id),
  is_primary        boolean not null default false,
  is_alternative    boolean not null default false,
  created_at        timestamptz not null default now(),
  check (normalized <> ''),
  unique (product_id, normalized)
);
create index oem_normalized_idx on oem_part_numbers (normalized text_pattern_ops);
create index oem_normalized_trgm on oem_part_numbers using gin (normalized gin_trgm_ops);

create table part_cross_references (
  id                 uuid primary key default gen_random_uuid(),
  oem_part_id        uuid not null references oem_part_numbers (id) on delete cascade,
  cross_number       text not null,
  cross_normalized   text generated always as (normalize_part_number(cross_number)) stored,
  cross_brand_id     uuid references brands (id),
  relation           cross_ref_relation not null,
  verified           boolean not null default false,
  source             text,
  created_at         timestamptz not null default now(),
  check (cross_normalized <> '')
);
create index cross_ref_normalized_idx on part_cross_references (cross_normalized text_pattern_ops);
create index cross_ref_oem_idx on part_cross_references (oem_part_id);
