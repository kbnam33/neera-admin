# Enhanced Policy Management Features

## Overview

The Policies management page has been significantly enhanced to provide better visibility and control over how policies are used across fabrics and products.

## New Features

### 1. **Fabric Association View** 📊

Each policy card now includes an expandable accordion that shows:
- Which fabrics are currently using this policy (by matching content)
- Product sync status for each fabric
- Selection checkboxes for bulk operations

**How it works:**
- Click "View Fabrics Using This Policy" on any policy card
- The system finds all fabrics whose `shipping_returns` content exactly matches the policy
- For each fabric, it calculates how many products are in sync

### 2. **Product Sync Status** ✅

For each fabric associated with a policy, you can see:

**Visual Indicators:**
- 🟢 **Green Check** - All products match (100% sync)
- 🟡 **Yellow Warning** - Some products match (51-99% sync)
- 🔴 **Red Error** - Few products match (0-50% sync)

**Detailed Information:**
- Number of synced products / total products (e.g., "5/10")
- Progress bar showing sync percentage
- Tooltip with full details on hover

**Example:**
```
Silk Fabric              ✅ 10/10 ████████████ 100%
Cotton Fabric            ⚠️  7/10 ████████░░░░  70%
Linen Fabric             ❌  2/10 ███░░░░░░░░░  20%
```

### 3. **Bulk Operations with Selection** 🎯

**Select Fabrics:**
- Use individual checkboxes to select specific fabrics
- Use the "Select All" checkbox in the header to select all fabrics
- Selected count is displayed on the action buttons

**Two Powerful Actions:**

#### a) **"Apply to Selected Fabrics"**
- Updates the `shipping_returns` field of selected fabrics
- Copies the policy content directly to fabrics
- Confirmation dialog shows how many fabrics will be updated

**Use case:** You've updated a policy and want to apply it to specific fabrics that use it

#### b) **"Sync Products"**
- Updates products to match their fabric's `shipping_returns` content
- Only updates products of the selected fabrics
- Shows count of updated products

**Use case:** After updating fabrics, sync their products to match

## Step-by-Step Workflows

### Workflow 1: Update a Policy and Apply to Fabrics

**Scenario:** You've updated your "Standard Shipping" policy and want to apply it to specific fabrics.

**Steps:**
1. Go to **Policies** page
2. Edit the policy and update its content
3. Save the policy
4. Expand the policy card to view fabrics
5. Select the fabrics you want to update (use checkboxes)
6. Click **"Apply to Selected Fabrics"**
7. Confirm the action
8. ✅ Selected fabrics now have the updated policy content

### Workflow 2: Sync Products to Match Their Fabrics

**Scenario:** Some products are out of sync with their fabric's shipping policy.

**Steps:**
1. Go to **Policies** page
2. Expand a policy card
3. Look at the sync status indicators:
   - 🟢 Green = No action needed
   - 🟡 Yellow or 🔴 Red = Needs sync
4. Select the fabrics with out-of-sync products
5. Click **"Sync Products"**
6. Confirm the action
7. ✅ Products now match their fabric's policy

### Workflow 3: Apply a New Policy to Multiple Fabrics

**Scenario:** You've created a new "Premium Shipping" policy and want to apply it to premium fabrics.

**Steps:**
1. Create the policy on the **Policies** page
2. Go to **Fabrics** page
3. For each premium fabric:
   - Click Edit
   - Click "Copy from Policy Template"
   - Select "Premium Shipping"
   - Save
4. Return to **Policies** page
5. Expand "Premium Shipping" policy
6. Verify the fabrics appear in the list
7. Select all fabrics
8. Click **"Sync Products"** to update existing products
9. ✅ All premium products now have the premium shipping policy

## Understanding the Sync Status

### Why Products Get Out of Sync

Products can become out of sync with their fabric's policy when:
1. **Manual edits** - Someone manually edited a product's shipping_returns field
2. **Fabric updates** - The fabric's policy was updated but products weren't synced
3. **Policy changes** - A policy template was edited and applied to fabrics, but products weren't updated
4. **Old products** - Products created before a fabric's policy was set

### How to Fix Out-of-Sync Products

**Option 1: From Policies Page (Recommended)**
1. Expand the policy
2. Find fabrics with low sync percentage
3. Select those fabrics
4. Click "Sync Products"

**Option 2: From Fabrics Page**
1. Edit the fabric
2. Click "Apply to Products"
3. Choose "Apply to Products of This Fabric"

**Option 3: From Product Edit Page**
1. Edit individual product
2. Click "Apply Fabric Defaults" button
3. Save

## Technical Details

### How Fabric Association Detection Works

The system matches fabrics to policies by **exact content matching**:

```javascript
// Pseudocode
fabricsUsingPolicy = fabrics.filter(fabric => 
  fabric.shipping_returns === policy.content
)
```

**Important Notes:**
- Matching is based on exact text comparison
- Even a small difference (space, newline) means no match
- If a fabric's content is customized after copying from a policy, it won't show as associated

### How Sync Status is Calculated

For each fabric associated with a policy:

```javascript
// Pseudocode
totalProducts = products.count(fabric_type === fabric.name)
syncedProducts = products.count(
  fabric_type === fabric.name AND 
  shipping_returns === fabric.shipping_returns
)
syncPercentage = (syncedProducts / totalProducts) * 100
```

### Performance Considerations

- Fabric associations are loaded on-demand (when you expand a policy)
- Loading indicator shows while calculating sync status
- Data is cached until you refresh or change policies

## Best Practices

### 1. **Regular Sync Checks**
- Periodically check the Policies page for sync status
- Look for yellow or red indicators
- Sync products regularly to maintain consistency

### 2. **Policy Updates**
- When updating a policy template:
  1. Update the policy
  2. Expand it to see affected fabrics
  3. Select fabrics that should use the new content
  4. Apply to selected fabrics
  5. Sync their products

### 3. **New Policy Creation**
- Create the policy as a template
- Apply to fabrics manually using "Copy from Policy Template"
- OR select fabrics in the Policies page and apply in bulk

### 4. **Fabric Customization**
- If you customize a fabric's shipping_returns after copying from a policy
- The fabric won't show as associated with that policy anymore
- This is expected behavior - the fabric now has custom content

### 5. **Product Creation**
- New products automatically inherit their fabric's shipping_returns
- No manual sync needed for new products
- Only existing products may need syncing

## Troubleshooting

### Q: A fabric should be using this policy but doesn't appear in the list

**A:** The fabric's `shipping_returns` content doesn't exactly match the policy's content. This can happen if:
- The fabric has customized content
- The policy was updated after the fabric copied it
- There are extra spaces or newlines

**Solution:** Edit the fabric and use "Copy from Policy Template" to re-apply the policy.

### Q: Sync status shows 0/0 products

**A:** This fabric has no products yet. This is normal for new fabrics.

### Q: Can I select fabrics from multiple policies?

**A:** No, selections are per-policy. You can only select fabrics within one expanded policy at a time.

### Q: What happens if I sync products while editing a product?

**A:** The bulk sync will update the product in the database, but your unsaved changes in the edit form may create a conflict. Always save or discard product edits before doing bulk syncs.

### Q: Will syncing products overwrite manual customizations?

**A:** Yes! The sync operation will overwrite each product's `shipping_returns` field with the fabric's content. Use carefully.

## Migration from Old System

If you're upgrading from the old relational system:

**Before:**
- Fabrics had `shipping_policy_id` linking to policies
- Products inherited through this link
- No visibility into sync status

**After:**
- Fabrics have direct text in `shipping_returns`
- Policies are templates only
- Full visibility into fabric associations and product sync

**What to do:**
1. Run the migration (see MIGRATION_GUIDE.md)
2. Check each policy to see fabric associations
3. For any empty fabrics, use "Copy from Policy Template"
4. Sync products as needed

## Future Enhancements

Potential future improvements:
- Fuzzy matching for similar (but not exact) content
- Bulk sync across multiple policies
- Scheduled automatic syncing
- Sync history and audit log
- Email notifications when products go out of sync
- "Sync on Save" option for policy edits
