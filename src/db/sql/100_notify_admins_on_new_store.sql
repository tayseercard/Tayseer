-- Trigger to notify superadmins when a new store signs up
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_store()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Loop through all superadmins
    FOR admin_record IN (SELECT user_id FROM public.me_effective_role WHERE role = 'superadmin') LOOP
        INSERT INTO public.notifications (user_id, title, message, link, read)
        VALUES (
            admin_record.user_id,
            'Nouvelle Boutique Inscrite',
            'La boutique "' || NEW.name || '" vient de s''inscrire.',
            '/admin/stores/' || NEW.id,
            false
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notify_admins_on_new_store ON public.stores;
CREATE TRIGGER trg_notify_admins_on_new_store
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_store();
