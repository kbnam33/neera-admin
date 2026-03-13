import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReplaceBody = {
  productId: number;
  newImages: string[];
  replaceAll: boolean;
  replaceIndexes?: number[];
};

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

    const body = (await req.json()) as ReplaceBody;
    const { productId, newImages, replaceAll, replaceIndexes } = body;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!productId || !Array.isArray(newImages) || typeof replaceAll !== "boolean") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, images")
      .eq("id", productId)
      .single();

    if (fetchError) {
      const status = fetchError.code === "PGRST116" ? 404 : 500;
      return new Response(JSON.stringify({ error: fetchError.message }), {
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

    let finalImages: string[] = [];

    if (replaceAll) {
      finalImages = [...newImages];
    } else if (Array.isArray(replaceIndexes) && replaceIndexes.length > 0) {
      const currentImages = Array.isArray(product.images) ? [...product.images] : [];

      for (let i = 0; i < replaceIndexes.length; i += 1) {
        const indexToReplace = replaceIndexes[i];
        const replacement = newImages[i];

        if (
          Number.isInteger(indexToReplace) &&
          indexToReplace >= 0 &&
          typeof replacement === "string"
        ) {
          currentImages[indexToReplace] = replacement;
        }
      }

      finalImages = currentImages;
    } else {
      return new Response(
        JSON.stringify({
          error: "replaceIndexes is required when replaceAll is false",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ images: finalImages })
      .eq("id", productId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ productId, updatedImages: finalImages }),
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
