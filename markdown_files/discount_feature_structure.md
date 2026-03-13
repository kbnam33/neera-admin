# Discount Feature Structure

## Purpose
This document describes the current discount feature architecture (frontend + backend) and the exact integration points needed to implement a Discount Management tab in the admin tool.

## Current Feature Scope
- Customer can enter a discount code during checkout.
- System validates the code against `discount_codes`.
- Discount is applied to total before payment initialization.
- Order stores discount metadata in `orders`.
- Razorpay receives discounted final amount.

## Backend Structure

### 1) Database Tables

#### `discount_codes`
Used for validating and applying promotional discounts.

Core columns:
- `id` (UUID, PK)
- `code` (TEXT, UNIQUE, required)
- `discount_type` (TEXT: `percentage` or `fixed`)
- `discount_value` (NUMERIC, > 0)
- `min_order_amount` (NUMERIC, default 0)
- `max_discount_amount` (NUMERIC, nullable)
- `is_active` (BOOLEAN, default true)
- `usage_limit` (INTEGER, nullable)
- `times_used` (INTEGER, default 0)
- `valid_from` (TIMESTAMPTZ, default now)
- `valid_until` (TIMESTAMPTZ, nullable)
- `created_at`, `updated_at`

Behavior:
- Code lookup is done by exact code (frontend uppercases input).
- Expiry, active flag, min amount, and usage limit are validated before apply.
- `times_used` is incremented when order placement proceeds after code usage.

#### `orders` (extended for discount feature)
Discount-related columns:
- `original_price` (NUMERIC) -> subtotal before discount
- `discount_code` (TEXT) -> applied code
- `discount_amount` (NUMERIC) -> amount deducted

Related existing order columns:
- `total_price` -> payable amount after discount
- `payment_status` -> `pending`/`paid`
- payment metadata fields for Razorpay IDs/signature

### 2) Edge Functions

#### `create-razorpay-order`
Path:
- `supabase/functions/create-razorpay-order/index.ts`

Role:
- Creates Razorpay order from final payable amount.
- Validates amount and converts rupees to integer paise with rounding.

Critical logic:
- Reject invalid/non-positive amount.
- `amountInPaise = Math.round(amount * 100)`.
- Sends integer paise to Razorpay API.

#### `verify-razorpay-payment`
Path:
- `supabase/functions/verify-razorpay-payment/index.ts`

Role:
- Verifies Razorpay signature after payment callback.

### 3) Security / Access
- RLS enabled on `discount_codes`.
- Current policy allows reading active codes for validation.
- Admin write operations are not yet implemented via admin-safe API.

## Frontend Structure

### 1) Checkout Integration
File:
- `src/CheckoutPage.jsx`

Key state:
- `discountCode` (input value)
- `appliedDiscount` (selected code row)
- `discountError` (validation error)
- `applyingDiscount` (button/loading state)

Computed values:
- `subtotal` from cart items.
- `discountAmount` from business rules.
- `finalTotal` = `max(subtotal - discountAmount, 0)`, rounded to 2 decimals.

Flow:
1. User enters code and clicks Apply.
2. Query `discount_codes` by `code` + `is_active = true`.
3. Validate:
   - active date range (`valid_from`, `valid_until`)
   - `min_order_amount`
   - `usage_limit` vs `times_used`
4. Store `appliedDiscount`.
5. Show discount row and updated total in UI.
6. On submit:
   - create pending order in `orders` with discount columns
   - attempt increment of `times_used`
   - call `create-razorpay-order` with `finalTotal`
   - open Razorpay checkout
   - verify + mark order paid

### 2) Order Detail Display
File:
- `src/OrderDetailPage.jsx`

Shows:
- `original_price` (if present)
- `discount_code`
- `discount_amount`
- final paid amount

## Current Validation Rules

### Code validity
- Code must exist.
- `is_active = true`.
- Current timestamp must be between `valid_from` and `valid_until` (if `valid_until` set).

### Eligibility
- Cart subtotal must satisfy `min_order_amount`.
- If `usage_limit` exists, `times_used < usage_limit`.

### Discount calculation
- `percentage`: `(subtotal * discount_value / 100)`
- Apply cap if `max_discount_amount` set.
- `fixed`: `min(discount_value, subtotal)`
- Final totals are rounded before payment initialization.

## Admin Tool Upgrade: Discount Management Tab

## Goal
Allow admins to create/manage discount codes directly from admin UI, instead of SQL/manual edits.

### A) Required Admin Actions
- Create code
- List/search/filter codes
- Edit code fields
- Activate/deactivate code
- Set validity window
- Set usage limits
- View usage stats (`times_used`, remaining uses)

### B) Suggested Admin UI Structure

#### 1. List View (table)
Columns:
- Code
- Type (`percentage`/`fixed`)
- Value
- Min order
- Max discount
- Status (`active`/`inactive`)
- Valid from / valid until
- Usage (`times_used` / `usage_limit`)
- Actions (`Edit`, `Deactivate/Activate`)

Filters:
- Active/Inactive
- Expired/Valid
- Type
- Search by code

#### 2. Create/Edit Form
Fields:
- `code` (uppercase, alphanumeric)
- `discount_type`
- `discount_value`
- `min_order_amount`
- `max_discount_amount` (optional)
- `usage_limit` (optional)
- `valid_from`
- `valid_until` (optional)
- `is_active`

Client validation:
- code required, alphanumeric, uppercase
- `discount_value > 0`
- if type percentage: `discount_value <= 100` (recommended)
- if both dates set: `valid_until > valid_from`
- non-negative amounts/limits

### C) Backend APIs Needed for Admin
Current customer flow reads/writes discount data from frontend directly. For admin operations, use privileged backend endpoints.

Recommended options:
- Supabase Edge Functions (preferred)
- or RPC functions with secured role checks

Recommended API contract:

1. `admin-discounts-list`
- Input: filters + pagination
- Output: discount rows + total count

2. `admin-discounts-create`
- Input: full code payload
- Output: created row
- Server checks:
  - unique `code`
  - valid numeric/date constraints

3. `admin-discounts-update`
- Input: `id` + patch payload
- Output: updated row

4. `admin-discounts-toggle-status`
- Input: `id`, `is_active`
- Output: updated status

5. `admin-discounts-delete` (optional)
- Prefer soft-delete via `is_active = false`.

### D) Security Requirements for Admin Tab
- Only admin users can call admin endpoints.
- Do not expose direct unrestricted table writes from browser.
- Keep customer-facing read policy for active codes only.
- Add strict RLS/admin policy or function-level auth checks.

### E) Data Integrity Rules for Admin
- Enforce uppercase storage for `code`.
- Prevent duplicate codes (already unique).
- Keep idempotent operations where possible.
- For updates, keep `updated_at` trigger active.

## Operational Notes
- Existing SQL scripts are idempotent and safe for reruns:
  - `scripts/create-discount-codes.sql`
  - `scripts/update-orders-for-discounts.sql`
- Amount conversion bug during discounted payment was fixed in `create-razorpay-order` by integer paise normalization.

## Minimal Implementation Plan for Admin Tool
1. Build `Discount Management` tab UI (list + create/edit modal).
2. Implement secured admin Edge Functions.
3. Wire admin UI to those functions.
4. Add server-side validation matching checkout rules.
5. Add audit logs (recommended) for create/update/deactivate actions.

## Quick Reference: End-to-End Discount Lifecycle
1. Admin creates code in admin tab.
2. Code stored in `discount_codes`.
3. Customer enters code at checkout.
4. Checkout validates code and computes discount.
5. Order stores discount metadata.
6. Razorpay initialized with discounted final amount.
7. Payment success updates order status and retains discount history.
