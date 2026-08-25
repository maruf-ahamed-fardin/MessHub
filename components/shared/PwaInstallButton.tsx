"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Check, Share2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface PwaInstallButtonProps {
  variant?: "topbar" | "card" | "banner" | "button";
  className?: string;
}

export function PwaInstallButton({ variant = "topbar", className }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

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
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
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
      // Fallback instructions for desktop or Android when prompt hasn't fired yet
      alert("ব্রাউজারের মেনু (⋮) বা অ্যাড্রেস বার থেকে 'Install App / Add to Home screen' চাপুন।");
    }
  };

  if (isInstalled) {
    if (variant === "card") {
      return (
        <div className={cn("bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs", className)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check size={20} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-900">অ্যাপ ইনস্টল করা আছে ✓</p>
              <p className="text-xs text-emerald-700">MessHub অ্যাপটি আপনার ডিভাইসে যুক্ত রয়েছে</p>
            </div>
          </div>
        </div>
      );
    }
    return null; // Don't crowd topbar if already running as installed app
  }

  // 1. TopBar Variant (Sleek Gradient Download Pill)
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
          title="MessHub অ্যাপ ডাউনলোড ও ইনস্টল করুন"
        >
          <Download size={14} className="animate-bounce" />
          <span>অ্যাপ ডাউনলোড</span>
        </button>

        {/* iOS Install Guide Popup */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 text-center relative animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">iPhone / iPad এ অ্যাপ ইনস্টল</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Safari ব্রাউজারের নিচে থাকা <Share2 size={13} className="inline text-indigo-600 mx-0.5" /> <strong>Share</strong> বাটনে চাপ দিন এবং <strong>"Add to Home Screen"</strong> সিলেক্ট করুন।
                </p>
              </div>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="w-full bg-primary text-white rounded-xl text-xs font-bold"
              >
                বুঝেছি
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // 2. Card Variant (For More Page & Settings)
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
            ইনস্টল
          </button>
        </div>

        {/* iOS Install Guide Popup */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 text-center relative animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">iPhone / iPad এ অ্যাপ ইনস্টল</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Safari ব্রাউজারের নিচে থাকা <Share2 size={13} className="inline text-indigo-600 mx-0.5" /> <strong>Share</strong> বাটনে চাপ দিন এবং <strong>"Add to Home Screen"</strong> সিলেক্ট করুন।
                </p>
              </div>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="w-full bg-primary text-white rounded-xl text-xs font-bold"
              >
                বুঝেছি
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
      <span>অ্যাপ ডাউনলোড করুন</span>
    </Button>
  );
}
