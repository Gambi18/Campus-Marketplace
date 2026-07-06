"use client";

import { useState, useEffect } from "react";

const typingTexts = [
  "Buy, Sell & Trade",
  "Find Student Deals",
  "Exchange Campus Essentials",
  "Connect With Classmates",
];

/**
 * The animated hero headline. Isolated into its own component so the typing
 * effect's per-keystroke state updates re-render only this text, not the whole
 * Hero (background images, overlays, dot navigation).
 */
export default function HeroHeadline() {
  const [typedText, setTypedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);

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

  return (
    <span className="text-white">
      {typedText}
      <span className="animate-pulse text-brand-accent">|</span>
    </span>
  );
}
