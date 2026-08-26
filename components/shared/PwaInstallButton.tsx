"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Check, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface PwaInstallButtonProps {
  variant?: "topbar" | "card" | "banner" | "button";
  className?: string;
}

export function PwaInstallButton({ variant = "topbar", className }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = usePreferences();

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      alert(t("ব্রাউজারের মেনু (⋮) থেকে 'Install App / Add to Home screen' চাপুন।", "Open browser menu (⋮) and tap 'Install App / Add to Home screen'."));
    }
  };

  if (isInstalled) {
    if (variant === "card") {
      return (
        <div className={cn("bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-2xs", className)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">{t("অ্যাপ ইনস্টল করা আছে ✓", "App Installed ✓")}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{t("MessHub অ্যাপটি আপনার ডিভাইসে যুক্ত রয়েছে", "MessHub is installed on your device")}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // 1. TopBar Variant
  if (variant === "topbar") {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={cn(
            "hidden sm:flex h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-primary to-purple-600 text-white font-bold text-xs items-center gap-1.5 shadow-2xs hover:shadow-xs hover:scale-102 active:scale-95 transition-all cursor-pointer select-none",
            className
          )}
          title={t("MessHub অ্যাপ ডাউনলোড করুন", "Download MessHub App")}
        >
          <Download size={14} className="animate-bounce" />
          <span>{t("অ্যাপ ডাউনলোড", "Install App")}</span>
        </button>

        {/* iOS Install Guide Popup */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-slate-800 text-center relative animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-slate-100">{t("iPhone / iPad এ অ্যাপ ইনস্টল", "Install on iPhone / iPad")}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t(
                    "Safari ব্রাউজারের নিচে থাকা Share বাটনে চাপ দিন এবং \"Add to Home Screen\" সিলেক্ট করুন।",
                    "Tap the Safari Share button below and choose \"Add to Home Screen\"."
                  )}
                </p>
              </div>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="w-full bg-primary text-white rounded-xl text-xs font-bold"
              >
                {t("বুঝেছি", "Got it")}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // 2. Card Variant
  if (variant === "card") {
    return (
      <>
        <div
          onClick={handleInstallClick}
          className={cn(
            "bg-gradient-to-r from-indigo-600 via-primary to-purple-600 rounded-2xl px-4 py-3 text-white flex items-center justify-between gap-3 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer select-none",
            className
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Download size={16} className="animate-bounce" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-black text-xs sm:text-sm text-white truncate">MessHub App</h4>
              <span className="text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-md shrink-0">
                PWA
              </span>
            </div>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-700 font-black text-xs shrink-0 shadow-xs hover:bg-white/90 active:scale-95 transition-all"
          >
            {t("ইনস্টল", "Install")}
          </button>
        </div>

        {/* iOS Install Guide Popup */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-slate-800 text-center relative animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-slate-100">{t("iPhone / iPad এ অ্যাপ ইনস্টল", "Install on iPhone / iPad")}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t(
                    "Safari ব্রাউজারের নিচে থাকা Share বাটনে চাপ দিন এবং \"Add to Home Screen\" সিলেক্ট করুন।",
                    "Tap the Safari Share button below and choose \"Add to Home Screen\"."
                  )}
                </p>
              </div>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="w-full bg-primary text-white rounded-xl text-xs font-bold"
              >
                {t("বুঝেছি", "Got it")}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleInstallClick}
      className={cn("gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold", className)}
    >
      <Download size={15} />
      <span>{t("অ্যাপ ডাউনলোড করুন", "Download App")}</span>
    </Button>
  );
}
