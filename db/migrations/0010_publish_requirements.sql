-- 0010: a product can only be published when it is fully ready for customers:
-- classified (never guessed), priced, and carrying an approved real photograph.

create or replace function guard_product_publish() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if new.classification::text = 'unverified' then
      raise exception 'CLASSIFICATION REQUIRED: set Genuine OEM, OEM equivalent or Aftermarket before publishing %', new.sku;
    end if;
    if new.price_tzs <= 0 then
      raise exception 'PRICE REQUIRED: set a selling price before publishing %', new.sku;
    end if;
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
