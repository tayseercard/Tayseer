-- Allow Admins and Superadmins to manage plans (Insert, Update, Delete)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' 
        AND policyname = 'Admins can manage plans'
    ) THEN
        CREATE POLICY "Admins can manage plans" 
        ON plans 
        FOR ALL 
        TO authenticated
        USING (
            (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
        )
        WITH CHECK (
            (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
        );
    END IF;
END $$;
