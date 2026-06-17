"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Eye, LogIn } from 'lucide-react';
import Button from "@/components/Button";
import Input from "@/components/Input";
import registerImage from "../images/college students-rafiki.svg";
import { useRouter } from 'next/navigation';
import { loginStudent } from '../utils/authApi';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (loading) return;

    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const response: any = await loginStudent(email, password);

      if (response && response.token) {
        localStorage.setItem("token", response.token);
        router.push("/");
      } else {
        setError("Login failed: invalid server response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc]">

      {/* LEFT COLUMN: Image Showcase Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 flex-col items-center justify-center p-12 relative border-r border-gray-100">
        <div className="max-w-md text-center space-y-8 z-10">

          {/* Floating White Showcase Card Asset */}
          <div className="w-full bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/40 border border-gray-100 flex flex-col items-center">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Student Marketplace Signup
            </h3>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1 mb-4">
              Signup
            </span>

            <div className="w-full max-w-[240px] py-2">
              <img
                src={registerImage.src || registerImage}
                alt="Students collaborating"
                className="w-full h-auto object-contain mx-auto"
              />
            </div>

            <Button variant="primary" size="sm" className="mt-4 px-6 rounded-lg font-semibold shadow-sm shadow-blue-200" onClick={() => router.push('/register')}>
              Join Now
            </Button>
          </div>

          <div className="space-y-3 px-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              The Smartest Way to Trade on Campus
            </h2>
            <p className="text-gray-500 leading-relaxed text-sm">
              Join 15,000+ students buying and selling textbooks, furniture, and electronics daily with verified safe exchanges.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">

          {/* Brand Header */}
          <div className="flex items-center gap-2 text-brand-primary font-bold text-lg select-none">
            <LogIn className="w-5 h-5 text-brand-primary" strokeWidth={2.5} />
            <span>CampusMarket</span>
          </div>

          {/* Login Card Wrapper */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-slate-100/50">
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-sm text-gray-400">Login to access your campus marketplace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <Input
                label="Email Address"
                type="email"
                name="email"
                required
                placeholder="your.name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />


                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-3.5 text-gray-400 hover:text-gray-600 cursor-pointer outline-none focus:text-brand-primary"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}


              <Button type="submit" variant="form" size="lg" className="w-full pt-3" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

            </form>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-brand-primary hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}