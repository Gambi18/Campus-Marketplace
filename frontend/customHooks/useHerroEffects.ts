import { useState, useEffect } from "react";

export const slides = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80",
];

// Only the background slider lives here. The typing effect was moved into
// <HeroHeadline/> so its per-keystroke state updates don't re-render the whole
// Hero (images, overlays, dot nav) — just the headline.
export function useHeroEffects() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return { currentSlide, setCurrentSlide };
}
