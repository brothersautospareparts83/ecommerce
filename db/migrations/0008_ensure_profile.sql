-- 0008: first-login profile provisioning for Neon Auth users.
-- Called by trusted server code only, with values taken from the verified auth session.
-- SECURITY DEFINER because customers have no INSERT privilege on profiles/customers.
-- It can only ever create or link a 'customer' profile; roles are never set here.

create function ensure_profile(p_auth_user_id text, p_email text, p_full_name text)
returns profiles
language plpgsql security definer set search_path = public as $$
declare
  result profiles;
begin
  if coalesce(p_auth_user_id, '') = '' then
    raise exception 'auth user id required';
  end if;

  select * into result from profiles where auth_user_id = p_auth_user_id;

  if not found and p_email is not null then
    -- Link a profile an admin pre-created for this email (e.g. a garage account).
    update profiles set auth_user_id = p_auth_user_id
      where email = p_email::citext and auth_user_id is null
      returning * into result;
  end if;

  if result.id is null then
    insert into profiles (auth_user_id, email, full_name, role)
      values (p_auth_user_id, p_email::citext, nullif(trim(p_full_name), ''), 'customer')
      returning * into result;
  end if;

  insert into customers (profile_id) values (result.id) on conflict (profile_id) do nothing;
  return result;
end $$;

revoke all on function ensure_profile(text, text, text) from public;
grant execute on function ensure_profile(text, text, text) to app_customer, app_staff;
