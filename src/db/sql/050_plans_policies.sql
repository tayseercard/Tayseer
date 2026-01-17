-- Enable RLS on plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plans
CREATE POLICY "Public plans read access"
ON plans FOR SELECT
TO anon, authenticated
USING (true);
