-- 0016: order tracking and the photo-approval safeguard.
--  * every order gets a random tracking code; a customer needs reference + code to see it (no login needed)
--  * staff attach a REAL photo of the customer's exact part (order_photo_checks); the customer approves or
--    rejects it before the order is delivered
--  * stock is deducted (as a recorded movement) only when staff confirm the order; orders.stock_deducted tracks it
--  * customers never read these tables directly: they call track_order() / respond_photo_check()

alter table orders add column tracking_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
alter table orders add column stock_deducted boolean not null default false;

create type photo_check_status as enum ('pending', 'approved', 'rejected');

create table order_photo_checks (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders (id) on delete cascade,
  image_url        text not null check (image_url like 'https://%'),
  note             text,
  status           photo_check_status not null default 'pending',
  customer_comment text,
  created_by       uuid references profiles (id),
  created_at       timestamptz not null default now(),
  responded_at     timestamptz
);
create index order_photo_checks_order_idx on order_photo_checks (order_id, created_at desc);
alter table order_photo_checks enable row level security;
create policy staff_all on order_photo_checks for all to app_staff using (true) with check (true);
grant select, insert, update, delete on order_photo_checks to app_staff;

-- place_order now also returns the tracking code (return type changes, so recreate it).
drop function place_order(text, text, text, delivery_method, jsonb, text, jsonb);
create function place_order(
  p_name text, p_phone text, p_email text, p_method delivery_method, p_address jsonb, p_notes text, p_items jsonb
) returns table (reference text, total_tzs bigint, tracking_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_order  uuid;
  v_ref    text;
  v_code   text;
  v_sub    bigint := 0;
  v_item   record;
  v_prod   record;
  v_onhand int;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'NAME REQUIRED'; end if;
  if p_phone !~ '^\+255[0-9]{9}$' then raise exception 'INVALID PHONE'; end if;
  if p_method = 'delivery' and (p_address is null or coalesce(trim(p_address->>'address'), '') = '') then
    raise exception 'ADDRESS REQUIRED';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'CART EMPTY';
  end if;

  insert into orders (profile_id, customer_name, phone, email, delivery_method, delivery_address, notes,
                      subtotal_tzs, total_tzs, channel)
  values (app_user_id(), trim(p_name), p_phone, nullif(trim(p_email), ''), p_method,
          case when p_method = 'delivery' then p_address end, nullif(trim(p_notes), ''), 0, 0, 'web')
  returning id, orders.reference, orders.tracking_code into v_order, v_ref, v_code;

  for v_item in
    select (e->>'product_id')::uuid as product_id, sum((e->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) e group by 1
  loop
    if v_item.quantity < 1 or v_item.quantity > 99 then raise exception 'INVALID QUANTITY'; end if;
    select p.id, p.sku::text as sku, p.name, p.classification, p.price_tzs into v_prod
    from products p where p.id = v_item.product_id and p.status = 'published';
    if not found then raise exception 'PRODUCT UNAVAILABLE'; end if;
    if v_prod.price_tzs <= 0 then raise exception 'NO PRICE: %', v_prod.name; end if;
    select coalesce(i.quantity_on_hand, 0) into v_onhand from inventory i where i.product_id = v_prod.id;
    if coalesce(v_onhand, 0) < v_item.quantity then raise exception 'OUT OF STOCK: %', v_prod.name; end if;
    insert into order_items (order_id, product_id, sku, product_name, classification, unit_price_tzs, quantity, line_total_tzs)
    values (v_order, v_prod.id, v_prod.sku, v_prod.name, v_prod.classification, v_prod.price_tzs, v_item.quantity,
            v_prod.price_tzs * v_item.quantity);
    v_sub := v_sub + v_prod.price_tzs * v_item.quantity;
  end loop;

  update orders o set subtotal_tzs = v_sub, total_tzs = v_sub where o.id = v_order;
  return query select v_ref, v_sub, v_code;
end $$;
revoke all on function place_order(text, text, text, delivery_method, jsonb, text, jsonb) from public;
grant execute on function place_order(text, text, text, delivery_method, jsonb, text, jsonb) to app_customer;

-- What a customer may see about their own order: no phone, address or staff notes.
create function track_order(p_ref text, p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare o orders%rowtype;
begin
  select * into o from orders where orders.reference = upper(trim(p_ref)) and orders.tracking_code = upper(trim(p_code));
  if not found then return null; end if;
  return jsonb_build_object(
    'reference', o.reference, 'status', o.status, 'payment_status', o.payment_status,
    'delivery_method', o.delivery_method, 'subtotal_tzs', o.subtotal_tzs, 'delivery_fee_tzs', o.delivery_fee_tzs,
    'total_tzs', o.total_tzs, 'created_at', o.created_at,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', i.product_name, 'quantity', i.quantity,
                'unit_price_tzs', i.unit_price_tzs, 'line_total_tzs', i.line_total_tzs) order by i.product_name), '[]'::jsonb)
              from order_items i where i.order_id = o.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'image_url', p.image_url, 'note', p.note,
                'status', p.status, 'created_at', p.created_at) order by p.created_at desc), '[]'::jsonb)
               from order_photo_checks p where p.order_id = o.id));
end $$;
revoke all on function track_order(text, text) from public;
grant execute on function track_order(text, text) to app_customer;

-- The customer approves or rejects a pending photo of their own order.
create function respond_photo_check(p_ref text, p_code text, p_photo uuid, p_approve boolean, p_comment text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_order uuid; v_n int;
begin
  select id into v_order from orders where orders.reference = upper(trim(p_ref)) and orders.tracking_code = upper(trim(p_code));
  if v_order is null then return false; end if;
  update order_photo_checks
     set status = case when p_approve then 'approved'::photo_check_status else 'rejected'::photo_check_status end,
         customer_comment = nullif(left(trim(coalesce(p_comment, '')), 300), ''), responded_at = now()
   where id = p_photo and order_id = v_order and status = 'pending';
  get diagnostics v_n = row_count;
  return v_n = 1;
end $$;
revoke all on function respond_photo_check(text, text, uuid, boolean, text) from public;
grant execute on function respond_photo_check(text, text, uuid, boolean, text) to app_customer;
