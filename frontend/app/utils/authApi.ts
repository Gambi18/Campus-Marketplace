import { postAPI, fetchAPI } from "./api";

export function registerStudent(formData: FormData) {
  return postAPI("/api/v1/auth/register", formData);
}

export function loginStudent(email: string, password: string) {
  return postAPI("/api/v1/auth/login", { email, password });
}

export function getProfile() {
  return fetchAPI<{
    id: string;
    username: string;
    email: string;
    full_name: string;
    phone_number: string;
    account_status: string;
    is_verified: boolean;
    created_at: string;
  }>("/api/v1/profile");
}
