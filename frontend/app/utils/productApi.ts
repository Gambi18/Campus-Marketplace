import { postAPI, fetchAPI } from "./api";
import type { ProductCard } from "../types";

/** Optional server-side sort + filters shared by the product list endpoints. */
export interface ProductListOptions {
  sort?: string;       // "newest" | "price_low" | "price_high"
  condition?: string;  // "brand_new" | "like_new" | "good" | "fair"
  minPrice?: string;
  maxPrice?: string;
}

/** Build an additive `?limit=&offset=` query string (omitted when not paging). */
function pageQuery(limit?: number, offset?: number, prefix = "?"): string {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString();
  return qs ? `${prefix}${qs}` : "";
}

/** Like pageQuery but also carries the sort/filter options as query params. */
function listQuery(limit?: number, offset?: number, opts?: ProductListOptions, prefix = "?"): string {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.condition) params.set("condition", opts.condition);
  if (opts?.minPrice) params.set("min_price", opts.minPrice);
  if (opts?.maxPrice) params.set("max_price", opts.maxPrice);
  const qs = params.toString();
  return qs ? `${prefix}${qs}` : "";
}

export function createProduct(formData: FormData) {
  return postAPI("/api/v1/products", formData);
}

export function getAllProducts(limit?: number, offset?: number, opts?: ProductListOptions, init?: RequestInit) {
  return fetchAPI<{ products: ProductCard[] }>(`/api/v1/products${listQuery(limit, offset, opts)}`, init);
}

export function fetchMyProducts(limit = 100, offset = 0) {
  return fetchAPI<{ products: ProductCard[] }>(
    `/api/v1/my-products${pageQuery(limit, offset)}`,
  );
}

export async function searchProducts(query: string, limit?: number, offset?: number, opts?: ProductListOptions, init?: RequestInit) {
  const base = `/api/v1/products/search?q=${encodeURIComponent(query)}`;
  return fetchAPI<{ products: ProductCard[] }>(`${base}${listQuery(limit, offset, opts, "&")}`, init);
}

export function getProductsByCategory(categoryId: string, limit?: number, offset?: number, opts?: ProductListOptions, init?: RequestInit) {
  return fetchAPI<{ products: ProductCard[] }>(
    `/api/v1/categories/${categoryId}/products${listQuery(limit, offset, opts)}`,
    init,
  );
}
