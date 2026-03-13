import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_API_KEY = Deno.env.get("INTERNAL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const providedKey = req.headers.get("x-internal-api-key");
    if (!providedKey || providedKey !== INTERNAL_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const productId = body?.productId;

    if (!productId || !Number.isFinite(Number(productId))) {
      return new Response(JSON.stringify({ error: "Invalid productId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, images")
      .eq("id", Number(productId))
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return new Response(JSON.stringify({ error: error.message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        productId: product.id,
        productName: product.name,
        images: Array.isArray(product.images) ? product.images : [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
