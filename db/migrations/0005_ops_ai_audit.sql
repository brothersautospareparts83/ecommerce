-- 0005: imports, image review queue, search, AI, support, notifications, audit, integrations

create table import_jobs (
  id               uuid primary key default gen_random_uuid(),
  file_name        text not null,
  storage_path     text,
  mode             import_mode not null default 'add_new',
  status           import_status not null default 'uploaded',
  column_mapping   jsonb,
  total_rows       int not null default 0,
  valid_rows       int not null default 0,
  invalid_rows     int not null default 0,
  duplicate_rows   int not null default 0,
  imported_rows    int not null default 0,
  failed_rows      int not null default 0,
  images_found     int not null default 0,
  images_pending   int not null default 0,
  report_path      text,
  created_by       uuid references profiles (id),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create table import_job_rows (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references import_jobs (id) on delete cascade,
  row_number          int not null,
  raw                 jsonb not null,
  normalized          jsonb,
  status              import_row_status not null default 'valid',
  errors              jsonb not null default '[]'::jsonb,
  matched_product_id  uuid references products (id),
  action              text,
  created_at          timestamptz not null default now(),
  unique (job_id, row_number)
);
create index import_rows_status_idx on import_job_rows (job_id, status);

create table image_verification_queue (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products (id) on delete cascade,
  image_id          uuid references product_images (id) on delete set null,
  candidate_url     text,
  source_name       text,
  license           text,
  width             int,
  height            int,
  match_confidence  numeric(4, 3) check (match_confidence between 0 and 1),
  status            verification_status not null default 'pending',
  note              text,
  reviewed_by       uuid references profiles (id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index image_queue_status_idx on image_verification_queue (status, created_at);
create index image_queue_product_idx on image_verification_queue (product_id);

-- Search support (Swahili / mechanic vocabulary) and demand analytics.
create table search_synonyms (
  id        uuid primary key default gen_random_uuid(),
  term      text not null,
  synonym   text not null,
  language  text not null default 'sw' check (language in ('en', 'sw')),
  unique (term, synonym)
);

create table search_queries (
  id            uuid primary key default gen_random_uuid(),
  query         text not null,
  mode          text not null check (mode in ('vin', 'oem', 'name', 'vehicle', 'ai')),
  result_count  int not null default 0,
  profile_id    uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index search_queries_created_idx on search_queries (created_at desc);
create index search_queries_zero_idx on search_queries (created_at desc) where result_count = 0;

create table ai_conversations (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid references profiles (id) on delete set null,
  anon_token_hash    text,
  language           text not null default 'en' check (language in ('en', 'sw')),
  escalated          boolean not null default false,
  escalation_reason  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index ai_conv_profile_idx on ai_conversations (profile_id, created_at desc);
create trigger ai_conv_updated before update on ai_conversations for each row execute function set_updated_at();

create table ai_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references ai_conversations (id) on delete cascade,
  role             text not null check (role in ('user', 'assistant', 'tool', 'system')),
  content          text not null,
  tool_calls       jsonb,
  input_tokens     int,
  output_tokens    int,
  created_at       timestamptz not null default now()
);
create index ai_messages_conv_idx on ai_messages (conversation_id, created_at);

create table support_requests (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid references profiles (id) on delete set null,
  name             text not null,
  phone            text check (phone ~ '^\+255[0-9]{9}$'),
  email            citext,
  subject          text not null,
  message          text not null,
  status           support_status not null default 'open',
  order_id         uuid references orders (id) on delete set null,
  conversation_id  uuid references ai_conversations (id) on delete set null,
  assigned_to      uuid references profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index support_status_idx on support_requests (status, created_at desc);
create trigger support_updated before update on support_requests for each row execute function set_updated_at();

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_profile_idx on notifications (profile_id, created_at desc);

create table audit_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid,
  actor_role   text,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  before_data  jsonb,
  after_data   jsonb,
  ip           inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);
create index audit_entity_idx on audit_logs (entity_type, entity_id);
create index audit_actor_idx on audit_logs (actor_id, created_at desc);
create trigger audit_logs_immutable before update or delete on audit_logs
  for each row execute function forbid_change();

-- Non-secret integration state. API keys and secrets live in environment variables only.
create table integration_settings (
  key            text primary key,
  category       text not null,
  provider       text not null,
  status         integration_status not null default 'awaiting_credentials',
  config         jsonb not null default '{}'::jsonb,
  status_note    text,
  last_tested_at timestamptz,
  updated_by     uuid references profiles (id),
  updated_at     timestamptz not null default now()
);
create trigger integration_updated before update on integration_settings for each row execute function set_updated_at();
