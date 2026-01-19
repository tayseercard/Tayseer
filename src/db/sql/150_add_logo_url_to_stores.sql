-- Add logo_url column to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS logo_url text;
