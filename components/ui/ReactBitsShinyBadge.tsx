"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

interface ShinyBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "indigo" | "amber" | "emerald" | "purple" | "rose" | "cyan";
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-indigo-500/10",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-amber-500/10",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-purple-500/10",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-rose-500/10",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shadow-cyan-500/10",
};

/**
 * ReactBits-inspired Shimmering Pill Badge
 * Subtle moving gradient reflection and glowing shadow.
 */
export function ShinyBadge({
  children,
  icon,
  variant = "indigo",
  className,
  onClick,
}: ShinyBadgeProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border backdrop-blur-md overflow-hidden shadow-sm transition-all duration-200 select-none",
        variantStyles[variant],
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        className
      )}
    >
      {/* Shimmer sweep animation overlay */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-reactbits-shimmer opacity-40 bg-gradient-to-r from-transparent via-white to-transparent" />

      {icon && <span className="shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </div>
  );
}
