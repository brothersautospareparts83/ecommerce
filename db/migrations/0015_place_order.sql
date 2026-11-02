-- 0015: guest/customer checkout. Customers have no INSERT right on orders; they call place_order(), which
-- re-reads every price and the stock from the database (the browser's cart is never trusted), then inserts
-- the order and its lines atomically. Stock is only checked here, not deducted: staff confirm the order first.

create function place_order(
  p_name text, p_phone text, p_email text, p_method delivery_method, p_address jsonb, p_notes text, p_items jsonb
) returns table (reference text, total_tzs bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_order  uuid;
  v_ref    text;
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
  values (nullif(app_user_id()::text, '')::uuid, trim(p_name), p_phone, nullif(trim(p_email), ''), p_method,
          case when p_method = 'delivery' then p_address end, nullif(trim(p_notes), ''), 0, 0, 'web')
  returning id, orders.reference into v_order, v_ref;

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
  return query select v_ref, v_sub;
end $$;

revoke all on function place_order(text, text, text, delivery_method, jsonb, text, jsonb) from public;
grant execute on function place_order(text, text, text, delivery_method, jsonb, text, jsonb) to app_customer;
