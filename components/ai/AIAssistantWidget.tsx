"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AIAssistantChat } from "./AIAssistantChat";
import { GeminiAiIcon } from "./GeminiAiIcon";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface AIAssistantWidgetProps {
  user?: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  };
}

export function AIAssistantWidget({ user }: AIAssistantWidgetProps) {
  const { t } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
  };

  return (
    <>
      {/* 1. Floating Trigger Button with Refined Indigo-Violet Cosmic Breathing Aura */}
      <div className="fixed bottom-[96px] sm:bottom-24 md:bottom-6 right-3.5 md:right-6 z-50 print:hidden select-none">
        <button
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
          className={cn(
            "group relative flex items-center justify-center rounded-full w-12 h-12 md:w-14 md:h-14 transition-all duration-300 shadow-[0_4px_24px_rgba(99,102,241,0.45)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.65)] cursor-pointer active:scale-95 border border-indigo-200/40 dark:border-indigo-400/30",
            isOpen
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rotate-90"
              : "bg-gradient-to-tr from-indigo-600 via-primary to-violet-600 dark:from-indigo-600 dark:via-purple-600 dark:to-violet-700 text-white hover:scale-110"
          )}
          aria-label={t("MessMate AI Assistant খুলুন", "Open MessMate AI Assistant")}
        >
          {/* Layer 1: Ambient Pulsing Outer Glow Aura (Deep Indigo & Violet) */}
          <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-40 blur-md animate-pulse -z-20 transition-opacity" />

          {/* Layer 2: Tight Shimmer Border Glow */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-indigo-400 via-violet-400 to-fuchsia-400 opacity-60 blur-[2px] group-hover:opacity-100 transition duration-300 -z-10 animate-pulse" />

          {isOpen ? (
            <X size={22} className="rotate-0 transition-transform" />
          ) : (
            <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <GeminiAiIcon size={26} gradient={true} className="animate-pulse drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
            </div>
          )}

          {/* Floating Tooltip on Desktop Hover */}
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-x-1 group-hover:translate-x-0 hidden md:flex items-center gap-1.5 z-50">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>MessMate AI</span>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900/95 dark:bg-slate-800/95 rotate-45 border-t border-r border-white/10" />
          </div>

          {/* New / Online Sparkle Dot */}
          {!isOpen && !hasInteracted && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500 border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            </span>
          )}
        </button>
      </div>

      {/* 2. Unique Dynamic AI Floating Pod (Docked comfortably above bottom nav) */}
      {isOpen && (
        <>
          {/* Universal Backdrop (Closes on outside click/touch on both mobile & desktop) */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 animate-in fade-in duration-200"
            aria-label="Close Assistant"
          />

          {/* Floating AI Pod Card */}
          <div
            className={cn(
              "fixed z-50 overflow-hidden shadow-[0_20px_60px_-15px_rgba(99,102,241,0.35)] border-2 border-indigo-500/30 dark:border-indigo-500/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl transition-all duration-300 flex flex-col rounded-3xl",
              // Mobile: Floats comfortably above bottom nav with expanded spacious height
              "bottom-[94px] sm:bottom-24 right-2 left-2 sm:left-auto sm:right-4 w-[calc(100vw-16px)] sm:w-[390px] h-[620px] max-h-[82vh]",
              // Desktop: Floating popup card bottom-right
              "md:bottom-20 md:right-6 md:w-[420px] md:h-[650px] md:max-h-[86vh]",
              "animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 ease-out"
            )}
          >
            <AIAssistantChat
              onClose={() => setIsOpen(false)}
              user={user}
              userName={user?.name ?? undefined}
            />
          </div>
        </>
      )}
    </>
  );
}
