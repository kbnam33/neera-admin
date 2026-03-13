# Simple Migration Checklist - Step by Step

**Date:** Follow this guide to safely migrate your system  
**Time Required:** 5-10 minutes  
**Risk Level:** Low (all steps are reversible)

---

## 📋 Pre-Migration Checklist

### ✅ Step 1: Check Your Current Database State

Open your **Supabase SQL Editor** and run these queries one by one:

#### Query 1.1: Does shipping_policy_id column exist?
```sql
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'fabrics' 
AND column_name = 'shipping_policy_id';
```

**✍️ Write down the result:**
- [ ] **Returns 1 row** → Column exists (proceed to Query 1.2)
- [ ] **Returns 0 rows** → Column doesn't exist (SKIP MIGRATION - you're done!)

---

#### Query 1.2: How many fabrics have a policy assigned?
```sql
SELECT 
    COUNT(*) as total_fabrics,
    COUNT(shipping_policy_id) as fabrics_with_policy,
    COUNT(*) - COUNT(shipping_policy_id) as fabrics_without_policy
FROM fabrics;
```

**✍️ Write down the result:**
- Total fabrics: _______
- Fabrics with policy: _______
- Fabrics without policy: _______

---

#### Query 1.3: Check if fabrics have empty shipping_returns
```sql
SELECT 
    id,
    name,
    shipping_policy_id,
    CASE 
        WHEN shipping_returns IS NULL OR shipping_returns = '' THEN 'EMPTY'
        ELSE 'HAS CONTENT'
    END as shipping_returns_status
FROM fabrics
ORDER BY id;
```

**✍️ Count how many fabrics have:**
- EMPTY shipping_returns: _______
- HAS CONTENT shipping_returns: _______

---

#### Query 1.4: What policies exist?
```sql
SELECT id, name, is_default
FROM shipping_policies
ORDER BY is_default DESC, name;
```

**✍️ List your policies:**
1. _______________
2. _______________
3. _______________

---

## 🎯 Migration Decision Matrix

Based on your results above, find your scenario:

### Scenario A: Column doesn't exist (Query 1.1 returns 0 rows)
**✅ Action:** Skip migration entirely! You're already on the new system.

### Scenario B: All fabrics have content in shipping_returns
**✅ Action:** Simple cleanup (just remove the column)

### Scenario C: Some fabrics have empty shipping_returns
**⚠️ Action:** Copy policy content first, then remove column

### Scenario D: No data yet (0 fabrics)
**✅ Action:** Simple cleanup (just remove the column)

---

## 🔧 Migration Scripts

### 🟢 For Scenario A (Column doesn't exist)
**No migration needed!** Your system is already updated. Start using the new features.

---

### 🟢 For Scenario B & D (Simple cleanup)

Run this in Supabase SQL Editor:

```sql
-- Step 1: Drop the foreign key constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fabrics_shipping_policy_id_fkey' 
        AND table_name = 'fabrics'
    ) THEN
        ALTER TABLE fabrics DROP CONSTRAINT fabrics_shipping_policy_id_fkey;
        RAISE NOTICE '✅ Dropped foreign key constraint';
    ELSE
        RAISE NOTICE 'ℹ️ No foreign key constraint found';
    END IF;
END $$;

-- Step 2: Drop the index
DROP INDEX IF EXISTS idx_fabrics_shipping_policy_id;
RAISE NOTICE '✅ Dropped index (if it existed)';

-- Step 3: Remove the column
ALTER TABLE fabrics DROP COLUMN IF EXISTS shipping_policy_id;
RAISE NOTICE '✅ Removed shipping_policy_id column';

-- Step 4: Verify
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: Column removed successfully!'
        ELSE '❌ ERROR: Column still exists'
    END as migration_status
FROM information_schema.columns 
WHERE table_name = 'fabrics' 
AND column_name = 'shipping_policy_id';
```

**Expected Output:**
```
✅ SUCCESS: Column removed successfully!
```

---

### 🟡 For Scenario C (Copy policy content first)

Run this in Supabase SQL Editor:

```sql
-- Step 1: Copy policy content to fabrics with empty shipping_returns
DO $$
DECLARE
    fabric_record RECORD;
    policy_content TEXT;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting policy content copy...';
    
    FOR fabric_record IN 
        SELECT f.id, f.name, f.shipping_policy_id, f.shipping_returns
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
            
            updated_count := updated_count + 1;
            RAISE NOTICE '  ✅ Updated fabric "%" (ID: %)', fabric_record.name, fabric_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary: Updated % fabric(s)', updated_count;
END $$;

-- Step 2: Verify the copy worked
SELECT 
    COUNT(*) as fabrics_still_empty
FROM fabrics
WHERE shipping_policy_id IS NOT NULL 
  AND (shipping_returns IS NULL OR shipping_returns = '');
```

**Expected Output:**
```
Updated fabric "Silk" (ID: 1)
Updated fabric "Cotton" (ID: 2)
...
📊 Summary: Updated X fabric(s)

fabrics_still_empty: 0
```

**If fabrics_still_empty = 0**, proceed to run the cleanup script from Scenario B above.

---

## ✅ Post-Migration Verification

Run these queries to verify everything worked:

### Verification 1: Column is removed
```sql
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'fabrics' 
AND column_name = 'shipping_policy_id';
```
**Expected:** 0 rows

---

### Verification 2: All fabrics have shipping_returns content
```sql
SELECT 
    COUNT(*) as total_fabrics,
    SUM(CASE WHEN shipping_returns IS NULL OR shipping_returns = '' THEN 1 ELSE 0 END) as empty_count,
    SUM(CASE WHEN shipping_returns IS NOT NULL AND shipping_returns != '' THEN 1 ELSE 0 END) as with_content
FROM fabrics;
```
**Expected:** empty_count = 0 (or acceptable number)

---

### Verification 3: Policies still exist
```sql
SELECT COUNT(*) as policy_count
FROM shipping_policies;
```
**Expected:** Same number as before

---

### Verification 4: Products are unaffected
```sql
SELECT COUNT(*) as product_count
FROM products;
```
**Expected:** Same number as before

---

## 🔄 Rollback (If Something Goes Wrong)

If you need to undo the migration:

```sql
-- Re-add the column
ALTER TABLE fabrics 
ADD COLUMN shipping_policy_id BIGINT;

-- Re-add the foreign key
ALTER TABLE fabrics 
ADD CONSTRAINT fabrics_shipping_policy_id_fkey 
FOREIGN KEY (shipping_policy_id) 
REFERENCES shipping_policies(id) 
ON DELETE SET NULL;

-- Re-add the index
CREATE INDEX idx_fabrics_shipping_policy_id 
ON fabrics(shipping_policy_id);
```

---

## 📞 Support Checklist

If you encounter issues, provide:
- [ ] Results from Query 1.1, 1.2, 1.3, 1.4
- [ ] Your scenario (A, B, C, or D)
- [ ] Error message (if any)
- [ ] What step you were on

---

## 🎉 Success Indicators

You're done when:
- ✅ Query 1.1 returns 0 rows (column removed)
- ✅ All fabrics have content in shipping_returns
- ✅ Policies still exist in shipping_policies table
- ✅ New Policies page features work (can expand policies, see fabrics)

**Next Step:** Go to your admin panel → Policies page → Expand a policy to see the new features!
