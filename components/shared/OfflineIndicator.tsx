"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnline, setShowOnline] = useState(false);
  const { t } = usePreferences();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnline(true);
      setTimeout(() => setShowOnline(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showOnline) return null;

  return (
    <div
      className={cn(
        "fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5",
        "px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-all",
        isOnline
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      )}
    >
      {isOnline ? (
        <>
          <Wifi size={13} />
          {t("অনলাইন সংযুক্ত", "Back online")}
        </>
      ) : (
        <>
          <WifiOff size={13} />
          {t("অফলাইনে আছেন", "You're offline")}
        </>
      )}
    </div>
  );
}
