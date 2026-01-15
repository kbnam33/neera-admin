-- Migration: Remove shipping_policy_id from fabrics table
-- This migration removes the relational link between fabrics and shipping_policies
-- Policies are now used as templates only, with content copied directly to fabric's shipping_returns field

-- Step 1: Before removing the column, optionally copy policy content to fabrics that don't have manual text
-- (This is a safety measure - you can skip this if you've already applied policies to fabrics)
DO $$
DECLARE
    fabric_record RECORD;
    policy_content TEXT;
BEGIN
    FOR fabric_record IN 
        SELECT f.id, f.shipping_policy_id, f.shipping_returns
        FROM fabrics f
        WHERE f.shipping_policy_id IS NOT NULL 
          AND (f.shipping_returns IS NULL OR f.shipping_returns = '')
    LOOP
        -- Get policy content
        SELECT content INTO policy_content
        FROM shipping_policies
        WHERE id = fabric_record.shipping_policy_id;
        
        -- Update fabric with policy content
        IF policy_content IS NOT NULL THEN
            UPDATE fabrics
            SET shipping_returns = policy_content
            WHERE id = fabric_record.id;
            
            RAISE NOTICE 'Updated fabric % with policy content', fabric_record.id;
        END IF;
    END LOOP;
END $$;

-- Step 2: Drop the foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fabrics_shipping_policy_id_fkey' 
        AND table_name = 'fabrics'
    ) THEN
        ALTER TABLE fabrics DROP CONSTRAINT fabrics_shipping_policy_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint fabrics_shipping_policy_id_fkey';
    END IF;
END $$;

-- Step 3: Drop the index on shipping_policy_id if it exists
DROP INDEX IF EXISTS idx_fabrics_shipping_policy_id;

-- Step 4: Remove the shipping_policy_id column
ALTER TABLE fabrics DROP COLUMN IF EXISTS shipping_policy_id;

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'The shipping_policy_id column has been removed from the fabrics table.';
    RAISE NOTICE 'Policies are now used as templates only - their content is copied to fabric shipping_returns field.';
END $$;
