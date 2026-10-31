-- 0013: owner decision (2026-10-31): AI-generated reference images may be shown on products as a stand-in
-- until real photos exist. They are stored with kind 'illustrative' so they stay distinguishable in the
-- data, and real photos always rank ahead of them in the storefront queries.
alter table product_images drop constraint if exists illustrative_never_approved;

drop policy images_public on product_images;
create policy images_public on product_images for select to app_customer
  using (verification_status = 'approved' and exists (select 1 from products p where p.id = product_id));
