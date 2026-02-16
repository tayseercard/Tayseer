-- Add activated_by column to vouchers table to track which cashier activated each voucher
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS activated_by uuid REFERENCES auth.users(id);
