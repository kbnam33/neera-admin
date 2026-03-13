# Backend Structure for Order Display

## Database Architecture

### Orders Table
**Table Name:** `orders`

**Key Columns:**
- `id` (UUID, Primary Key) - Unique order identifier
- `user_id` (UUID, Foreign Key) - References authenticated user
- `total_price` (Numeric) - Total order amount
- `shipping_address` (JSONB) - Contains: name, address, city, state, postalCode, email, phone
- `products` (JSONB Array) - Array of product objects with images
- `payment_status` (Text) - Values: 'pending' or 'paid'
- `razorpay_order_id` (Text) - Razorpay transaction reference
- `razorpay_payment_id` (Text) - Payment ID from Razorpay
- `razorpay_signature` (Text) - Payment verification signature
- `created_at` (Timestamp) - Order creation time

**Products Array Structure (JSONB):**
```json
{
  "id": "product-id",
  "name": "Product Name",
  "slug": "product-slug",
  "fabric_type": "chanderi",
  "price": 2999.00,
  "quantity": 1,
  "images": ["image-url-1", "image-url-2"]
}
```

## Backend API Routes

### Supabase Edge Functions

**Location:** `/supabase/functions/`

1. **create-razorpay-order** (`/supabase/functions/create-razorpay-order/index.ts`)
   - Creates Razorpay payment order
   - Input: `{ amount: number }`
   - Output: `{ id: razorpay_order_id, amount, currency }`

2. **verify-razorpay-payment** (`/supabase/functions/verify-razorpay-payment/index.ts`)
   - Verifies payment signature
   - Input: `{ order_id, razorpay_payment_id, razorpay_signature }`
   - Output: `{ status: 'ok' | 'error' }`

## Data Flow

### Order Creation Flow
1. User submits checkout form → `CheckoutPage.jsx`
2. Order inserted with `payment_status: 'pending'`
3. Razorpay order created via Edge Function
4. On payment success, order updated to `payment_status: 'paid'`

### Order Display Flow

#### Profile Page - Order History (`/profile`)
**Route:** `/src/ProfilePage.jsx`

**Query:**
```javascript
supabase
  .from('orders')
  .select('*')
  .eq('user_id', session.user.id)
  .eq('payment_status', 'paid')
  .order('created_at', { ascending: false })
```

**Data Displayed:**
- Order ID, creation date, total price
- Product thumbnails (first image from `products[].images[0]`)
- Up to 4 product images shown in overlapping layout

#### Order Detail Page (`/order/:orderId`)
**Route:** `/src/OrderDetailPage.jsx`

**Query:**
```javascript
supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .eq('user_id', session.user.id)
  .single()
```

**Data Displayed:**
- Full order details (ID, date, total)
- All products with images (`products[].images[0]`)
- Shipping address details
- Payment summary

## Image Storage

**Storage Method:** URLs stored in database
- Product images stored as array in `products` JSONB column
- Each product contains `images` array with full URLs
- Images fetched directly from stored URLs
- Fallback: Placeholder image if no images available

## Authentication

**Provider:** Supabase Auth
- All order queries filtered by `user_id`
- Session required for order access
- Row-level security ensures users only see their orders
