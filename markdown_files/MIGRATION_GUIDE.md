# Migration Guide: Shipping & Returns Policy Refactoring

## Overview

This migration changes how shipping & returns policies work in the system:

**Before:**
- Fabrics had a `shipping_policy_id` foreign key linking to the `shipping_policies` table
- Products inherited policies through this relational link
- Complex indirection through multiple tables

**After:**
- Policies exist as **templates only** in the `shipping_policies` table
- Policy content is **copied directly** into `fabrics.shipping_returns` field
- Products inherit from `fabrics.shipping_returns` (just like Description and Care Instructions)
- Fabrics can bulk-apply their shipping_returns to products

## Benefits

✅ **Simpler data model** - Direct text storage, no foreign key indirection  
✅ **Consistent workflow** - Same pattern as Description and Care Instructions  
✅ **More control** - Fabric-level bulk apply to products  
✅ **Easier to understand** - Policy templates are just a convenience, not a requirement  
✅ **Better flexibility** - Can customize at fabric level without affecting other fabrics

## Migration Steps

### Step 1: Backup Your Data

Before running any migration, create a backup of your database:

```bash
# If using Supabase, use their backup feature
# Or use pg_dump if you have direct database access
pg_dump -U your_username -d your_database > backup_before_policy_migration.sql
```

### Step 2: Run the Migration

The migration will:
1. Copy policy content to fabrics that reference a policy but have empty `shipping_returns`
2. Remove the foreign key constraint
3. Drop the index
4. Remove the `shipping_policy_id` column

**Option A: Using Supabase SQL Editor**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/migrations/remove_shipping_policy_id_from_fabrics.sql`
4. Click "Run"

**Option B: Using psql**
```bash
psql -U your_username -d your_database -f database/migrations/remove_shipping_policy_id_from_fabrics.sql
```

### Step 3: Verify the Migration

After running the migration, verify:

```sql
-- Check that the column is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'fabrics' AND column_name = 'shipping_policy_id';
-- Should return 0 rows

-- Check that fabrics have shipping_returns content
SELECT id, name, 
       CASE 
         WHEN shipping_returns IS NULL OR shipping_returns = '' THEN 'EMPTY'
         ELSE 'HAS CONTENT'
       END as status
FROM fabrics;
```

### Step 4: Update Existing Fabrics (if needed)

If some fabrics still have empty `shipping_returns` after migration:

1. Go to **Policies** page in the admin panel
2. View the policy templates
3. Go to **Fabrics** page
4. Edit each fabric
5. Click "Copy from Policy Template" to select a policy
6. The policy content will be copied into the shipping_returns field
7. Save the fabric

### Step 5: Test the New Workflow

1. **Create a new fabric:**
   - The default policy content is auto-applied to `shipping_returns`
   - You can customize it or use "Copy from Policy Template" to change it

2. **Edit an existing fabric:**
   - Use "Copy from Policy Template" to apply a policy
   - Use "Apply to Products" to bulk-update products of this fabric
   - Or "Apply to All Products" to update all products

3. **Create a new product:**
   - Select a fabric
   - The fabric's `shipping_returns` content is auto-applied
   - You can override it manually if needed

4. **Edit policies:**
   - Policies are now just templates
   - Changing a policy does NOT automatically update fabrics or products
   - Use the "Apply to Products" button in the Policies page to bulk-apply

## New Features

### Fabric Edit Page

**"Copy from Policy Template" button:**
- Opens a dialog with all available policy templates
- Selecting a policy copies its content to the `shipping_returns` field
- You can then customize the text before saving

**"Apply to Products" button:**
- Opens a menu with two options:
  1. **Apply to Products of This Fabric** - Updates only products with this fabric type
  2. **Apply to All Products** - Updates every product in the database

### Fabric Create Page

**Auto-apply default policy:**
- When creating a new fabric, the default policy content is automatically copied to `shipping_returns`
- You can customize it or use "Copy from Policy Template" to change it

### Policies Page

**"Apply to Products" button on each policy card:**
- **Apply to Fabrics Using This Policy** - (This option is now less relevant since fabrics don't link to policies)
- **Apply to All Products** - Updates every product with this policy's content

## Rollback (if needed)

If you need to rollback this migration:

1. Restore from your backup
2. Or manually re-add the column:

```sql
-- Re-add the column
ALTER TABLE fabrics ADD COLUMN shipping_policy_id BIGINT;

-- Re-add the foreign key
ALTER TABLE fabrics 
ADD CONSTRAINT fabrics_shipping_policy_id_fkey 
FOREIGN KEY (shipping_policy_id) 
REFERENCES shipping_policies(id) 
ON DELETE SET NULL;

-- Re-add the index
CREATE INDEX idx_fabrics_shipping_policy_id ON fabrics(shipping_policy_id);
```

3. Revert the code changes by checking out the previous commit

## Troubleshooting

**Q: Some fabrics have empty shipping_returns after migration?**  
A: The migration only copies policy content for fabrics that had a `shipping_policy_id` set. Manually edit those fabrics and use "Copy from Policy Template" or enter text directly.

**Q: Products still have old policy text?**  
A: The migration doesn't update products. Use the "Apply to Products" button in the fabric edit page to bulk-update products.

**Q: Can I still use the Policies page?**  
A: Yes! Policies are still useful as templates. Create, edit, and manage policies as before. Use them as a starting point when creating/editing fabrics.

**Q: What happens to the default policy?**  
A: The default policy is still used - when creating a new fabric, its content is auto-copied to the `shipping_returns` field.

## Support

If you encounter any issues during migration, please:
1. Check the Supabase logs for error messages
2. Verify your database backup is accessible
3. Review the migration SQL file for any errors
4. Contact support with the error details
