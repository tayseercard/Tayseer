-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role'),
    'anon'
  )::text
$$;

-- Add payment_status to stores if not exists
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  plan_id text REFERENCES plans (id),
  payment_method text DEFAULT 'cash',
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage payments
CREATE POLICY "Admins can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (
  public.current_user_role() = 'admin' OR 
  public.current_user_role() = 'superadmin'
);
