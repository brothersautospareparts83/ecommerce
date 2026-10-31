-- 0009: imported stock lists do not say whether a part is Genuine OEM, OEM equivalent or Aftermarket.
-- Rather than guess, imported products start as 'unverified' and an admin must classify them.
-- import_key lets re-imports recognise a product without ever overwriting it.

alter type product_classification add value if not exists 'unverified';

alter table products add column import_key text;
create unique index products_import_key_uniq on products (import_key) where import_key is not null;
