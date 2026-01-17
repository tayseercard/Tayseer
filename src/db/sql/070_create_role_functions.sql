-- Function to sync effective role to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_effective_role_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'store_id', NEW.store_id,
      'store_name', NEW.store_name
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$;

-- Function to update auth metadata when role changes
CREATE OR REPLACE FUNCTION public.update_auth_metadata_on_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only update if relevant fields changed
  IF (TG_OP = 'INSERT') OR
     (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.store_id IS DISTINCT FROM NEW.store_id) THEN
     
      UPDATE auth.users
      SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'role', NEW.role,
          'store_id', NEW.store_id,
          'store_name', NEW.store_name
        )
      WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;
