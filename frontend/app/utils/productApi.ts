import { postAPI, fetchAPI } from "./api";
import type { ProductCard } from "../types";

export function createProduct(formData: FormData) {
  return postAPI("/api/v1/products", formData);
}

export function fetchProducts() {
  return fetchAPI<{ products: ProductCard[] }>("/api/v1/products");
}

export function fetchMyProducts() {
  return fetchAPI<{ products: ProductCard[] }>("/api/v1/my-products");
}
