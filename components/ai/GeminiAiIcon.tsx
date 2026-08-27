"use client";

import React from "react";

interface AiIconProps {
  className?: string;
  size?: number;
  gradient?: boolean;
}

/**
 * Ultra-Modern Electric Cyan & Emerald Quantum AI Icon
 * Features a dynamic 4-point faceted diamond crystal core with satellite quantum sparks.
 */
export function GeminiAiIcon({ className = "", size = 20, gradient = false }: AiIconProps) {
  const gradId = `ai-electric-grad-${size}`;
  const coreGradId = `ai-core-grad-${size}`;

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
        <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id={coreGradId} x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>

      {/* Outer Quantum Wave Orbits */}
      <path
        d="M12 2C12.4 6.8 16.2 10.6 21 11C16.2 11.4 12.4 15.2 12 20C11.6 15.2 7.8 11.4 3 11C7.8 10.6 11.6 6.8 12 2Z"
        fill={gradient ? `url(#${gradId})` : "currentColor"}
      />

      {/* Inner Glowing Crystal Core */}
      <path
        d="M12 6C12.2 8.8 14.2 10.8 17 11C14.2 11.2 12.2 13.2 12 16C11.8 13.2 9.8 11.2 7 11C9.8 10.8 11.8 8.8 12 6Z"
        fill={gradient ? `url(#${coreGradId})` : "currentColor"}
        opacity={0.9}
      />

      {/* Top-Right Quantum Spark */}
      <path
        d="M19.5 2C19.7 3.6 21 4.9 22.5 5C21 5.1 19.7 6.4 19.5 8C19.3 6.4 18 5.1 16.5 5C18 4.9 19.3 3.6 19.5 2Z"
        fill={gradient ? `url(#${gradId})` : "currentColor"}
      />

      {/* Bottom-Left Quantum Spark */}
      <path
        d="M4.5 15C4.7 16.6 6 17.9 7.5 18C6 18.1 4.7 19.4 4.5 21C4.3 19.4 3 18.1 1.5 18C3 17.9 4.3 16.6 4.5 15Z"
        fill={gradient ? `url(#${gradId})` : "currentColor"}
      />

      {/* Center Quantum Dot */}
      <circle cx="12" cy="11" r="1.2" fill="#FFFFFF" />
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
