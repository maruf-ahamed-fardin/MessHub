"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Share2 } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface WhatsAppShareButtonProps {
  messName?: string;
  date?: Date;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  bazarMemberName?: string | null;
  cleaningMemberName?: string | null;
  mealRate?: number;
}

export function WhatsAppShareButton({
  messName = "MessHub",
  date = new Date(),
  breakfastCount = 0,
  lunchCount = 0,
  dinnerCount = 0,
  bazarMemberName,
  cleaningMemberName,
  mealRate,
}: WhatsAppShareButtonProps) {
  const { t, language } = usePreferences();

  const totalMeals = breakfastCount + lunchCount + dinnerCount;
  const dateStr = date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = () => {
    let msg = "";
    if (language === "bn") {
      msg = `📢 *${messName} - আজকের মেস আপডেট*\n📅 *তারিখ:* ${dateStr}\n\n` +
        `☀️ *সকাল:* ${breakfastCount} টি মিল\n` +
        `🍽️ *দুপুর:* ${lunchCount} টি মিল\n` +
        `🌙 *রাত:* ${dinnerCount} টি মিল\n` +
        `📊 *মোট মিল:* ${totalMeals} টি\n\n` +
        (bazarMemberName ? `🛒 *আজকের বাজার দায়িত্বে:* ${bazarMemberName}\n` : "") +
        (cleaningMemberName ? `🧹 *আজকের ক্লিনিং দায়িত্বে:* ${cleaningMemberName}\n` : "") +
        (mealRate ? `💵 *চলতি মিল রেট:* ৳${mealRate.toFixed(2)}\n\n` : "\n") +
        `🌐 *বিস্তারিত লগইন করুন:* ${typeof window !== "undefined" ? window.location.origin : "MessHub"}`;
    } else {
      msg = `📢 *${messName} - Today's Mess Update*\n📅 *Date:* ${dateStr}\n\n` +
        `☀️ *Breakfast:* ${breakfastCount} meals\n` +
        `🍽️ *Lunch:* ${lunchCount} meals\n` +
        `🌙 *Dinner:* ${dinnerCount} meals\n` +
        `📊 *Total Meals:* ${totalMeals}\n\n` +
        (bazarMemberName ? `🛒 *Bazar Duty:* ${bazarMemberName}\n` : "") +
        (cleaningMemberName ? `🧹 *Cleaning Duty:* ${cleaningMemberName}\n` : "") +
        (mealRate ? `💵 *Live Meal Rate:* ৳${mealRate.toFixed(2)}\n\n` : "\n") +
        `🌐 *Check online:* ${typeof window !== "undefined" ? window.location.origin : "MessHub"}`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Button
      type="button"
      onClick={handleShare}
      size="sm"
      className="h-8.5 px-3 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
    >
      <MessageCircle size={14} />
      <span>{t("হোয়াটসঅ্যাপে পাঠান", "Share on WhatsApp")}</span>
    </Button>
  );
}
