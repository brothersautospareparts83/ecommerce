-- 0011: stock quantities and buying prices are staff-only, enforced in the database.
-- Customers can no longer read the inventory table at all. They get a yes/no availability
-- answer for published products through a function, never a number.

create function product_in_stock(p_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(
    (select i.quantity_on_hand > 0
       from inventory i join products p on p.id = i.product_id
      where i.product_id = p_id and p.status = 'published'),
    false)
$$;

revoke all on function product_in_stock(uuid) from public;
grant execute on function product_in_stock(uuid) to app_customer, app_staff;

revoke select on inventory from app_customer;
drop policy if exists inventory_public on inventory;
