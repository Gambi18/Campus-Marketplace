import { postAPI } from "../app/utils/api";

export function createProduct(formData: FormData) {
  return postAPI("/api/v1/products", formData);
}