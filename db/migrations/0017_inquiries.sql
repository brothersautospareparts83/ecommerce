-- 0017: contact-page inquiries. Visitors have no table rights; they call submit_inquiry(), which validates and inserts.
-- Staff read and update them from the admin panel (RLS: staff_all). Customers can never read inquiries back.

create type inquiry_status as enum ('new', 'handled');

create table inquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 2 and 120),
  phone      text not null check (phone ~ '^\+255[0-9]{9}$'),
  email      text check (email is null or char_length(email) <= 160),
  message    text not null check (char_length(trim(message)) between 5 and 1000),
  status     inquiry_status not null default 'new',
  profile_id uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index inquiries_status_idx on inquiries (status, created_at desc);

alter table inquiries enable row level security;
create policy staff_all on inquiries for all to app_staff using (true) with check (true);
grant select, update on inquiries to app_staff;

create function submit_inquiry(p_name text, p_phone text, p_email text, p_message text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'NAME REQUIRED'; end if;
  if p_phone !~ '^\+255[0-9]{9}$' then raise exception 'INVALID PHONE'; end if;
  if char_length(coalesce(trim(p_message), '')) < 5 then raise exception 'MESSAGE REQUIRED'; end if;
  insert into inquiries (name, phone, email, message, profile_id)
  values (trim(p_name), p_phone, nullif(trim(p_email), ''), trim(p_message), nullif(app_user_id()::text, '')::uuid)
  returning id into v_id;
  return v_id;
end $$;

revoke all on function submit_inquiry(text, text, text, text) from public;
grant execute on function submit_inquiry(text, text, text, text) to app_customer;
