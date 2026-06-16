import Button from "@/components/Button"
import Input from "@/components/Input"
import Navbar from "@/components/Navbar"
import registerImage from "../images/college students-rafiki.svg"
import Link from "next/link"
import ContinueWithGoogle from "@/components/ContinueWithGoogle"

function page() {
  return (
    <>
      <Navbar/>
     
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] flex items-center justify-center p-4 md:p-8">
        
        <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-100 shadow-md flex flex-col md:flex-row overflow-hidden">
          
         {/* Left side */}
          <div className="w-full md:w-5/12 bg-[#eef2f7] p-6 lg:p-8 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-slate-200/60">
    
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
            <div className="text-center mt-6 max-w-sm">
              <h4 className="text-base font-bold text-slate-800">Trusted by Thousands of Students</h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                The safest way to trade textbooks, furniture, and electronics with your peers right on campus.
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your CampusMarket account</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">Join your campus marketplace and start buying and selling safely</p>
            
            {/* Standard aligned button wrapping clean SVG identity marker */}
            <Button variant="formLightBlue">
              {/* //continue with gogle */}
              <ContinueWithGoogle/>
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
               <Input label="Phone Number (MTN or Orange)" name="phone" type="tel" placeholder="237XXXXXXXXX"/>
              
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
              Already have an account? <span className="text-blue-600 font-semibold cursor-pointer hover:underline ml-1">
                <Link href="/login">
                Log in
                </Link>
              </span>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}

export default page