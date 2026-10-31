-- 0001: extensions, enum types, database roles, shared helpers

create extension if not exists pg_trgm;
create extension if not exists citext;

-- Enums ---------------------------------------------------------------
create type product_classification as enum ('genuine_oem', 'oem_equivalent', 'aftermarket');
create type product_condition      as enum ('new', 'used', 'refurbished');
create type product_status         as enum ('draft', 'image_required', 'published', 'archived');
create type image_kind             as enum ('manufacturer_photo', 'supplier_photo', 'own_photo', 'illustrative');
create type verification_status    as enum ('pending', 'approved', 'rejected', 'manual_review');
create type customer_type          as enum ('retail', 'mechanic', 'garage', 'dealer', 'fleet', 'wholesale');
create type approval_status        as enum ('pending', 'approved', 'rejected');
create type order_status           as enum ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled');
create type delivery_method        as enum ('delivery', 'pickup');
create type payment_status         as enum ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled');
create type quotation_status       as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired', 'converted');
create type movement_reason        as enum ('opening_stock', 'purchase', 'sale', 'adjustment', 'return', 'damage', 'import', 'correction', 'order_cancelled');
create type import_mode            as enum ('add_new', 'update_existing', 'prices_only', 'stock_only', 'skip_duplicates');
create type import_status          as enum ('uploaded', 'previewed', 'processing', 'completed', 'failed', 'cancelled');
create type import_row_status      as enum ('valid', 'invalid', 'duplicate', 'imported', 'skipped', 'failed');
create type compat_source          as enum ('manual_admin', 'catalog_provider', 'supplier_data');
create type cross_ref_relation     as enum ('supersedes', 'superseded_by', 'equivalent', 'alternative', 'interchange');
create type integration_status     as enum ('awaiting_credentials', 'configured_untested', 'operational', 'disabled');
create type support_status         as enum ('open', 'in_progress', 'resolved', 'closed');

-- Database roles ------------------------------------------------------
-- The application connects as the database owner and runs each request under
-- SET LOCAL ROLE app_customer (visitors and customers) or app_staff (admins),
-- after setting app.user_id / app.user_role. Row Level Security applies to both.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_customer') then
    create role app_customer nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'app_staff') then
    create role app_staff nologin;
  end if;
end $$;

grant app_customer, app_staff to current_user;
grant usage on schema public to app_customer, app_staff;

-- Shared helpers ------------------------------------------------------
create function app_user_id() returns uuid
  language sql stable as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

create function normalize_part_number(pn text) returns text
  language sql immutable as $$ select upper(regexp_replace(coalesce(pn, ''), '[^A-Za-z0-9]', '', 'g')) $$;

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
