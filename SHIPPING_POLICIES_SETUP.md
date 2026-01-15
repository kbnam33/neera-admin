# Shipping & Returns Policy Management

## Overview

This feature allows you to manage shipping and returns policies from a single source and apply them to fabrics and products. This eliminates the need to manually enter the same policy text repeatedly.

## How It Works

### 1. **Policy Management**
- Navigate to **Policies** in the sidebar
- Create reusable shipping & returns policy templates
- Set one policy as **Default** - it will auto-apply to new fabrics

### 2. **Fabric Level**
- When creating/editing a fabric, select a policy from the dropdown
- If no policy is selected, you can still use the manual "Shipping & Returns" text field
- The default policy is automatically selected for new fabrics

### 3. **Product Level**
- Products automatically inherit the policy from their fabric
- When you select a fabric or click "Apply Fabric Defaults", the policy content is applied
- Products use the policy content in the "Shipping & Returns" field
- You can still override this by editing the field manually

## Setup Instructions

### Step 1: Create Database Table

Run the migration SQL file to create the necessary database structure:

```bash
# Connect to your database and run:
psql -U your_username -d your_database -f database/migrations/create_shipping_policies_table.sql
```

Or run it directly in your Supabase SQL editor:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/migrations/create_shipping_policies_table.sql`
4. Click "Run"

### Step 2: Create Your First Policy

1. Navigate to **Policies** in the admin panel
2. Click **New Policy**
3. Enter a name (e.g., "Standard Shipping & Returns")
4. Enter your policy content
5. Check "Set as default policy" if you want it to apply to all new fabrics
6. Click **Create**

### Step 3: Apply to Fabrics

**For New Fabrics:**
- The default policy is automatically selected
- You can change it to a different policy or set to "None"

**For Existing Fabrics:**
1. Edit each fabric
2. Select a policy from the "Shipping & Returns Policy" dropdown
3. Save changes

### Step 4: Products Inherit Automatically

- When creating a new product, select a fabric
- The policy content automatically populates the "Shipping & Returns" field
- Click "Apply Fabric Defaults" button to re-apply if needed

## Benefits

✅ **Single Source of Truth** - Update policy in one place, apply everywhere  
✅ **Consistency** - All products using the same fabric have the same policy  
✅ **Efficiency** - No need to copy-paste policy text repeatedly  
✅ **Flexibility** - Can still override at fabric or product level if needed  
✅ **Easy Updates** - Change a policy and update all fabrics using it

## Policy Hierarchy

The application follows this priority order:

1. **Product Level**: Manual text in the product's "Shipping & Returns" field
2. **Fabric Level (via Policy)**: If fabric has a policy selected, use that policy's content
3. **Fabric Level (manual)**: If no policy is selected, use fabric's manual "Shipping & Returns" text
4. **Default**: Empty if nothing is set

## Managing Policies

### Creating a Policy
1. Go to Policies page
2. Click "New Policy"
3. Fill in name and content
4. Optionally set as default

### Editing a Policy
1. Click the edit icon on any policy card
2. Update name, content, or default status
3. Save changes

### Deleting a Policy
1. Click the delete icon on any policy card
2. **Note**: Cannot delete the default policy - set another as default first
3. Confirm deletion

### Setting a Default Policy
- Only one policy can be default at a time
- Click "Set as Default" on any policy card
- The previous default is automatically unset

## Tips

💡 **Start Simple**: Create 1-2 policies initially, add more as needed  
💡 **Use Descriptive Names**: e.g., "Premium Fast Shipping", "International Shipping"  
💡 **Review Periodically**: Update policies to reflect current shipping rates and terms  
💡 **Backup**: Keep a copy of your policies outside the system  

## Troubleshooting

**Q: Policy not showing in product?**  
A: Make sure you've selected the fabric first, then the policy auto-applies

**Q: Can I have different policies for different fabrics?**  
A: Yes! Each fabric can have its own policy or use the default

**Q: What if I delete a policy that's being used?**  
A: The fabric's `shipping_policy_id` will be set to NULL, and it will fall back to manual text

**Q: Can I override the policy for a specific product?**  
A: Yes! Just edit the "Shipping & Returns" field manually in the product form

## Need Help?

If you encounter any issues or have questions, please check:
- Database migration was run successfully
- Policies table exists in your database
- Fabrics table has the `shipping_policy_id` column
