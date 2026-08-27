"use client";

import { useState, useTransition } from "react";
import { UserPlus, Calendar, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGuestMealAction } from "@/app/actions/meal.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";
import { GeminiAiIcon } from "./GeminiAiIcon";

interface AIGuestMealCardProps {
  data: {
    date: string;
    memberId: string;
    memberName: string;
    guestName: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER";
    quantity: number;
    note?: string;
  };
  onComplete?: () => void;
}

export function AIGuestMealCard({ data, onComplete }: AIGuestMealCardProps) {
  const { t } = usePreferences();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(data.date);
  const [guestName, setGuestName] = useState(data.guestName);
  const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER">(data.mealType);
  const [quantity, setQuantity] = useState(data.quantity);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirmGuestMeal = () => {
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await createGuestMealAction({
          memberId: data.memberId,
          guestName,
          date,
          mealType,
          quantity: Number(quantity) || 1,
          note: data.note,
        });

        if (res && !res.success && res.error) {
          setErrorMsg(res.error);
        } else {
          setIsSaved(true);
          router.refresh();
          if (onComplete) onComplete();
        }
      } catch (err: any) {
        console.error("Failed to add guest meal via AI card:", err);
        setErrorMsg(err.message || "Failed to add guest meal");
      }
    });
  };

  return (
    <div className="my-2 rounded-2xl border border-sky-200 dark:border-sky-800/80 bg-gradient-to-b from-sky-50/70 to-white dark:from-sky-950/40 dark:to-slate-900 overflow-hidden shadow-md text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-sky-600 dark:bg-sky-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <UserPlus size={14} />
          <span>{t("গেস্ট মিল বুকিং কনফার্মেশন", "Guest Meal Booking Confirmation")}</span>
        </div>
        <div className="flex items-center gap-1">
          <GeminiAiIcon size={14} className="text-amber-300 animate-pulse" />
          <span className="text-[11px] font-semibold">{quantity} টি মিল</span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
              {t("গেস্টের নাম / পরিচয়", "Guest Name")}
            </label>
            <Input
              value={guestName}
              disabled={isSaved || isPending}
              onChange={(e) => setGuestName(e.target.value)}
              className="h-7 text-xs bg-white dark:bg-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
              {t("তারিখ", "Date")}
            </label>
            <Input
              type="date"
              value={date}
              disabled={isSaved || isPending}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 text-xs bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
              {t("মিলের সময়", "Meal Time")}
            </label>
            <select
              value={mealType}
              disabled={isSaved || isPending}
              onChange={(e) => setMealType(e.target.value as any)}
              className="w-full h-7 rounded-md border border-input bg-white dark:bg-slate-800 px-2 text-xs shadow-xs focus:outline-none"
            >
              <option value="BREAKFAST">{t("☀️ সকালের নাস্তা", "☀️ Breakfast")}</option>
              <option value="LUNCH">{t("🍽️ দুপুরের খাবার", "🍽️ Lunch")}</option>
              <option value="DINNER">{t("🌙 রাতের খাবার", "🌙 Dinner")}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
              {t("মিল সংখ্যা (Quantity)", "Quantity")}
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={quantity}
              disabled={isSaved || isPending}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="h-7 text-xs bg-white dark:bg-slate-800 font-bold"
            />
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
              <span>{t("গেস্ট মিল সফলভাবে যুক্ত হয়েছে ✓", "Guest Meal Added Successfully ✓")}</span>
            </div>
          ) : (
            <Button
              type="button"
              disabled={isPending}
              onClick={handleConfirmGuestMeal}
              className="w-full h-8 text-xs font-black bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md shadow-sky-500/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1" />
                  <span>{t("বুকিং হচ্ছে…", "Booking…")}</span>
                </>
              ) : (
                <>
                  <Check size={13} strokeWidth={3} className="mr-1" />
                  <span>{t(`👥 গেস্ট মিল যোগ করুন (${quantity}টি)`, `Book Guest Meal (${quantity})`)}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
