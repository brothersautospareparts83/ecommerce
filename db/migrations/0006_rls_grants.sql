-- 0006: Row Level Security and privileges.
-- Model: the app connects as the owner and runs each request under SET LOCAL ROLE
--   app_customer (visitors + customers; identity in app.user_id) or app_staff (admins).
-- Customers get column-limited, row-filtered read access. Staff get full access except
-- immutable tables (audit_logs, inventory_movements) and the inventory quantity column.

-- 1. Enable RLS on every table and give staff a full-access policy ------------------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename <> 'schema_migrations' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('create policy staff_all on public.%I for all to app_staff using (true) with check (true)', t.tablename);
  end loop;
end $$;

-- 2. Staff privileges ---------------------------------------------------------------
grant select, insert, update, delete on all tables in schema public to app_staff;
grant usage, select on all sequences in schema public to app_staff, app_customer;
revoke update, delete on audit_logs, inventory_movements from app_staff;
revoke update on inventory from app_staff;
grant update (min_stock_level, location, updated_at) on inventory to app_staff;

-- 3. Customer privileges (column-limited: no cost_price_tzs, no internal fields) ----
grant select (id, sku, slug, name, description, brand_id, category_id, classification, condition,
              price_tzs, weight_kg, status, published_at, search_vector, created_at, updated_at)
  on products to app_customer;
grant select on categories, brands, manufacturers, vehicle_models, vehicle_generations,
  vehicle_engines, vehicles, vehicle_chassis, oem_part_numbers, part_cross_references,
  product_categories, search_synonyms to app_customer;
grant select (id, product_id, storage_path, url, kind, is_primary, source_name, attribution,
              width, height, verification_status, created_at)
  on product_images to app_customer;
grant select (id, product_id, vehicle_id, position, fitment_notes, verified, confidence)
  on vehicle_compatibility to app_customer;
grant select (product_id, quantity_on_hand) on inventory to app_customer;

grant select on profiles to app_customer;
grant update (full_name, phone, preferred_language) on profiles to app_customer;
grant select on customers to app_customer;
grant select, insert, update, delete on addresses, wishlists, saved_vehicles to app_customer;
grant select on orders, order_items, order_status_history, payments to app_customer;
grant select, insert, update on quotations to app_customer;
grant select, insert, update, delete on quotation_items to app_customer;
grant select, insert, update on ai_conversations to app_customer;
grant select, insert on ai_messages to app_customer;
grant select, insert on support_requests to app_customer;
grant select on notifications to app_customer;
grant update (read_at) on notifications to app_customer;
grant insert on search_queries to app_customer;

-- 4. Customer row policies ------------------------------------------------------------
create policy products_public on products for select to app_customer using (status = 'published');

create policy categories_public on categories for select to app_customer using (is_active);
create policy brands_public on brands for select to app_customer using (is_active);
create policy manufacturers_public on manufacturers for select to app_customer using (is_active);
create policy vmodels_public on vehicle_models for select to app_customer using (true);
create policy vgen_public on vehicle_generations for select to app_customer using (true);
create policy vengines_public on vehicle_engines for select to app_customer using (true);
create policy vehicles_public on vehicles for select to app_customer using (true);
create policy vchassis_public on vehicle_chassis for select to app_customer using (true);
create policy synonyms_public on search_synonyms for select to app_customer using (true);

create policy oem_public on oem_part_numbers for select to app_customer
  using (exists (select 1 from products p where p.id = product_id));
create policy xref_public on part_cross_references for select to app_customer
  using (verified and exists (select 1 from oem_part_numbers o where o.id = oem_part_id));
create policy prodcat_public on product_categories for select to app_customer
  using (exists (select 1 from products p where p.id = product_id));
create policy images_public on product_images for select to app_customer
  using (verification_status = 'approved' and kind <> 'illustrative'
         and exists (select 1 from products p where p.id = product_id));
create policy compat_public on vehicle_compatibility for select to app_customer
  using (verified and exists (select 1 from products p where p.id = product_id));
create policy inventory_public on inventory for select to app_customer
  using (exists (select 1 from products p where p.id = product_id));

create policy profiles_own_select on profiles for select to app_customer using (id = app_user_id());
create policy profiles_own_update on profiles for update to app_customer
  using (id = app_user_id()) with check (id = app_user_id());
create policy customers_own on customers for select to app_customer using (profile_id = app_user_id());

create policy addresses_own on addresses for all to app_customer
  using (profile_id = app_user_id()) with check (profile_id = app_user_id());
create policy wishlists_own on wishlists for all to app_customer
  using (profile_id = app_user_id()) with check (profile_id = app_user_id());
create policy saved_vehicles_own on saved_vehicles for all to app_customer
  using (profile_id = app_user_id()) with check (profile_id = app_user_id());

create policy orders_own on orders for select to app_customer using (profile_id = app_user_id());
create policy order_items_own on order_items for select to app_customer
  using (exists (select 1 from orders o where o.id = order_id and o.profile_id = app_user_id()));
create policy order_history_own on order_status_history for select to app_customer
  using (exists (select 1 from orders o where o.id = order_id and o.profile_id = app_user_id()));
create policy payments_own on payments for select to app_customer
  using (exists (select 1 from orders o where o.id = order_id and o.profile_id = app_user_id()));

create policy quotations_own_select on quotations for select to app_customer using (profile_id = app_user_id());
create policy quotations_own_insert on quotations for insert to app_customer
  with check (profile_id = app_user_id() and status in ('draft', 'submitted'));
create policy quotations_own_update on quotations for update to app_customer
  using (profile_id = app_user_id() and status = 'draft')
  with check (profile_id = app_user_id() and status in ('draft', 'submitted'));
create policy quotation_items_own on quotation_items for all to app_customer
  using (exists (select 1 from quotations q where q.id = quotation_id and q.profile_id = app_user_id() and q.status = 'draft'))
  with check (exists (select 1 from quotations q where q.id = quotation_id and q.profile_id = app_user_id() and q.status = 'draft'));

create policy ai_conv_own on ai_conversations for all to app_customer
  using (profile_id = app_user_id()) with check (profile_id = app_user_id());
create policy ai_msg_own on ai_messages for all to app_customer
  using (exists (select 1 from ai_conversations c where c.id = conversation_id and c.profile_id = app_user_id()))
  with check (exists (select 1 from ai_conversations c where c.id = conversation_id and c.profile_id = app_user_id()));

create policy support_own_select on support_requests for select to app_customer using (profile_id = app_user_id());
create policy support_own_insert on support_requests for insert to app_customer
  with check (profile_id is not distinct from app_user_id());

create policy notifications_own on notifications for select to app_customer using (profile_id = app_user_id());
create policy notifications_own_update on notifications for update to app_customer
  using (profile_id = app_user_id()) with check (profile_id = app_user_id());

create policy search_queries_insert on search_queries for insert to app_customer with check (true);
