"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

interface ReactBitsSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
  showCore?: boolean;
}

const sizeMap = {
  sm: { container: "w-5 h-5", outer: "border-[2px]", inner: "border-[1.5px]", core: "w-1 h-1" },
  md: { container: "w-8 h-8", outer: "border-[2.5px]", inner: "border-[2px]", core: "w-1.5 h-1.5" },
  lg: { container: "w-12 h-12", outer: "border-[3px]", inner: "border-[2px]", core: "w-2.5 h-2.5" },
  xl: { container: "w-16 h-16", outer: "border-[3.5px]", inner: "border-[2.5px]", core: "w-3 h-3" },
};

/**
 * ReactBits-inspired Dual Orbital Quantum Spinner
 * Clean, modern, hardware-accelerated loader with counter-rotating luminous rings.
 */
export function ReactBitsSpinner({
  size = "md",
  className,
  label,
  showCore = true,
}: ReactBitsSpinnerProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("inline-flex flex-col items-center justify-center gap-2.5", className)}>
      <div className={cn("relative flex items-center justify-center", s.container)}>
        {/* Outer Counter-Clockwise Ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-t-indigo-500 border-r-violet-500 border-b-transparent border-l-transparent animate-spin",
            s.outer
          )}
          style={{ animationDuration: "1.1s" }}
        />

        {/* Inner Clockwise Ring */}
        <div
          className={cn(
            "absolute inset-1 rounded-full border-t-transparent border-r-transparent border-b-pink-500 border-l-cyan-400 animate-spin",
            s.inner
          )}
          style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
        />

        {/* Radiant Luminous Core */}
        {showCore && (
          <div
            className={cn(
              "rounded-full bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 animate-ping opacity-75",
              s.core
            )}
            style={{ animationDuration: "1.6s" }}
          />
        )}
      </div>

      {label && (
        <span className="text-xs font-medium tracking-wide text-muted-foreground animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * ReactBits-inspired Button Spinner for inline actions
 */
export function ReactBitsButtonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-4 h-4 mr-2 inline-flex items-center justify-center", className)}>
      <div className="absolute inset-0 rounded-full border-[2px] border-white/30 border-t-white animate-spin" />
      <div className="w-1 h-1 rounded-full bg-white animate-ping opacity-60" />
    </div>
  );
}
