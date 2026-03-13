const FUNCTIONS_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY;

function internalHeaders() {
  return {
    "x-internal-api-key": INTERNAL_KEY,
    "Content-Type": "application/json",
  };
}

async function parseJsonResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function getAllProductsWithImages() {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/internal-get-products`, {
    method: "GET",
    headers: internalHeaders(),
  });

  return parseJsonResponse(response);
}

export async function getProductImages(productId) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/internal-get-product-images`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify({ productId }),
  });

  return parseJsonResponse(response);
}

export async function uploadWebpImage(productId, webpBlob) {
  const formData = new FormData();
  formData.append("productId", String(productId));
  formData.append("file", webpBlob, "image.webp");

  const response = await fetch(`${FUNCTIONS_BASE_URL}/internal-upload-image`, {
    method: "POST",
    headers: { "x-internal-api-key": INTERNAL_KEY },
    body: formData,
  });

  return parseJsonResponse(response);
}

export async function replaceProductImages(
  productId,
  newImages,
  replaceAll,
  replaceIndexes = [],
) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/internal-replace-product-images`, {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify({ productId, newImages, replaceAll, replaceIndexes }),
  });

  return parseJsonResponse(response);
}
