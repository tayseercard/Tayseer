-- RPC function to check if email exists (safe for use with service role)
-- Can be called via supabase.rpc('check_email_exists', { email_arg: '...' })
-- WARNING: exposing this publicly allows email enumeration. Ensure middleware/API route protects it or use ONLY with service role.

create or replace function check_email_exists(email_arg text)
returns boolean
security definer
language plpgsql
as $$
begin
  return exists (
    select 1 
    from auth.users 
    where email = email_arg
  );
end;
$$;

-- Grant execute to anon/authenticated if we want public access (NOT RECOMMENDED for privacy usually)
-- But since we use Service Role in the API route, we don't strictly need to grant to anon/authenticated 
-- unless we changed the API implementation to use public access.
-- However, creating it makes it available to Service Role.

GRANT EXECUTE ON FUNCTION check_email_exists(text) TO service_role;
