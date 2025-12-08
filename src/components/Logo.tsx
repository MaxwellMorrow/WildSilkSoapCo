"use client";

import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { image: "w-12 h-12", text: "text-lg" },
  md: { image: "w-16 h-16 sm:w-20 sm:h-20", text: "text-2xl" },
  lg: { image: "w-24 h-24 sm:w-32 sm:h-32", text: "text-3xl sm:text-4xl" },
};

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("/logo.png");

  const handleError = () => {
    if (currentSrc.endsWith('.png')) {
      setCurrentSrc('/logo.svg');
    } else if (currentSrc.endsWith('.svg')) {
      setCurrentSrc('/logo.jpg');
    } else {
      setImageError(true);
    }
  };

  const sizes = size === "sm" ? "48px" : size === "md" ? "(max-width: 640px) 64px, 80px" : "128px";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeMap[size].image} flex-shrink-0`}>
        {!imageError ? (
          <Image
            src={currentSrc}
            alt="Wild Silk Soap Co."
            fill
            className="object-contain"
            priority={size === "md"}
            sizes={sizes}
            onError={handleError}
          />
        ) : (
          <div className="w-full h-full border-2 border-sage-darkest rounded-full flex items-center justify-center">
            <span className="text-sage-darkest font-bold text-xl font-script">W</span>
          </div>
        )}
      </div>
      {showText && (
        <div className="hidden sm:block">
          <h1 className={`font-script ${sizeMap[size].text} font-medium text-sage-darkest leading-tight`}>
            Wild Silk Soap Co.
          </h1>
          <p className="text-[10px] text-charcoal-light uppercase tracking-wider -mt-1 font-display">
            Hand Poured • Skin Loving
          </p>
        </div>
      )}
    </div>
  );
}

