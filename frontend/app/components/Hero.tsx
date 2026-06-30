
"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "./Button";
import { useHeroEffects, slides } from "../../customHooks/useHerroEffects"; 
import {
  ArrowRight,
 
} from "lucide-react";

export default function Hero() {
  const router = useRouter();
  const { currentSlide, setCurrentSlide, typedText } = useHeroEffects();

  return (
    <section className="relative min-h-screen overflow-hidden text-white">
      
      {/* Background Images */}
      <div className="absolute inset-0">
        {slides.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Gradients & Background Overlays */}
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#24304e]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/20 blur-[140px]" />

    
      {/* Hero Content Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-5xl w-full text-center">
          
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl px-4 py-2 rounded-full text-sm text-blue-300">
            Trusted by 5,000+ students across campus
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-5 text-5xl md:text-7xl font-extrabold leading-[1.05]"
          >
            <span className="text-white">
              {typedText}
              <span className="animate-pulse text-blue-500">|</span>
            </span>
            <br />
            <span className="text-blue-500">Within Your Campus Community</span>
          </motion.h1>

          <p className="mt-5 text-lg md:text-xl text-slate-200 max-w-3xl mx-auto">
            Discover affordable textbooks, electronics, furniture and more from fellow students. 
            List what you no longer need and find amazing deals from classmates you trust.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button variant="primary" size="lg" onClick={() => document.getElementById('product_listings')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="flex items-center gap-2">
                Browse Marketplace
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>

            <Button
              variant="outlined"
              size="lg"
              className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10"
              onClick={() => router.push("/sell")}
            >
              Start Selling
            </Button>
          </div>

          {/* Slider Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={currentSlide === index ? 'true' : undefined}
                className="min-h-[44px] px-1 flex items-center justify-center"
              >
                <span className={`block rounded-full transition-all duration-300 ${
                  currentSlide === index ? "w-8 h-2 bg-blue-500" : "w-2 h-2 bg-white/40"
                }`} />
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}