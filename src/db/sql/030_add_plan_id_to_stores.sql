-- Migration to add plan_id to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS plan_id text DEFAULT 'starter';

COMMENT ON COLUMN stores.plan_id IS 'The pricing plan identifier (e.g., starter, popular, enterprise)';
