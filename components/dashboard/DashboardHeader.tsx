"use client";

import Link from "next/link";
import { ShoppingBasket, UtensilsCrossed, CreditCard } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface DashboardHeaderProps {
  name: string;
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  const { t, language } = usePreferences();
  const firstName = name.split(" ")[0];
  const today = new Date();

  const h = today.getHours();
  const greeting = h < 12
    ? { text: t("শুভ সকাল", "Good morning"), emoji: "☀️" }
    : h < 17
    ? { text: t("শুভ অপরাহ্ন", "Good afternoon"), emoji: "⛅" }
    : { text: t("শুভ সন্ধ্যা", "Good evening"), emoji: "🌙" };

  const formattedDate = today.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{greeting.emoji}</span>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            {greeting.text}, {firstName}!
          </h1>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-400 font-medium mt-0.5">{formattedDate}</p>
      </div>

      {/* Cool Quick Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/meals"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-all"
        >
          <UtensilsCrossed size={13} className="text-primary" />
          <span>{t("মিল আপডেট", "Meal Update")}</span>
        </Link>
        <Link
          href="/bazar"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-all"
        >
          <ShoppingBasket size={13} className="text-amber-600" />
          <span>{t("বাজার হিসাব", "Bazar Records")}</span>
        </Link>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 hover:bg-gray-800 shadow-2xs transition-all"
        >
          <CreditCard size={13} />
          <span>{t("টাকা লেনদেন", "Money Transaction")}</span>
        </Link>
      </div>
    </div>
  );
}
