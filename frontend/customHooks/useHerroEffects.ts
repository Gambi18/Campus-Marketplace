import { useState, useEffect } from "react";

export const slides = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80",
];

const typingTexts = [
  "Buy, Sell & Trade",
  "Find Student Deals",
  "Exchange Campus Essentials",
  "Connect With Classmates",
];

export function useHeroEffects() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);

  // Background slider loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Typing effect loop
  useEffect(() => {
    const currentText = typingTexts[textIndex];
    let charIndex = 0;

    const typing = setInterval(() => {
      if (charIndex <= currentText.length) {
        setTypedText(currentText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typing);
        setTimeout(() => {
          setTextIndex((prev) => (prev + 1) % typingTexts.length);
        }, 2000);
      }
    }, 90);

    return () => clearInterval(typing);
  }, [textIndex]);

  return { currentSlide, setCurrentSlide, typedText };
}