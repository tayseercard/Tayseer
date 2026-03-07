-- Ensure vouchers are deleted when a store is deleted (ON DELETE CASCADE)
DO $$ 
BEGIN
    -- Drop existing constraint if it exists (regardless of name, but usually it's vouchers_store_id_fkey)
    -- We'll look up the constraint name for public.vouchers on store_id
    EXECUTE (
        SELECT 'ALTER TABLE public.vouchers DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.key_column_usage
        WHERE table_name = 'vouchers' 
        AND column_name = 'store_id'
        AND table_schema = 'public'
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if no constraint found
END $$;

-- Add the cascading constraint
ALTER TABLE public.vouchers
ADD CONSTRAINT vouchers_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.stores(id)
ON DELETE CASCADE;
