-- 0007: reference data only (roles, categories, vehicle makers, integration placeholders).
-- No products, prices, stock, compatibility or part numbers are seeded.

insert into roles (name, description, is_admin_role) values
  ('customer', 'Shopper account (retail, mechanic, garage, dealer, fleet, wholesale)', false),
  ('staff',    'Shop staff: manage orders, inventory and products', true),
  ('admin',    'Administrator: staff permissions plus users, settings and integrations', true),
  ('owner',    'Business owner: full access including role assignment', true);

insert into categories (slug, name_en, sort_order) values
  ('engine-components', 'Engine Components', 1),
  ('brake-systems', 'Brake Systems', 2),
  ('suspension-steering', 'Suspension and Steering', 3),
  ('oil-filters', 'Oil Filters', 4),
  ('air-filters', 'Air Filters', 5),
  ('fuel-systems', 'Fuel Systems', 6),
  ('electrical-components', 'Electrical Components', 7),
  ('cooling-systems', 'Cooling Systems', 8),
  ('transmission-components', 'Transmission Components', 9),
  ('body-parts', 'Body Parts', 10),
  ('lighting-systems', 'Lighting Systems', 11),
  ('interior-accessories', 'Interior Accessories', 12),
  ('exterior-accessories', 'Exterior Accessories', 13),
  ('bearings-seals', 'Bearings and Seals', 14),
  ('belts-hoses', 'Belts and Hoses', 15);

insert into manufacturers (name, slug) values
  ('Toyota', 'toyota'), ('Nissan', 'nissan'), ('Honda', 'honda'), ('Subaru', 'subaru'),
  ('Mitsubishi', 'mitsubishi'), ('Mazda', 'mazda'), ('Suzuki', 'suzuki'), ('Isuzu', 'isuzu'),
  ('Mercedes-Benz', 'mercedes-benz'), ('BMW', 'bmw'), ('Volkswagen', 'volkswagen'),
  ('Hyundai', 'hyundai'), ('Kia', 'kia'), ('Ford', 'ford');

-- Search vocabulary from the product brief. More terms to be added with the owner.
insert into search_synonyms (term, synonym, language) values
  ('breki', 'brake', 'sw'),
  ('chujio la oil', 'oil filter', 'sw'),
  ('chujio la hewa', 'air filter', 'sw');

-- Integration status board. Nothing here is live until credentials exist and a test passes.
insert into integration_settings (key, category, provider, status, status_note) values
  ('catalog',        'catalog',  'manual',    'operational',          'Manual catalog managed by admins; no external VIN/diagram provider configured'),
  ('image_source',   'images',   'none',      'awaiting_credentials', 'No licensed image source configured; manual upload only'),
  ('ai',             'ai',       'none',      'awaiting_credentials', 'No AI provider key configured'),
  ('payments_mpesa', 'payments', 'mpesa',     'awaiting_credentials', 'Needs merchant credentials and sandbox test'),
  ('payments_airtel','payments', 'airtel',    'awaiting_credentials', 'Needs merchant credentials and sandbox test'),
  ('payments_tigo',  'payments', 'tigo',      'awaiting_credentials', 'Needs merchant credentials and sandbox test'),
  ('payments_manual','payments', 'manual',    'operational',          'Admin-recorded cash, bank or mobile-money payments'),
  ('whatsapp',       'messaging','wa.me',     'configured_untested',  'Click-to-chat links use the business number from site config'),
  ('email',          'email',    'none',      'awaiting_credentials', 'No email provider configured'),
  ('analytics',      'marketing','none',      'awaiting_credentials', 'No Google Analytics / Search Console IDs configured');
