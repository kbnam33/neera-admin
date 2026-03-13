-- Add product visibility flag for website availability control
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Ensure existing records are public unless explicitly set otherwise
UPDATE products
SET is_public = true
WHERE is_public IS NULL;

-- Index for website/admin filtering by visibility
CREATE INDEX IF NOT EXISTS idx_products_is_public ON products(is_public);