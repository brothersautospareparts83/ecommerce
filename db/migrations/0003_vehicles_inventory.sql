-- 0003: vehicle catalog, compatibility, inventory with enforced movement history

create table vehicle_models (
  id               uuid primary key default gen_random_uuid(),
  manufacturer_id  uuid not null references manufacturers (id) on delete cascade,
  name             citext not null,
  slug             text not null,
  created_at       timestamptz not null default now(),
  unique (manufacturer_id, name),
  unique (manufacturer_id, slug)
);

create table vehicle_generations (
  id          uuid primary key default gen_random_uuid(),
  model_id    uuid not null references vehicle_models (id) on delete cascade,
  name        text not null,
  year_from   int check (year_from between 1900 and 2100),
  year_to     int check (year_to between 1900 and 2100),
  created_at  timestamptz not null default now(),
  check (year_to is null or year_from is null or year_to >= year_from),
  unique (model_id, name)
);

create table vehicle_engines (
  id               uuid primary key default gen_random_uuid(),
  code             citext not null unique,
  displacement_cc  int check (displacement_cc > 0),
  cylinders        int check (cylinders > 0),
  fuel_type        text,
  power_kw         numeric(7, 1),
  notes            text,
  created_at       timestamptz not null default now()
);

-- A concrete fitment target: generation + engine + year range (+ trim/body/drive).
create table vehicles (
  id             uuid primary key default gen_random_uuid(),
  generation_id  uuid not null references vehicle_generations (id) on delete cascade,
  engine_id      uuid references vehicle_engines (id),
  year_from      int check (year_from between 1900 and 2100),
  year_to        int check (year_to between 1900 and 2100),
  trim           text,
  body_type      text,
  drivetrain     text,
  transmission   text,
  market         text,
  created_at     timestamptz not null default now(),
  check (year_to is null or year_from is null or year_to >= year_from)
);
create index vehicles_generation_idx on vehicles (generation_id);
create index vehicles_engine_idx on vehicles (engine_id);

create table vehicle_chassis (
  id                uuid primary key default gen_random_uuid(),
  vehicle_id        uuid not null references vehicles (id) on delete cascade,
  chassis_code      text not null,
  chassis_normalized text generated always as (upper(regexp_replace(chassis_code, '[^A-Za-z0-9]', '', 'g'))) stored,
  source            text,
  created_at        timestamptz not null default now(),
  unique (vehicle_id, chassis_code)
);
create index vehicle_chassis_norm_idx on vehicle_chassis (chassis_normalized text_pattern_ops);

-- Only rows with verified = true count as compatible anywhere in the application.
create table vehicle_compatibility (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products (id) on delete cascade,
  vehicle_id     uuid not null references vehicles (id) on delete cascade,
  position       text not null default '',
  fitment_notes  text,
  verified       boolean not null default false,
  source         compat_source not null default 'manual_admin',
  confidence     numeric(3, 2) check (confidence between 0 and 1),
  verified_by    uuid references profiles (id),
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (product_id, vehicle_id, position),
  check (not verified or verified_at is not null)
);
create index compat_vehicle_idx on vehicle_compatibility (vehicle_id) where verified;
create index compat_product_idx on vehicle_compatibility (product_id);

-- Inventory ------------------------------------------------------------
create table inventory (
  product_id        uuid primary key references products (id) on delete cascade,
  quantity_on_hand  int not null default 0 check (quantity_on_hand >= 0),
  min_stock_level   int not null default 0 check (min_stock_level >= 0),
  location          text,
  updated_at        timestamptz not null default now()
);

create table inventory_movements (
  id               bigint generated always as identity primary key,
  product_id       uuid not null references products (id),
  quantity_delta   int not null check (quantity_delta <> 0),
  quantity_before  int,
  quantity_after   int,
  reason           movement_reason not null,
  reference_type   text,
  reference_id     uuid,
  note             text,
  created_by       uuid references profiles (id),
  created_at       timestamptz not null default now()
);
create index inv_mov_product_idx on inventory_movements (product_id, created_at desc);

-- Every product gets an inventory row at zero stock.
create function create_inventory_row() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into inventory (product_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger products_inventory after insert on products for each row execute function create_inventory_row();

-- Quantity can change only through a movement row. This function applies it atomically.
create function apply_inventory_movement() returns trigger language plpgsql security definer set search_path = public as $$
declare cur int;
begin
  select quantity_on_hand into cur from inventory where product_id = new.product_id for update;
  if not found then
    raise exception 'No inventory row for product %', new.product_id;
  end if;
  if cur + new.quantity_delta < 0 then
    raise exception 'Insufficient stock: % on hand, change of %', cur, new.quantity_delta;
  end if;
  new.quantity_before = cur;
  new.quantity_after = cur + new.quantity_delta;
  perform set_config('app.movement_apply', 'on', true);
  update inventory set quantity_on_hand = new.quantity_after, updated_at = now() where product_id = new.product_id;
  perform set_config('app.movement_apply', 'off', true);
  return new;
end $$;
create trigger inventory_movements_apply before insert on inventory_movements
  for each row execute function apply_inventory_movement();

create function guard_inventory_quantity() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.quantity_on_hand <> 0 then
    raise exception 'Initial stock must be recorded as an inventory movement';
  end if;
  if tg_op = 'UPDATE' and new.quantity_on_hand is distinct from old.quantity_on_hand
     and coalesce(current_setting('app.movement_apply', true), '') <> 'on' then
    raise exception 'Stock quantity can only change through inventory_movements';
  end if;
  return new;
end $$;
create trigger inventory_guard before insert or update on inventory
  for each row execute function guard_inventory_quantity();

create function forbid_change() returns trigger language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;
create trigger inventory_movements_immutable before update or delete on inventory_movements
  for each row execute function forbid_change();
