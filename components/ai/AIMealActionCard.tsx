"use client";

import { useState, useTransition } from "react";
import { Utensils, Calendar, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateMealAction } from "@/app/actions/meal.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { GeminiAiIcon } from "./GeminiAiIcon";

interface AIMealActionCardProps {
  data: {
    date: string;
    dateLabel: string;
    memberId: string;
    memberName: string;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  onComplete?: () => void;
}

export function AIMealActionCard({ data, onComplete }: AIMealActionCardProps) {
  const { t } = usePreferences();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(data.date);
  const [breakfast, setBreakfast] = useState(data.breakfast);
  const [lunch, setLunch] = useState(data.lunch);
  const [dinner, setDinner] = useState(data.dinner);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirmMeal = () => {
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await updateMealAction({
          memberId: data.memberId,
          date,
          breakfast,
          lunch,
          dinner,
        });

        if (res && !res.success && res.error) {
          setErrorMsg(res.error);
        } else {
          setIsSaved(true);
          router.refresh();
          if (onComplete) onComplete();
        }
      } catch (err: any) {
        console.error("Failed to update meal via AI card:", err);
        setErrorMsg(err.message || "Failed to update meal");
      }
    });
  };

  return (
    <div className="my-2 rounded-2xl border border-violet-200 dark:border-violet-800/80 bg-gradient-to-b from-violet-50/70 to-white dark:from-violet-950/40 dark:to-slate-900 overflow-hidden shadow-md text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-violet-600 dark:bg-violet-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <Utensils size={14} />
          <span>{t("মিল পরিবর্তন কনফার্মেশন", "Meal Update Confirmation")}</span>
        </div>
        <div className="flex items-center gap-1">
          <GeminiAiIcon size={14} className="text-amber-300 animate-pulse" />
          <span className="text-[11px] font-semibold">{data.dateLabel}</span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Date & Member Display */}
        <div className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-200 font-semibold">
            <Calendar size={12} className="text-violet-500" />
            <span>{date}</span>
          </div>
          <span className="text-violet-600 dark:text-violet-400 font-bold">
            {data.memberName}
          </span>
        </div>

        {/* 3 Meal Toggles */}
        <div className="grid grid-cols-3 gap-2">
          {/* Breakfast */}
          <div className="space-y-1 text-center">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block">
              {t("☀️ সকাল", "☀️ Breakfast")}
            </span>
            <button
              type="button"
              disabled={isSaved || isPending}
              onClick={() => setBreakfast(!breakfast)}
              className={cn(
                "w-full h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs",
                isSaved ? "cursor-default" : "cursor-pointer active:scale-95",
                breakfast
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              )}
            >
              <span>{breakfast ? t("চালু", "ON") : t("বন্ধ", "OFF")}</span>
              <span className="text-[10px]">{breakfast ? "✓" : "✕"}</span>
            </button>
          </div>

          {/* Lunch */}
          <div className="space-y-1 text-center">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block">
              {t("🍽️ দুপুর", "🍽️ Lunch")}
            </span>
            <button
              type="button"
              disabled={isSaved || isPending}
              onClick={() => setLunch(!lunch)}
              className={cn(
                "w-full h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs",
                isSaved ? "cursor-default" : "cursor-pointer active:scale-95",
                lunch
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              )}
            >
              <span>{lunch ? t("চালু", "ON") : t("বন্ধ", "OFF")}</span>
              <span className="text-[10px]">{lunch ? "✓" : "✕"}</span>
            </button>
          </div>

          {/* Dinner */}
          <div className="space-y-1 text-center">
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 block">
              {t("🌙 রাত", "🌙 Dinner")}
            </span>
            <button
              type="button"
              disabled={isSaved || isPending}
              onClick={() => setDinner(!dinner)}
              className={cn(
                "w-full h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs",
                isSaved ? "cursor-default" : "cursor-pointer active:scale-95",
                dinner
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              )}
            >
              <span>{dinner ? t("চালু", "ON") : t("বন্ধ", "OFF")}</span>
              <span className="text-[10px]">{dinner ? "✓" : "✕"}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 text-[11px]">
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          {isSaved ? (
            <div className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm">
              <Check size={14} strokeWidth={3} />
              <span>{t("মিল সেটিংস সেভ হয়েছে ✓", "Meal Settings Saved ✓")}</span>
            </div>
          ) : (
            <Button
              type="button"
              disabled={isPending}
              onClick={handleConfirmMeal}
              className="w-full h-8 text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1" />
                  <span>{t("আপডেট হচ্ছে…", "Updating…")}</span>
                </>
              ) : (
                <>
                  <Check size={13} strokeWidth={3} className="mr-1" />
                  <span>{t("🍽️ মিল পরিবর্তন নিশ্চিত করুন", "Confirm Meal Update")}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
