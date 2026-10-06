"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  glowSize?: number;
  interactive?: boolean;
}

/**
 * ReactBits-inspired Spotlight Glass Card
 * Features an interactive radial spotlight following cursor/touch, frosted glass backdrop,
 * and high-contrast glowing border strokes.
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(99, 102, 241, 0.18)",
  glowSize = 350,
  interactive = true,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current || !interactive) return;
      const rect = divRef.current.getBoundingClientRect();
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [interactive]
  );

  const handleMouseEnter = useCallback(() => {
    if (interactive) setOpacity(1);
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    if (interactive) setOpacity(0);
  }, [interactive]);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-300 shadow-sm hover:shadow-md",
        className
      )}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      {interactive && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            opacity,
            background: `radial-gradient(${glowSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
          }}
        />
      )}

      {/* Surface Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
