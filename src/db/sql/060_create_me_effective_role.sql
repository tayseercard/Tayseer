-- Create user_role_store type if it doesn't exist (assuming it might be missing based on context)
DO $$ BEGIN
    CREATE TYPE public.user_role_store AS ENUM ('store_owner', 'store_admin', 'cashier', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists public.me_effective_role (
  user_id uuid not null,
  role public.user_role_store not null,
  store_id uuid null,
  store_name text null,
  created_at timestamp with time zone null default now(),
  id uuid not null default gen_random_uuid (),
  constraint me_effective_role_pkey primary key (id),
  constraint me_effective_role_user_store_unique unique (user_id, store_id),
  constraint me_effective_role_user_unique unique (user_id),
  constraint me_effective_role_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint me_effective_role_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create triggers
create or replace trigger on_role_change_sync_metadata
after INSERT
or
update on me_effective_role for EACH row
execute FUNCTION update_auth_metadata_on_role_change ();

create or replace trigger trg_sync_effective_role_to_auth
after INSERT
or
update on me_effective_role for EACH row
execute FUNCTION sync_effective_role_to_auth ();
