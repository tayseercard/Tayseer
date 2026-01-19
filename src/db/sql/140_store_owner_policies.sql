-- Allow store owners to see their own store
CREATE POLICY "Store owners can view their own store"
ON public.stores
FOR SELECT
TO authenticated
USING (
  owner_user_id = auth.uid()
);

-- Allow store owners to update their own store
CREATE POLICY "Store owners can update their own store"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  owner_user_id = auth.uid()
)
WITH CHECK (
  owner_user_id = auth.uid()
);
