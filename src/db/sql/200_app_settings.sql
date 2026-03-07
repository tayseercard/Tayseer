create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_value jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS policies
alter table app_settings enable row level security;

-- Everyone can read
create policy "Anyone can read app_settings" on app_settings
  for select using (true);

-- Only admins can update/insert
create policy "Admins can insert app_settings" on app_settings
  for insert with check (
    exists (
      select 1 from me_effective_role
      where user_id = auth.uid() and role = 'superadmin'
    )
  );

create policy "Admins can update app_settings" on app_settings
  for update using (
    exists (
      select 1 from me_effective_role
      where user_id = auth.uid() and role = 'superadmin'
    )
  );
