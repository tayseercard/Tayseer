-- 1. Create or Update table voucher_requests
CREATE TABLE IF NOT EXISTS public.voucher_requests (
  id uuid not null default gen_random_uuid (),
  store_id uuid null,
  store_name text null,
  count integer not null,
  status text not null default 'pending'::text,
  created_at timestamp without time zone null default now(),
  approved_at timestamp without time zone null,
  admin_id uuid null,
  processed_by uuid null,
  processed_at timestamp with time zone null,
  constraint voucher_requests_pkey primary key (id),
  constraint voucher_requests_admin_id_fkey foreign KEY (admin_id) references auth.users (id),
  constraint voucher_requests_processed_by_fkey foreign KEY (processed_by) references auth.users (id),
  constraint voucher_requests_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint voucher_requests_count_check check ((count > 0))
) TABLESPACE pg_default;

-- 2. Function to notify admins on new request
CREATE OR REPLACE FUNCTION notify_admin_on_voucher_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link, created_at, read)
  SELECT 
    user_id,
    'Nouvelle Commande de Pack',
    COALESCE(NEW.store_name, 'Un magasin') || ' a commandé ' || NEW.count || ' QRs (' || NEW.status || ').',
    'voucher_request',
    '/admin/stores',
    NOW(),
    false
  FROM me_effective_role
  WHERE role IN ('admin', 'superadmin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to notify store on status update
CREATE OR REPLACE FUNCTION notify_store_on_request_update()
RETURNS TRIGGER AS $$
DECLARE
  owner_id uuid;
BEGIN
  -- Attempt to find the store owner via me_effective_role
  SELECT user_id INTO owner_id FROM me_effective_role WHERE store_id = NEW.store_id LIMIT 1;
  
  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read, created_at)
    VALUES (
      owner_id,
      'Mise à jour de commande',
      'Votre demande de ' || NEW.count || ' QRs est maintenant : ' || NEW.status,
      'voucher_request_status',
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Triggers
DROP TRIGGER IF EXISTS trg_notify_admin_voucher_request ON voucher_requests;
CREATE TRIGGER trg_notify_admin_voucher_request
AFTER INSERT ON voucher_requests
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_voucher_request();

DROP TRIGGER IF EXISTS trg_notify_store_voucher_update ON voucher_requests;
CREATE TRIGGER trg_notify_store_voucher_update
AFTER UPDATE ON voucher_requests
FOR EACH ROW
WHEN (OLD.status <> NEW.status)
EXECUTE FUNCTION notify_store_on_request_update();
