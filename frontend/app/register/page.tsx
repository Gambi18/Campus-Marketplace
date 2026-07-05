"use client"

import { useState } from 'react'
import Button from "@/components/Button"
import Input from "@/components/Input"
import registerImage from "../images/college students-rafiki.svg"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useRegister } from "../../customHooks/useRegister"

export default function RegisterPage() {
  const {
    fullName, setFullName,
    username, setUsername,
    email, setEmail,
    phoneNumber, setPhoneNumber,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    setStudentIdFile,
    loading, error,
    handleSubmit,
  } = useRegister()

  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="min-h-screen w-full flex bg-surface-page">

      {/* LEFT COLUMN */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 flex-col items-center justify-center p-12 relative border-r border-gray-100">
        <div className="max-w-md text-center space-y-8 z-10">

          <div className="w-full bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/40 border border-gray-100 flex flex-col items-center">
            <p className="text-xl font-bold text-slate-800 tracking-tight">
              Student Marketplace
            </p>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1 mb-4">
              Signup
            </span>

            <div className="w-full max-w-[240px] py-2">
              {/* Local static SVG illustration — next/image doesn't optimize SVG, so a plain img is correct here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={registerImage.src || registerImage}
                alt="Students collaborating"
                className="w-full h-auto object-contain mx-auto"
              />
            </div>

            <Button variant="primary" size="sm" className="mt-4 px-6 rounded-lg font-semibold shadow-sm shadow-blue-200" onClick={() => router.push('/login')}>
              Log in
            </Button>
          </div>

          <div className="space-y-3 px-4">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              The Smartest Way to Trade on Campus
            </p>
            <p className="text-gray-500 leading-relaxed text-sm">
              Buy and sell textbooks, furniture and electronics with students you can trust — payments held safely until you confirm.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">

          <div className="flex items-center gap-2 text-brand-primary font-bold text-lg select-none">
            <UserPlus className="w-5 h-5 text-brand-primary" strokeWidth={2.5} />
            <span>CampusMarket</span>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-slate-100/50">
            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-sm text-gray-500">Join your campus marketplace and start buying and selling safely</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-3.5">
              <Input required label="Username" disabled={loading} name="username" autoComplete="username" value={username} placeholder="john_doe" onChange={(e) => setUsername(e.target.value)} />
              <Input required label="Full Name" disabled={loading} name="name" autoComplete="name" value={fullName} placeholder="John Doe" onChange={(e) => setFullName(e.target.value)} />
              <Input required label="Email" disabled={loading} type="email" name="email" autoComplete="email" value={email} placeholder="name@university.edu" onChange={(e) => setEmail(e.target.value)} />
<Input label="Phone Number (MTN or Orange)" name="phone" type="tel" autoComplete="tel" value={phoneNumber} required={true} placeholder="XXXXXXXXX (9-digit number)" helperText="237 will be added automatically" onChange={(e) => setPhoneNumber(e.target.value)} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input required label="Password" disabled={loading} name="password" autoComplete="new-password" value={password} type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
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
                <div className="relative">
                  <Input required label="Confirm Password" disabled={loading} name="confirmPassword" autoComplete="new-password" value={confirmPassword} type={showConfirm ? "text" : "password"} placeholder="••••••••" onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    aria-pressed={showConfirm}
                    className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:text-brand-primary"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="student-id" className="block text-sm font-semibold text-brand-neutral">Student ID</label>
                <input
                  id="student-id"
                  type="file"
                  required
                  disabled={loading}
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setStudentIdFile(file)
                  }}
                  className="w-full text-sm text-slate-700 border border-gray-200 rounded-lg p-3 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

              <Button type="submit" variant="form" size="lg" className="w-full pt-3" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-primary hover:underline">
              Log in
            </Link>
          </p>

        </div>
      </div>

    </div>
  )
}
