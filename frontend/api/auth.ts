import { postAPI } from "../app/utils/api";

export function registerStudent(formData: FormData) {
  return postAPI("/api/v1/auth/register", formData);
}

export function loginStudent(email: string, password: string) {
  return postAPI("/api/v1/auth/login", { email, password });
}