
-- 180_add_security_pin.sql
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS security_pin text;
-- We might want to hash it, but for simple MVP a text pin (4-6 digits) is usually okay 
-- if we rely on Row Level Security and app logic, 
-- but hashing is better. Given the request: "he put the security pin code first",
-- it implies users need to know it. 
-- The store sets it ("quand le store rempli le voucher").

-- We will store it as simple text for now to keep things simple for the "display" logic if needed,
-- or better, hash it. But let's assume raw text 4-digit code for simplicity of validation 
-- in the "check" phase without complex auth flow.
