# Technical Plan: Admin Tool API Layer for Agent Access

## Part 1: Supabase Internal API Functions (Edge Functions)


***

### Step 1: Create Edge Function — Get All Products With Images

**Location:** `supabase/functions/internal-get-products/index.ts`

Create a Supabase Edge Function. Inside:

**Handler logic:**

- Verify request contains header `x-internal-api-key` matching value from environment variable `INTERNAL_API_KEY`
- If missing or wrong, return 401
- Initialize Supabase admin client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env
- Query `products` table: select `id`, `name`, `images`, `fabric_type`, `print_id`, `price`
- Order by `name` ascending
- Return JSON array of products with 200 status
- On error return 500 with error message

***

### Step 2: Create Edge Function — Replace Product Images

**Location:** `supabase/functions/internal-replace-product-images/index.ts`

Create a Supabase Edge Function. Inside:

**Handler logic:**

- Verify request header `x-internal-api-key` matches env `INTERNAL_API_KEY`
- If missing or wrong, return 401
- Parse request body JSON: expect `{ productId: number, newImages: string[], replaceAll: boolean, replaceIndexes?: number[] }`
- Initialize Supabase admin client
- Fetch existing product from `products` table by `productId`
- If product not found, return 404

**If `replaceAll` is true:**

- Replace entire `images` array with `newImages`

**If `replaceAll` is false and `replaceIndexes` provided:**

- Get current `images` array from product
- For each index in `replaceIndexes`, replace `images[index]` with corresponding item from `newImages`
- Result is the updated images array with only specified positions replaced
- Update `products` table: set `images` to the final images array where `id = productId`
- Return 200 with `{ productId, updatedImages: finalImagesArray }`
- On error return 500 with error message

***

### Step 3: Create Edge Function — Upload Converted WebP to Storage

**Location:** `supabase/functions/internal-upload-image/index.ts`

Create a Supabase Edge Function. Inside:

**Handler logic:**

- Verify header `x-internal-api-key`
- Parse request as multipart form data: expect fields `productId` (string) and `file` (binary webp file)
- Initialize Supabase admin client
- Generate storage path: `{productId}/{uuid}.webp` using `crypto.randomUUID()`
- Upload file to bucket `product-images` with content-type `image/webp`
- Get public URL: `supabase.storage.from("product-images").getPublicUrl(path)`
- Return 200 with `{ publicUrl, storagePath }`
- On error return 500

***

### Step 4: Set Environment Variables in Supabase

**Location:** Supabase project dashboard → Settings → Edge Functions → Environment variables

Add:

- `INTERNAL_API_KEY` = a secure random string (generate with `openssl rand -hex 32`)
- `SUPABASE_SERVICE_ROLE_KEY` = your existing service role key
- `SUPABASE_URL` = your existing project URL

***

### Step 5: Deploy Edge Functions

**Location:** Terminal at project root

Run in order:

```
supabase functions deploy internal-get-products
supabase functions deploy internal-replace-product-images
supabase functions deploy internal-upload-image
```


***

### Step 6: Create Edge Function — Get Product Image Public URLs

**Location:** `supabase/functions/internal-get-product-images/index.ts`

Create a Supabase Edge Function. Inside:

**Handler logic:**

- Verify `x-internal-api-key` header
- Parse request body: `{ productId: number }`
- Initialize admin client
- Fetch product from `products` by id: select `id`, `name`, `images`
- Return 200 with `{ productId, productName, images: string[] }` where images is the array of public URLs
- If not found return 404

Deploy: `supabase functions deploy internal-get-product-images`

***

## Part 2: Add `.env` Entry for Internal API Key

**Location:** `.env` in `neera-admin` root (also add to `.env.example`)

Add:

```
VITE_INTERNAL_API_KEY=<same value as INTERNAL_API_KEY in Supabase>
VITE_SUPABASE_FUNCTIONS_URL=https://<your-project-ref>.supabase.co/functions/v1
```


***

## Part 3: Create Internal API Client in Admin Tool

**Location:** `neera-admin/src/internalApi.js`

Create new file. Inside:

**Define constant `FUNCTIONS_BASE_URL`:**

- Value: `import.meta.env.VITE_SUPABASE_FUNCTIONS_URL`

**Define constant `INTERNAL_KEY`:**

- Value: `import.meta.env.VITE_INTERNAL_API_KEY`

**Define helper `internalHeaders()`:**

- Returns object: `{ 'x-internal-api-key': INTERNAL_KEY, 'Content-Type': 'application/json' }`

**Export async function `getAllProductsWithImages()`:**

- Fetch `${FUNCTIONS_BASE_URL}/internal-get-products` with method GET and `internalHeaders()`
- Parse and return JSON array

**Export async function `getProductImages(productId)`:**

- Fetch `${FUNCTIONS_BASE_URL}/internal-get-product-images` with method POST
- Body: `JSON.stringify({ productId })`
- Headers: `internalHeaders()`
- Return parsed JSON

**Export async function `uploadWebpImage(productId, webpBlob)`:**

- Build FormData: append `productId` as string, append `file` as `webpBlob` with filename `image.webp`
- Fetch `${FUNCTIONS_BASE_URL}/internal-upload-image` with method POST
- Headers: `{ 'x-internal-api-key': INTERNAL_KEY }` (no Content-Type — let browser set multipart boundary)
- Return parsed JSON `{ publicUrl, storagePath }`

**Export async function `replaceProductImages(productId, newImages, replaceAll, replaceIndexes)`:**

- Fetch `${FUNCTIONS_BASE_URL}/internal-replace-product-images` with method POST
- Body: `JSON.stringify({ productId, newImages, replaceAll, replaceIndexes })`
- Headers: `internalHeaders()`
- Return parsed JSON `{ productId, updatedImages }`

***

## Part 4: Validation

**Location:** Terminal

Test each edge function manually with `curl`:

**Test get-products:**

```
curl -X GET \
  https://<project>.supabase.co/functions/v1/internal-get-products \
  -H "x-internal-api-key: <your-key>"
```

Expected: JSON array of products each with `id`, `name`, `images`

**Test get-product-images:**

```
curl -X POST \
  https://<project>.supabase.co/functions/v1/internal-get-product-images \
  -H "x-internal-api-key: <your-key>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1}'
```

Expected: `{ productId, productName, images: [...] }`

**Test replace-product-images with replaceAll=false:**

```
curl -X POST \
  https://<project>.supabase.co/functions/v1/internal-replace-product-images \
  -H "x-internal-api-key: <your-key>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "newImages": ["https://...webp"], "replaceAll": false, "replaceIndexes": [0]}'
```

Expected: `{ productId: 1, updatedImages: [...] }` with index 0 replaced

**Verify without auth key returns 401:**

```
curl -X GET \
  https://<project>.supabase.co/functions/v1/internal-get-products
```

Expected: 401

***