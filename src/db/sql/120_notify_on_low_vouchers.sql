-- Trigger to notify store owner when vouchers are low
CREATE OR REPLACE FUNCTION public.notify_store_on_low_vouchers()
RETURNS TRIGGER AS $$
DECLARE
    v_blank_count INTEGER;
    v_owner_id UUID;
    v_store_name TEXT;
BEGIN
    -- Only trigger if the status changed FROM 'blank' TO something else (activation)
    IF OLD.status = 'blank' AND NEW.status != 'blank' THEN
        
        -- Get remaining blank count
        SELECT COUNT(*) INTO v_blank_count
        FROM public.vouchers
        WHERE store_id = NEW.store_id AND status = 'blank';

        -- If exactly 5 left, notify the owner
        IF v_blank_count = 5 THEN
            -- Get owner ID and store name
            SELECT owner_user_id, name INTO v_owner_id, v_store_name
            FROM public.stores
            WHERE id = NEW.store_id;

            IF v_owner_id IS NOT NULL THEN
                INSERT INTO public.notifications (user_id, title, message, link, read)
                VALUES (
                    v_owner_id,
                    'Stock de QR Codes Faible',
                    'Il ne vous reste que 5 QR codes disponibles pour "' || v_store_name || '". Pensez à renouveler votre achat.',
                    '/store/settings',
                    false
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notify_store_on_low_vouchers ON public.vouchers;
CREATE TRIGGER trg_notify_store_on_low_vouchers
AFTER UPDATE ON public.vouchers
FOR EACH ROW
EXECUTE FUNCTION public.notify_store_on_low_vouchers();
