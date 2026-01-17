-- Add foreign key constraint to allow joining stores with plans
DO $$ 
BEGIN
    -- Check if the constraint already exists to avoid errors
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_plan_id_fkey' 
        AND table_name = 'stores'
    ) THEN
        ALTER TABLE stores
        ADD CONSTRAINT stores_plan_id_fkey
        FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
