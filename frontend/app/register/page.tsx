import Button from "@/components/Button"
import Input from "@/components/Input"
import Navbar from "@/components/Navbar"
import registerImage from "../images/college students-rafiki.svg"

function page() {
  return (
    <>
      <Navbar/>
      {/* Background container spanning full viewport minus navbar height roughly */}
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] flex items-center justify-center p-4 md:p-8">
        
        {/* Core Card Layout */}
        <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-100 shadow-md flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT COLUMN: Beautiful tinted purple-blue gray background with floating inner card */}
          <div className="w-full md:w-5/12 bg-[#eef2f7] p-6 lg:p-8 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-slate-200/60">
            
            {/* The crisp white inner floating card asset container */}
            <div className="w-full bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Student Marketplace</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Signup</p>
              
              <div className="w-full max-w-[220px] py-2">
                <img 
                  src={registerImage.src || registerImage} 
                  alt="Sign up illustration" 
                  className="w-full h-auto object-contain mx-auto" 
                />
              </div>

              <button type="button" className="mt-2 bg-[#2563eb] text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm shadow-blue-200">
                Join Now
              </button>
            </div>

            {/* Typography Section below card */}
            <div className="text-center mt-6 max-w-sm">
              <h4 className="text-base font-bold text-slate-800">Trusted by Thousands of Students</h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                The safest way to trade textbooks, furniture, and electronics with your peers right on campus.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Form block containing authentication elements */}
          <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your CampusMarket account</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">Join your campus marketplace and start buying and selling safely</p>
            
            {/* Standard aligned button wrapping clean SVG identity marker */}
            <Button variant="formLightBlue">
              <span className="text-xs font-semibold py-1.5 flex items-center justify-center gap-2 w-full text-slate-700">
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.78 2.93c.9-2.69 3.43-4.39 6.72-4.39z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44a5.5 5.5 0 0 1-2.39 3.61l3.72 2.89c2.18-2.01 3.44-4.96 3.44-8.6z"/>
                  <path fill="#FBBC05" d="M5.28 14.57a7.15 7.15 0 0 1 0-4.14L1.5 7.5a11.962 11.962 0 0 0 0 9l3.78-2.93z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.72-2.89c-1.04.7-2.37 1.11-4.24 1.11-3.29 0-5.82-1.7-6.72-4.39L1.5 16.85C3.4 20.35 7.35 23 12 23z"/>
                </svg>
                Continue with Google
              </span>
            </Button>

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or sign up with email</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="space-y-3.5">
                 <Input label="Username" name="username" placeholder="john_doe"/>
              <Input label="Full Name" name="name" placeholder="John Doe"/>
              <Input label="Email" type="email" name="email" placeholder="name@gmail.com"/>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Password" name="password" type="password" placeholder="........"/>
                <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="........"/>
              </div>
            </div>

            <div className="flex items-start gap-2 mt-5 mb-6">
              <input type="checkbox" id="terms-agreement" className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
              <label htmlFor="terms-agreement" className="text-xs text-slate-500 select-none">
                I agree to the <span className="text-blue-600 cursor-pointer hover:underline font-medium">Terms of Service</span> and <span className="text-blue-600 cursor-pointer hover:underline font-medium">Privacy Policy</span>.
              </label>
            </div>

            <Button type="submit" variant="form">
              <span className="font-semibold py-1 block w-full text-center">Create Account</span>
            </Button>

            {/* Navigation redirect option */}
            <p className="text-center text-xs text-slate-500 mt-5">
              Already have an account? <span className="text-blue-600 font-semibold cursor-pointer hover:underline ml-1">Log in</span>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}

export default page