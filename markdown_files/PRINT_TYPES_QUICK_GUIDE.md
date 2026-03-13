# Print Types - Quick Setup & Testing Guide

## 🚀 Quick Start

### 1. Verify Database Setup
The `prints` table should already exist with these columns:
- `id` (integer, primary key)
- `name` (text, unique, not null)
- `slug` (text, unique, not null)
- `created_at` (timestamp)

And `products` table should have:
- `print_id` (integer, FK to prints.id)
- `print_type` (text, legacy)

### 2. Start the Admin Tool
```bash
npm run dev
```

### 3. Test the Feature

#### Access Print Management
1. Open admin tool in browser
2. Look for **"Print Types"** in the left sidebar (with Palette icon)
3. Click to view all print types

#### Create a Test Print Type
1. Click **"Add Print Type"** button
2. Enter name: `Test Print`
3. Verify slug shows: `test-print`
4. Click **"Save Print Type"**
5. Confirm it appears in the list

#### Test Product Integration
1. Go to **Products** → **Create**
2. Fill in required fields
3. Find **"Print Type"** dropdown (below Fabric field)
4. Select a print type from dropdown
5. Save product
6. Verify both `print_id` and `print_type` are set in database

#### Test Delete Protection
1. Go to **Print Types**
2. Try to delete a print type that has products
3. Should see error: "Cannot delete: X products use this print type"
4. Delete test print type (should work since no products use it)

---

## ✅ Testing Checklist

### Print Management
- [ ] Can access `/prints` page
- [ ] List shows all print types
- [ ] Product counts are accurate
- [ ] Can create new print type
- [ ] Slug auto-generates correctly
- [ ] Can edit print type name
- [ ] Cannot delete print with products
- [ ] Can delete unused print type

### Product Forms
- [ ] Create form has print dropdown
- [ ] Dropdown shows all print types
- [ ] Print field is required
- [ ] Edit form pre-selects current print
- [ ] Can change print type on edit

### Data Integrity
- [ ] New products have both `print_id` and `print_type`
- [ ] Updated products sync both fields
- [ ] Editing print name updates products

---

## 🔍 Verification SQL Queries

### Check Print Types
```sql
SELECT * FROM prints ORDER BY name;
```

### Check Product-Print Relationships
```sql
SELECT 
  p.id,
  p.name,
  p.print_id,
  p.print_type,
  pr.name as print_name
FROM products p
LEFT JOIN prints pr ON p.print_id = pr.id
ORDER BY p.id DESC
LIMIT 10;
```

### Verify Sync (Should Return 0 Rows)
```sql
SELECT 
  p.id,
  p.name,
  p.print_type,
  pr.name as print_name
FROM products p
LEFT JOIN prints pr ON p.print_id = pr.id
WHERE p.print_type != pr.name
  AND p.print_id IS NOT NULL;
```

### Count Products by Print
```sql
SELECT 
  pr.id,
  pr.name,
  COUNT(p.id) as product_count
FROM prints pr
LEFT JOIN products p ON p.print_id = pr.id
GROUP BY pr.id, pr.name
ORDER BY product_count DESC;
```

---

## 🐛 Troubleshooting

### Print dropdown is empty
**Check**: Ensure `prints` table has data
```sql
SELECT COUNT(*) FROM prints;
```

### Products not showing print_id
**Check**: New products after implementation
**Action**: Edit old products and re-save to populate `print_id`

### Cannot delete print type
**Expected**: Print types with products cannot be deleted
**Action**: Reassign products to different print or delete products first

### Slug not generating
**Check**: Make sure name field has valid characters
**Note**: Special characters are automatically removed

---

## 📊 Expected Initial Data

If migration was run, you should see these print types:

| ID | Name        | Slug        |
|----|-------------|-------------|
| 1  | Solid       | solid       |
| 2  | Printed     | printed     |
| 3  | Traditional | traditional |
| 4  | Floral      | floral      |
| 5  | Striped     | striped     |
| 6  | Dotted      | dotted      |

---

## 🔄 Common Operations

### Add New Print Type
1. Navigate to Print Types
2. Click "Add Print Type"
3. Enter name (e.g., "Geometric")
4. Save

### Update Print Type Name
1. Navigate to Print Types
2. Click on print type to edit
3. Update name
4. Save (automatically updates all products)

### Assign Print to Product
1. Create or edit product
2. Select print from dropdown
3. Save

### Change Product's Print Type
1. Edit product
2. Change print in dropdown
3. Save (both fields sync automatically)

---

## ⚠️ Important Notes

1. **Do NOT delete the `print_type` column yet**
   - React frontend still uses it
   - Both fields must stay synced
   - Remove only after React app is updated (Phase 2)

2. **Always use the dropdown** in product forms
   - Don't manually edit print_type field
   - Dropdown ensures proper sync

3. **Check product count** before deleting print types
   - System prevents deletion if products exist
   - Reassign products first if needed

4. **Slug changes affect URLs** on frontend
   - URL pattern: `/prints/{slug}`
   - Test frontend after changing slugs

---

## 📞 Need Help?

### If something doesn't work:

1. **Check browser console** for JavaScript errors
2. **Check database** for missing data
3. **Verify foreign key constraint** exists:
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE table_name = 'products' 
   AND constraint_type = 'FOREIGN KEY';
   ```
4. **Run data integrity query** (see above)

### Known Limitations:

- Old products may have NULL `print_id` (expected)
- Edit and re-save those products to populate
- Or run backfill migration if available

---

## ✨ Success Criteria

You'll know everything is working when:

✅ Print Types page loads with list of prints
✅ Product count badges show correct numbers
✅ Creating products saves both print_id and print_type
✅ Editing products updates both fields
✅ Cannot delete prints with associated products
✅ New print types immediately appear in product dropdowns
✅ Editing print name updates all product records

---

## 📝 Quick Reference

### Routes
- List: `/prints`
- Create: `/prints/create`
- Edit: `/prints/edit/:id`

### Database Tables
- Master: `prints`
- Foreign Key: `products.print_id → prints.id`
- Legacy: `products.print_type` (synced)

### Files Modified
- ✨ NEW: `src/pages/prints/list.jsx`
- ✨ NEW: `src/pages/prints/create.jsx`
- ✨ NEW: `src/pages/prints/edit.jsx`
- ✅ UPDATED: `src/pages/products/create.jsx`
- ✅ UPDATED: `src/pages/products/edit.jsx`
- ✅ UPDATED: `src/App.jsx`

---

That's it! You now have centralized print type management with full data integrity. 🎉
