-- 0004: orders, payments, quotations, wishlists, saved vehicles

create sequence order_ref_seq;
create sequence quotation_ref_seq;

create table orders (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique default (
                      'BAS-' || to_char(now() at time zone 'Africa/Dar_es_Salaam', 'YYMMDD') || '-' ||
                      lpad(nextval('order_ref_seq')::text, 5, '0')),
  profile_id        uuid references profiles (id) on delete set null,  -- null for guest orders
  customer_name     text not null,
  phone             text not null check (phone ~ '^\+255[0-9]{9}$'),
  email             citext,
  delivery_method   delivery_method not null,
  delivery_address  jsonb,       -- region, city, district, street, landmark
  status            order_status not null default 'pending',
  payment_status    payment_status not null default 'pending',
  subtotal_tzs      bigint not null check (subtotal_tzs >= 0),
  discount_tzs      bigint not null default 0 check (discount_tzs >= 0),
  delivery_fee_tzs  bigint not null default 0 check (delivery_fee_tzs >= 0),
  total_tzs         bigint not null check (total_tzs >= 0),
  notes             text,
  channel           text not null default 'web' check (channel in ('web', 'whatsapp', 'admin')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (total_tzs = subtotal_tzs - discount_tzs + delivery_fee_tzs),
  check (delivery_method = 'pickup' or delivery_address is not null)
);
create index orders_profile_idx on orders (profile_id, created_at desc);
create index orders_status_idx on orders (status, created_at desc);
create trigger orders_updated before update on orders for each row execute function set_updated_at();

create table order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references orders (id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid references profiles (id),
  note        text,
  created_at  timestamptz not null default now()
);
create index order_history_order_idx on order_status_history (order_id, created_at);

create function record_order_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, app_user_id());
  elsif new.status is distinct from old.status then
    insert into order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, app_user_id());
  end if;
  return null;
end $$;
create trigger orders_status_history after insert or update on orders
  for each row execute function record_order_status();

create table order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders (id) on delete cascade,
  product_id        uuid not null references products (id),
  sku               text not null,
  product_name      text not null,
  classification    product_classification not null,
  unit_price_tzs    bigint not null check (unit_price_tzs >= 0),
  quantity          int not null check (quantity > 0),
  line_total_tzs    bigint not null,
  check (line_total_tzs = unit_price_tzs * quantity)
);
create index order_items_order_idx on order_items (order_id);

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders (id),
  provider            text not null,   -- 'manual', 'mpesa', 'airtel', 'tigo', 'bank', ...
  method              text,
  amount_tzs          bigint not null check (amount_tzs > 0),
  status              payment_status not null default 'pending',
  provider_reference  text,
  raw_payload         jsonb,
  failure_reason      text,
  verified_by         uuid references profiles (id),
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- 'paid' is only valid once someone or something has verified it.
  check (status <> 'paid' or verified_at is not null)
);
create index payments_order_idx on payments (order_id);
create unique index payments_provider_ref_uniq on payments (provider, provider_reference) where provider_reference is not null;
create trigger payments_updated before update on payments for each row execute function set_updated_at();

create table quotations (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique default (
                  'QUO-' || to_char(now() at time zone 'Africa/Dar_es_Salaam', 'YYMMDD') || '-' ||
                  lpad(nextval('quotation_ref_seq')::text, 5, '0')),
  profile_id    uuid references profiles (id) on delete set null,
  contact_name  text not null,
  phone         text not null check (phone ~ '^\+255[0-9]{9}$'),
  email         citext,
  status        quotation_status not null default 'draft',
  subtotal_tzs  bigint not null default 0 check (subtotal_tzs >= 0),
  discount_tzs  bigint not null default 0 check (discount_tzs >= 0),
  total_tzs     bigint not null default 0 check (total_tzs >= 0),
  notes         text,
  ai_generated  boolean not null default false,
  valid_until   date,
  approved_by   uuid references profiles (id),
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (total_tzs = subtotal_tzs - discount_tzs)
);
create index quotations_profile_idx on quotations (profile_id, created_at desc);
create index quotations_status_idx on quotations (status);
create trigger quotations_updated before update on quotations for each row execute function set_updated_at();

create table quotation_items (
  id              uuid primary key default gen_random_uuid(),
  quotation_id    uuid not null references quotations (id) on delete cascade,
  product_id      uuid references products (id),
  description     text not null,
  sku             text,
  unit_price_tzs  bigint check (unit_price_tzs >= 0),   -- null until staff prices an unlisted item
  quantity        int not null check (quantity > 0),
  line_total_tzs  bigint check (line_total_tzs >= 0)
);
create index quotation_items_q_idx on quotation_items (quotation_id);

create table wishlists (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  product_id  uuid not null references products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (profile_id, product_id)
);

create table saved_vehicles (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles (id) on delete cascade,
  vehicle_id       uuid references vehicles (id) on delete set null,
  nickname         text,
  plate_number     text,
  chassis_number   text,
  make_text        text,   -- free text when the vehicle is not (yet) in the catalog
  model_text       text,
  year             int check (year between 1900 and 2100),
  created_at       timestamptz not null default now()
);
create index saved_vehicles_profile_idx on saved_vehicles (profile_id);
