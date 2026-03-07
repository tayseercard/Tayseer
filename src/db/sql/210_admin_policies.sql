-- Allow 'admin' and 'superadmin' to view and manipulate stores
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can view all stores" ON public.stores;
    CREATE POLICY "Admins can view all stores" 
    ON public.stores 
    FOR SELECT 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

    DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
    CREATE POLICY "Admins can delete stores" 
    ON public.stores 
    FOR DELETE 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );
END $$;

-- Allow 'admin' and 'superadmin' to view and manipulate vouchers
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can view all vouchers" ON public.vouchers;
    CREATE POLICY "Admins can view all vouchers" 
    ON public.vouchers 
    FOR SELECT 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

    DROP POLICY IF EXISTS "Admins can update vouchers" ON public.vouchers;
    CREATE POLICY "Admins can update vouchers" 
    ON public.vouchers 
    FOR UPDATE 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

    DROP POLICY IF EXISTS "Admins can delete vouchers" ON public.vouchers;
    CREATE POLICY "Admins can delete vouchers" 
    ON public.vouchers 
    FOR DELETE 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );
END $$;

-- Allow 'admin' and 'superadmin' to view voucher requests
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can view all voucher requests" ON public.voucher_requests;
    CREATE POLICY "Admins can view all voucher requests" 
    ON public.voucher_requests 
    FOR SELECT 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );

    DROP POLICY IF EXISTS "Admins can manage voucher requests" ON public.voucher_requests;
    CREATE POLICY "Admins can manage voucher requests" 
    ON public.voucher_requests 
    FOR ALL 
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
    );
END $$;
