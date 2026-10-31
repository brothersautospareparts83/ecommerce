-- 0012: owner decision: list every part now and add real photos later.
-- A published product may lack a classification, a selling price or a photo. The storefront shows
-- "Not yet classified", "Ask for price" and a "No photo yet" placeholder instead of guessing.
-- Unchanged: an illustrative/unverified image can never be approved as a real photo.

create or replace function guard_product_publish() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end $$;
