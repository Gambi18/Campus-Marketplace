"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, LogIn } from 'lucide-react';
import Button from "@/components/Button";
import Input from "@/components/Input";
import registerImage from "../images/college students-rafiki.svg";
import { useRouter } from 'next/navigation';
import { loginStudent } from '../../api/auth';

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
      const response : any = await loginStudent(email, password);

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

            <Button variant="primary" size="sm" className="mt-4 px-6 rounded-lg font-semibold shadow-sm shadow-blue-200">
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
                
                <div className="absolute top-0 right-0 h-5 flex items-center">
                  <Link href="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-3.5 text-gray-400 hover:text-gray-600 cursor-pointer outline-none focus:text-brand-primary"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
               {error && <p className="text-sm text-red-600">{error}</p>}


              <Button type="submit" variant="form" size="lg" className="w-full pt-3" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-100" />
                <span className="flex-shrink mx-4 text-[10px] tracking-wider font-bold text-gray-400 uppercase">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-gray-100" />
              </div>

              {/* Clean Google integration button utilizing flat vector design */}
              <Button type="button" variant="formLightBlue" size="lg" className="w-full">
                <span className="flex items-center justify-center gap-2 font-semibold text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.14 0-5.8-2.11-6.75-4.96H1.31v3.15C3.29 22.35 7.43 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.25 14.24A7.18 7.18 0 0 1 4.85 12c0-.79.13-1.57.38-2.31V6.54H1.31A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.25 5.37l3.9-3.13z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.43 0 3.29 1.65 1.31 5.66l3.9 3.13c.95-2.85 3.61-4.96 12-4.96z"/>
                  </svg>
                  <span>Continue with Google</span>
                </span>
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