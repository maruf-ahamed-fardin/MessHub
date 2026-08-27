"use client";

import { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
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
      {/* 1. Floating Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 print:hidden select-none">
        <button
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
          className={cn(
            "group relative flex items-center justify-center gap-2 rounded-full p-3 md:px-4 md:py-3 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/40 cursor-pointer active:scale-95",
            isOpen
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rotate-90"
              : "bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white hover:scale-105"
          )}
          aria-label={t("MessMate AI Assistant খুলুন", "Open MessMate AI Assistant")}
        >
          {/* Subtle Outer Glow Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-40 blur-xs group-hover:opacity-75 transition duration-300 -z-10 animate-pulse" />

          {isOpen ? (
            <X size={22} className="rotate-0" />
          ) : (
            <>
              <div className="relative">
                <GeminiAiIcon size={21} className="text-amber-300 animate-pulse drop-shadow-sm" />
              </div>
              <span className="font-extrabold text-xs tracking-wide hidden md:inline-block">
                MessMate AI
              </span>
            </>
          )}

          {/* New / Online Sparkle Dot */}
          {!isOpen && !hasInteracted && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </span>
          )}
        </button>
      </div>

      {/* 2. Chat Window Container */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
          />

          {/* Desktop Floating Card / Mobile Bottom Sheet */}
          <div
            className={cn(
              "fixed z-50 overflow-hidden shadow-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300",
              // Mobile: Full drawer / bottom modal
              "inset-x-2 bottom-2 top-14 rounded-3xl md:top-auto md:inset-x-auto",
              // Desktop: Floating popup card bottom-right
              "md:bottom-20 md:right-6 md:w-[420px] md:h-[620px] md:rounded-3xl md:border-2 md:border-violet-500/20",
              "animate-in zoom-in-95 fade-in duration-200"
            )}
          >
            <AIAssistantChat
              onClose={() => setIsOpen(false)}
              userName={user?.name ?? undefined}
            />
          </div>
        </>
      )}
    </>
  );
}
