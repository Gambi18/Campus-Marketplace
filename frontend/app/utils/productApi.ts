import { postAPI, fetchAPI } from "./api";
import type { ProductCard } from "../types";

export function createProduct(formData: FormData) {
  return postAPI("/api/v1/products", formData);
}

export function getAllProducts() {
  return fetchAPI<{ products: ProductCard[] }>("/api/v1/products");
}

export function fetchMyProducts() {
  return fetchAPI<{ products: ProductCard[] }>("/api/v1/my-products");
}

export async function searchProducts(query: string) {
  const endpoint = `/api/v1/products/search?q=${encodeURIComponent(query)}`;
  return fetchAPI<{ products: ProductCard[] }>(endpoint);
}

export function getProductsByCategory(categoryId: string) {
  return fetchAPI<{ products: ProductCard[] }>(
    `/api/v1/categories/${categoryId}/products`
  );
}