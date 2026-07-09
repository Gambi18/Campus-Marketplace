import { postAPI, fetchAPI } from "./api";
import type { ProductCard } from "../types";

/** Build an additive `?limit=&offset=` query string (omitted when not paging). */
function pageQuery(limit?: number, offset?: number, prefix = "?"): string {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString();
  return qs ? `${prefix}${qs}` : "";
}

export function createProduct(formData: FormData) {
  return postAPI("/api/v1/products", formData);
}

export function getAllProducts(limit?: number, offset?: number) {
  return fetchAPI<{ products: ProductCard[] }>(`/api/v1/products${pageQuery(limit, offset)}`);
}

export function fetchMyProducts(limit = 100, offset = 0) {
  return fetchAPI<{ products: ProductCard[] }>(
    `/api/v1/my-products${pageQuery(limit, offset)}`,
  );
}

export async function searchProducts(query: string, limit?: number, offset?: number) {
  const base = `/api/v1/products/search?q=${encodeURIComponent(query)}`;
  return fetchAPI<{ products: ProductCard[] }>(`${base}${pageQuery(limit, offset, "&")}`);
}

export function getProductsByCategory(categoryId: string, limit?: number, offset?: number) {
  return fetchAPI<{ products: ProductCard[] }>(
    `/api/v1/categories/${categoryId}/products${pageQuery(limit, offset)}`,
  );
}
