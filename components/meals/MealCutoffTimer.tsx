"use client";

import { useState, useEffect } from "react";
import { Clock, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MealCutoffTimerProps {
  lunchCutoff?: string; // e.g. "09:00"
  dinnerCutoff?: string; // e.g. "16:00"
  isToday?: boolean;
  isAdmin?: boolean;
}

export function MealCutoffTimer({
  lunchCutoff = "09:00",
  dinnerCutoff = "16:00",
  isToday = true,
  isAdmin = false,
}: MealCutoffTimerProps) {
  const { t } = usePreferences();
  const [timeLeft, setTimeLeft] = useState<{ status: "LUNCH_ACTIVE" | "DINNER_ACTIVE" | "ALL_LOCKED"; text: string } | null>(null);

  useEffect(() => {
    if (!isToday) {
      setTimeLeft(null);
      return;
    }

    const checkTimer = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [lH, lM] = lunchCutoff.split(":").map(Number);
      const lunchCutoffMinutes = lH * 60 + lM;

      const [dH, dM] = dinnerCutoff.split(":").map(Number);
      const dinnerCutoffMinutes = dH * 60 + dM;

      if (currentMinutes < lunchCutoffMinutes) {
        const diff = lunchCutoffMinutes - currentMinutes;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        setTimeLeft({
          status: "LUNCH_ACTIVE",
          text: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
        });
      } else if (currentMinutes < dinnerCutoffMinutes) {
        const diff = dinnerCutoffMinutes - currentMinutes;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        setTimeLeft({
          status: "DINNER_ACTIVE",
          text: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
        });
      } else {
        setTimeLeft({
          status: "ALL_LOCKED",
          text: "",
        });
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 30000);
    return () => clearInterval(interval);
  }, [lunchCutoff, dinnerCutoff, isToday]);

  if (!isToday || !timeLeft) return null;

  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      {timeLeft.status === "LUNCH_ACTIVE" && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Clock size={13} className="text-amber-600 dark:text-amber-400" />
          <span>
            {t(`☀️ দুপুর মিল লক: ${timeLeft.text}`, `☀️ Lunch lock in: ${timeLeft.text}`)}
          </span>
        </div>
      )}

      {timeLeft.status === "DINNER_ACTIVE" && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
          <span>
            {t(`🌙 রাত মিল লক: ${timeLeft.text}`, `🌙 Dinner lock in: ${timeLeft.text}`)}
          </span>
        </div>
      )}

      {timeLeft.status === "ALL_LOCKED" && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
          <Lock size={13} className="text-rose-600 dark:text-rose-400" />
          <span>
            {isAdmin
              ? t("🔒 আজকের মিল কাট-অফ পার হয়েছে (এডমিন মোড এক্টিভ)", "🔒 Today's cut-off passed (Admin override)")
              : t("🔒 আজকের মিল লক করা হয়েছে", "🔒 Today's meals are locked")}
          </span>
        </div>
      )}
    </div>
  );
}
