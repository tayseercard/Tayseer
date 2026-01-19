-- Add paid_at column to stores to track the last payment validation date
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Ensure payment_status is present (redundant if 080 ran)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
