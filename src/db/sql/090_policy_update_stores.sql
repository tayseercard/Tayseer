-- Allow Admins and Superadmins to update stores
DO $$ 
BEGIN
    -- First drop the old policy if it exists to replace it
    DROP POLICY IF EXISTS "Superadmins can update stores" ON stores;
    DROP POLICY IF EXISTS "Admins can update stores" ON stores;

    -- Create new policy covering both 'admin' and 'superadmin' roles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stores' 
        AND policyname = 'Admins can update stores'
    ) THEN
        CREATE POLICY "Admins can update stores" 
        ON stores 
        FOR UPDATE 
        USING (
            (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
        );
    END IF;
END $$;
