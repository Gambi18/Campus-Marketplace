"use client";

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import Button from "./Button"

function Hero() {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-brand-primary to-purple-600 min-h-[400px] md:min-h-[500px] flex flex-col justify-center items-center p-8 md:p-20 text-white">
       <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-xs font-medium mb-6">
        <span className="w-4 h-4 bg-white text-purple-600 rounded-full flex items-center justify-center">
          <Check className="w-2.5 h-2.5" strokeWidth={3} aria-hidden="true" />
        </span>
        <span>Trusted by 5,000+ students across campus</span>
      </div>
        <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl text-center">Buy & Sell Safely Within Your Campus <br className="hidden sm:inline" />Community</h2>
        <p className="text-white/80 text-sm md:text-lg max-w-2xl mb-8 leading-relaxed">
            Discover affordable deals and secondhand essentials from classmates.
            List what you do not need and pick up what you do—all in one peer-to-peer campus marketplace.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 p-4">
            <Button variant="secondary" onClick={() => router.push('/')}><span>Start Browsing</span></Button>
            <Button variant="outlined" onClick={() => router.push('/sell')}><span>Sell an Item</span></Button>
        </div>
        
    </div>
  )
}

export default Hero
