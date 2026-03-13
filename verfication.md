## Verification: All Clear ✅

**Edge Functions (all 4 present and correct):**

- `internal-get-products` — auth check, admin client, queries `id, name, images, fabric_type, print_id, price` ordered by name ✅
- `internal-get-product-images` — auth check, returns single product images array ✅
- `internal-replace-product-images` — handles both `replaceAll` and `replaceIndexes` mode, proper 400/404/500 handling ✅
- `internal-upload-image` — multipart form handling, uploads to `product-images` bucket, returns `publicUrl` ✅

**`src/internalApi.js`** — all 4 exported functions match edge function contracts, `parseJsonResponse` error helper is a good addition not in the original plan ✅

***

## One Issue to Fix Before Moving On

The `internal-upload-image` function needs a check. Go to `supabase/functions/internal-upload-image/index.ts` and verify it handles the multipart form parsing correctly for Deno — specifically it should use `req.formData()` (not `req.body`). If it uses `req.formData()` you're good. Share the content here or paste it and I'll confirm.

***

## Next Step: Deploy the Edge Functions to Supabase

The code exists in the repo but the functions are **not live until deployed**. You need to run this in your terminal from the `neera-admin` project root:

**Step 1:** Make sure Supabase CLI is linked to your project:

```
supabase link --project-ref <your-project-ref>
```

**Step 2:** Set the `INTERNAL_API_KEY` secret on Supabase:

```
supabase secrets set INTERNAL_API_KEY=<your-secure-key>
```

Generate one with: `openssl rand -hex 32`

**Step 3:** Deploy all four functions:

```
supabase functions deploy internal-get-products
supabase functions deploy internal-get-product-images
supabase functions deploy internal-upload-image
supabase functions deploy internal-replace-product-images
```

**Step 4:** Add to `.env` in `neera-admin`:

```
VITE_SUPABASE_FUNCTIONS_URL=https://<your-project-ref>.supabase.co/functions/v1
VITE_INTERNAL_API_KEY=<same-key-as-above>
```

**Step 5:** Run the four `curl` validation tests from the technical plan to confirm each function responds correctly.