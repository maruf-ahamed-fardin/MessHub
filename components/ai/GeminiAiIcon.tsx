"use client";

import React from "react";

interface GeminiSparkleIconProps {
  className?: string;
  size?: number;
}

/**
 * Authentic Google Gemini & AI 4-Pointed Sparkle Star Icon
 * Matches the glowing star with satellite dot shown in the design specification.
 */
export function GeminiAiIcon({ className = "", size = 20 }: GeminiSparkleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Central 4-pointed curved star */}
      <path
        d="M12 2C12.3 6.8 16.2 10.7 21 11C16.2 11.3 12.3 15.2 12 20C11.7 15.2 7.8 11.3 3 11C7.8 10.7 11.7 6.8 12 2Z"
        fill="currentColor"
      />
      {/* Top right mini star / plus dot */}
      <path
        d="M19.5 3C19.7 4.2 20.8 5.3 22 5.5C20.8 5.7 19.7 6.8 19.5 8C19.3 6.8 18.2 5.7 17 5.5C18.2 5.3 19.3 4.2 19.5 3Z"
        fill="currentColor"
      />
      {/* Bottom left accent satellite dot */}
      <circle cx="5" cy="18" r="1.8" fill="currentColor" />
    </svg>
  );
}

/**
 * Text-based "AI" badge icon with stylized font
 */
export function AITextBadge({ className = "", size = 18 }: { className?: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-[9px] text-white shadow-xs select-none ${className}`}
    >
      AI
    </div>
  );
}
