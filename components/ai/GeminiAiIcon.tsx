"use client";

import React, { useId } from "react";

interface AiIconProps {
  className?: string;
  size?: number;
  gradient?: boolean;
}

/**
 * Ultra-Modern Cosmic Neural Nexus AI Icon
 * Features a multi-layered quantum crystal prism with orbital cyber sparks and radiant luminous core.
 * Perfectly harmonizes with MessHub's Deep Indigo & Violet aesthetic.
 */
export function GeminiAiIcon({ className = "", size = 20, gradient = true }: AiIconProps) {
  const uid = useId().replace(/:/g, "_");
  const gradPrimary = `ai-nexus-prim-${size}-${uid}`;
  const gradSecondary = `ai-nexus-sec-${size}-${uid}`;
  const gradCore = `ai-nexus-core-${size}-${uid}`;
  const gradGlow = `ai-nexus-glow-${size}-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Main Spectrum Gradient: Electric Indigo -> Violet -> Magenta / Cyan */}
        <linearGradient id={gradPrimary} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="45%" stopColor="#A855F7" />
          <stop offset="80%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Core Luminous Gradient */}
        <linearGradient id={gradCore} x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#E0E7FF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* Secondary Orbital Spark Arc Gradient */}
        <linearGradient id={gradSecondary} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Radiant Center Glow */}
        <radialGradient id={gradGlow} cx="12" cy="12" r="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#C084FC" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Radiant Ambient Core Glow */}
      <circle cx="12" cy="12" r="5" fill={`url(#${gradGlow})`} />

      {/* Primary 4-Point Curved Quantum Star / Crystal Prism */}
      <path
        d="M12 2C12.35 6.95 16.05 10.65 21 11C16.05 11.35 12.35 15.05 12 20C11.65 15.05 7.95 11.35 3 11C7.95 10.65 11.65 6.95 12 2Z"
        fill={gradient ? `url(#${gradPrimary})` : "currentColor"}
      />

      {/* Inner Glowing Crystal Core Facet */}
      <path
        d="M12 5.5C12.22 8.4 14.6 10.78 17.5 11C14.6 11.22 12.22 13.6 12 16.5C11.78 13.6 9.4 11.22 6.5 11C9.4 10.78 11.78 8.4 12 5.5Z"
        fill={gradient ? `url(#${gradCore})` : "currentColor"}
        opacity={0.92}
      />

      {/* Cyber Orbital Spark Ring 1 (Top-Right Micro Nexus) */}
      <path
        d="M18.5 2.5C18.7 3.8 19.7 4.8 21 5C19.7 5.2 18.7 6.2 18.5 7.5C18.3 6.2 17.3 5.2 16 5C17.3 4.8 18.3 3.8 18.5 2.5Z"
        fill={gradient ? `url(#${gradSecondary})` : "currentColor"}
      />

      {/* Cyber Orbital Spark Ring 2 (Bottom-Left Micro Nexus) */}
      <path
        d="M5.5 16.5C5.7 17.8 6.7 18.8 8 19C6.7 19.2 5.7 20.2 5.5 21.5C5.3 20.2 4.3 19.2 3 19C4.3 18.8 5.3 17.8 5.5 16.5Z"
        fill={gradient ? `url(#${gradSecondary})` : "currentColor"}
      />

      {/* Ultra-bright Diamond Sparkle Core Dot */}
      <circle cx="12" cy="11" r="1.3" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Modern Futuristic AI Robot / Assistant Mascot Avatar Icon
 */
export function ModernAiRobotIcon({ className = "", size = 20 }: AiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect x="3" y="6" width="18" height="14" rx="5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="2" r="1.5" fill="currentColor" />
      <rect x="6" y="9.5" width="12" height="5" rx="2.5" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="#fff" />
      <circle cx="15" cy="12" r="1" fill="#fff" />
      <path d="M2 11V15M22 11V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Iridescent AI Cosmic Orb / Apple Intelligence Style Nexus Icon
 */
export function AiCosmicOrbIcon({ className = "", size = 20 }: AiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="6" fill="currentColor" fillOpacity="0.3" />
      <path
        d="M12 5C12.3 8.5 15.5 11.7 19 12C15.5 12.3 12.3 15.5 12 19C11.7 15.5 8.5 12.3 5 12C8.5 11.7 11.7 8.5 12 5Z"
        fill="currentColor"
      />
    </svg>
  );
}
