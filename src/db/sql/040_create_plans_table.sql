-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id text PRIMARY KEY,
    name text NOT NULL,
    quantity integer NOT NULL,
    price_per_unit integer NOT NULL,
    total_price integer NOT NULL,
    features jsonb DEFAULT '[]'::jsonb,
    is_popular boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (id, name, quantity, price_per_unit, total_price, features, is_popular)
VALUES 
    ('starter', 'Pack Starter', 100, 50, 5000, '["Idéal pour démarrer", "Support par email", "Validité illimitée"]'::jsonb, false),
    ('popular', 'Pack Populaire', 500, 40, 20000, '["Le plus populaire", "Support prioritaire", "Validité illimitée", "Badge commerçant vérifié"]'::jsonb, true),
    ('enterprise', 'Pack Enterprise', 1000, 35, 35000, '["Pour les grands volumes", "Support dédié 24/7", "Validité illimitée", "Personnalisation avancée"]'::jsonb, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    quantity = EXCLUDED.quantity,
    price_per_unit = EXCLUDED.price_per_unit,
    total_price = EXCLUDED.total_price,
    features = EXCLUDED.features,
    is_popular = EXCLUDED.is_popular;

-- Add foreign key constraint to stores table (if it exists and has plan_id)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'plan_id') THEN
        ALTER TABLE stores 
        DROP CONSTRAINT IF EXISTS fk_stores_plan;
        
        ALTER TABLE stores
        ADD CONSTRAINT fk_stores_plan
        FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON UPDATE CASCADE;
    END IF;
END $$;
