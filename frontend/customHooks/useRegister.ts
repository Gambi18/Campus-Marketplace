"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerStudent } from "../app/utils/authApi";

export function useRegister() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const validateForm = (): boolean => {
  if (!username.trim()) {
    setError("Username is required");
    return false;
  }

  if (username.trim().length < 3) {
    setError("Username must be at least 3 characters");
    return false;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    setError("Username may only contain letters, numbers, and underscores");
    return false;
  }

  if (!email.trim()) {
    setError("Email is required");
    return false;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    setError("Please enter a valid email address");
    return false;
  }

  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    return false;
  }

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return false;
  }

  if (!studentIdFile) {
    setError("Student ID is required");
    return false;
  }

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(studentIdFile.type)) {
    setError("Student ID must be a JPG, PNG, or PDF file");
    return false;
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (studentIdFile.size > maxSize) {
    setError("Student ID file must be smaller than 5 MB");
    return false;
  }

  return true;
};



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form event listener active");
    if (loading) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!studentIdFile) {
      setError("Student ID is required");
      return;
    }

     if (!validateForm()) {
    return;
  }

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("student_id", studentIdFile);

    setLoading(true);
    try {
      await registerStudent(formData);
      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    fullName, setFullName,
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    studentIdFile, setStudentIdFile,
    loading, error,
    handleSubmit,
  };
}

