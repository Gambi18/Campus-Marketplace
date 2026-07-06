"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Button from "@/components/Button";
import Input from "@/components/Input";
import registerImage from "../images/college students-rafiki.svg";
import { useRouter, useSearchParams } from 'next/navigation';
import { loginStudent } from '../utils/authApi';
import { setCookie } from '../utils/cookie';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
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
      const response = await loginStudent(email, password) as { token: string; user: { id: string } };

      if (response && response.token) {
        localStorage.setItem("token", response.token);
        // Also mirror the token into a cookie so Next.js middleware (which cannot
        // read localStorage) can gate protected routes server-side.
        setCookie("token", response.token);
        if (response.user?.id) localStorage.setItem("user_id", response.user.id);
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
    <div className="min-h-screen w-full flex bg-surface-page">

      {/* LEFT COLUMN: brand showcase (single layer, no nested card) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-tertiary flex-col items-center justify-center p-12 border-r border-gray-100">
        <div className="max-w-md text-center space-y-8">
          <div className="w-full max-w-[280px] mx-auto">
            {/* Local static SVG illustration — next/image doesn't optimize SVG, so a plain img is correct here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={registerImage.src || registerImage}
              alt="Students collaborating"
              className="w-full h-auto object-contain mx-auto"
            />
          </div>

          <div className="space-y-3">
            <p className="font-display text-3xl font-bold text-brand-neutral tracking-tight">
              The smart way to trade on campus
            </p>
            <p className="text-text-body leading-relaxed">
              Buy and sell textbooks, furniture and electronics with students you can trust — payments held safely until you confirm.
            </p>
          </div>

          <Button variant="primary" size="lg" onClick={() => router.push('/register')}>
            Create an account
          </Button>
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

          {/* Registration success banner */}
          {registered && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
              Account created successfully! Your registration is pending admin verification. You will be able to log in once approved.
            </div>
          )}

          {/* Login Card Wrapper */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-slate-100/50">
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-sm text-gray-500">Login to access your campus marketplace</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">

              <Input
                label="Email Address"
                type="email"
                name="email"
                required
                autoComplete="email"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:text-brand-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}


              <Button type="submit" variant="form" size="lg" className="w-full pt-3" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

            </form>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-brand-primary hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex bg-surface-page items-center justify-center"><p className="text-text-muted">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}