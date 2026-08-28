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
            "group relative flex items-center justify-center gap-2 rounded-2xl md:rounded-full w-12 h-12 md:w-auto md:h-auto p-0 md:px-4 md:py-2.5 transition-all duration-300 shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_32px_rgba(139,92,246,0.6)] cursor-pointer active:scale-95 border border-indigo-300/40 dark:border-indigo-400/30",
            isOpen
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rotate-90"
              : "bg-gradient-to-tr from-indigo-600 via-primary to-violet-600 dark:from-indigo-600 dark:via-purple-600 dark:to-violet-700 text-white hover:scale-105"
          )}
          aria-label={t("MessMate AI Assistant খুলুন", "Open MessMate AI Assistant")}
        >
          {/* Layer 1: Ambient Pulsing Outer Glow Aura (Deep Indigo & Violet) */}
          <span className="absolute -inset-2 rounded-3xl md:rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-40 blur-md animate-pulse -z-20 transition-opacity" />

          {/* Layer 2: Tight Shimmer Border Glow */}
          <span className="absolute -inset-0.5 rounded-2xl md:rounded-full bg-gradient-to-tr from-indigo-400 via-violet-400 to-fuchsia-400 opacity-60 blur-[2px] group-hover:opacity-100 transition duration-300 -z-10 animate-pulse" />

          {isOpen ? (
            <X size={20} className="rotate-0" />
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <GeminiAiIcon size={21} gradient={true} className="animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.85)]" />
              </div>
              <span className="font-extrabold text-xs tracking-wide hidden md:inline-block bg-gradient-to-r from-white via-indigo-100 to-violet-200 bg-clip-text text-transparent drop-shadow-xs">
                MessMate AI
              </span>
            </>
          )}

          {/* New / Online Sparkle Dot */}
          {!isOpen && !hasInteracted && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500 border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
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
