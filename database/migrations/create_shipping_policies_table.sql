-- Create shipping_policies table
CREATE TABLE IF NOT EXISTS shipping_policies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipping_policies_is_default ON shipping_policies(is_default);

-- Add shipping_policy_id column to fabrics table (if not exists)
ALTER TABLE fabrics
ADD COLUMN IF NOT EXISTS shipping_policy_id BIGINT REFERENCES shipping_policies(id) ON DELETE SET NULL;

-- Create index for fabric policy lookups
CREATE INDEX IF NOT EXISTS idx_fabrics_shipping_policy_id ON fabrics(shipping_policy_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shipping_policies
DROP TRIGGER IF EXISTS update_shipping_policies_updated_at ON shipping_policies;
CREATE TRIGGER update_shipping_policies_updated_at
    BEFORE UPDATE ON shipping_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a default policy (optional - you can customize this)
INSERT INTO shipping_policies (name, content, is_default)
VALUES (
    'Standard Shipping & Returns',
    E'Shipping:\n• Free shipping on orders above ₹5000\n• Standard delivery: 5-7 business days\n• Express delivery available at checkout\n\nReturns:\n• 30-day return policy\n• Products must be unused and in original packaging\n• Contact us for return authorization',
    true
)
ON CONFLICT DO NOTHING;

-- IMPORTANT: If you already have fabrics without a policy, they will use the manual text in shipping_returns field
-- The application will automatically use the policy content if shipping_policy_id is set, otherwise it falls back to shipping_returns text
