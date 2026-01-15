# Shipping & Returns Policy System - Quick Reference

## 📋 What Changed

We added a **Policies Management system** to the admin panel. This allows centralized management of shipping & returns policies that can be applied to fabrics and products.

---

## 🗄️ Database Changes

### New Table: `shipping_policies`
```sql
CREATE TABLE shipping_policies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Template library for reusable policies (admin only, not exposed to website)

---

### Modified Table: `fabrics`
**REMOVED:** `shipping_policy_id` foreign key column

**Reason:** Policies are now templates only. Content is copied to `fabrics.shipping_returns` instead of being linked.

---

### Table: `products` (No Changes)
**Field:** `shipping_returns TEXT` - same as before

**This is what your website displays.**

---

## 🔄 How It Works (Data Flow)

```
Admin Panel                          Website
───────────                          ───────

1. Create policy template
   ↓
2. Assign to fabric(s)
   ↓ (copies content)
3. fabrics.shipping_returns
   ↓
4. Sync products
   ↓ (copies content)
5. products.shipping_returns  ────→  Display on product page
```

**Key Point:** Policies → Fabrics → Products (content is copied at each step, not linked)

---

## 🌐 Website Implementation

### What to Fetch
**Fetch from:** `products.shipping_returns` ← Same field as before

```javascript
const { data: product } = await supabase
  .from('products')
  .select('shipping_returns')
  .eq('id', productId)
  .single();
```

**✅ DO:** Use `products.shipping_returns`  
**❌ DON'T:** Query `shipping_policies` or `fabrics` tables

---

### Critical Fix: Preserving Line Breaks

**Problem:** Content is stored with newline characters (`\n`), but HTML doesn't render them by default.

**Solution:** Add `white-space: pre-wrap` CSS

#### React/Next.js:
```jsx
<div style={{ whiteSpace: 'pre-wrap' }}>
  {product.shipping_returns}
</div>
```

#### Tailwind CSS:
```jsx
<div className="whitespace-pre-wrap">
  {product.shipping_returns}
</div>
```

#### Plain CSS:
```css
.shipping-returns-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}
```

**Without this CSS, all text appears on one line!**

---

## 📦 Content Format

Content is stored as **plain text** with:
- Newlines: `\n` characters
- Bullet points: `•` (Unicode character)
- No HTML, no Markdown

**Example in database:**
```
Shipping: • Shipping charges based on location. • Standard delivery: 5-7 business days
Returns and Exchange: • We only offer exchanges for products that are defective or damaged • Products must be unused and in original packaging • Contact us for return authorization
```

With `white-space: pre-wrap`, this displays as multiple lines.

---

## 🎨 Display Recommendations

Your product page likely has tabs for:
1. **Details & Craftsmanship** → `products.description`
2. **Care Instructions** → `products.care_instructions`
3. **Shipping & Returns** → `products.shipping_returns`

**Apply `white-space: pre-wrap` to ALL three tabs for consistency.**

```jsx
<Tabs>
  <Tab label="Shipping & Returns">
    {product.shipping_returns ? (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {product.shipping_returns}
      </div>
    ) : (
      <p>Shipping information not available.</p>
    )}
  </Tab>
</Tabs>
```

---

## ✅ Quick Checklist

**For existing website:**
- [ ] Ensure fetching from `products.shipping_returns` field
- [ ] Add `white-space: pre-wrap` CSS to shipping & returns display
- [ ] Test that line breaks show correctly
- [ ] Check on mobile devices

**If line breaks aren't showing:**
1. Check CSS - must have `white-space: pre-wrap`
2. Verify content has `\n` characters (query database directly)
3. Hard refresh browser (Ctrl + Shift + R)

---

## 🐛 Troubleshooting

### Line breaks not showing
```jsx
// ✅ Correct
<div style={{ whiteSpace: 'pre-wrap' }}>
  {product.shipping_returns}
</div>

// ❌ Wrong - no CSS
<div>
  {product.shipping_returns}  // Everything on one line!
</div>
```

### Content not updating after admin changes
1. Admin must click **"Sync Products"** in Policies page
2. Hard refresh website (Ctrl + Shift + R)
3. Clear CDN cache if applicable

### Checking database directly
```sql
-- Verify product has content
SELECT id, name, shipping_returns 
FROM products 
WHERE id = [product_id];
```

---

## 📊 Admin Panel Features (FYI)

The admin panel now has:
- **Policies Page:** Create/edit policy templates
- **Fabric Pages:** Select policy from dropdown, content copied to fabric
- **Product Pages:** Auto-inherits from fabric, can be customized

**Website doesn't need to know about these - just display `products.shipping_returns`**

---

## 🎯 TL;DR

1. **Database:** Added `shipping_policies` table, removed `fabrics.shipping_policy_id` column
2. **Website fetch:** Same as before - `products.shipping_returns` field
3. **Critical fix:** Add `white-space: pre-wrap` CSS to preserve line breaks
4. **That's it!** No other website changes needed.

---

**Last Updated:** 2026-01-15  
**Version:** 1.0 (Condensed)
