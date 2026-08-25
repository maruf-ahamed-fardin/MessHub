"use client";

import Link from "next/link";
import { Plus, ShoppingBasket, UtensilsCrossed, CreditCard, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  name: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "⛅" };
  return { text: "Good evening", emoji: "🌙" };
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  const firstName = name.split(" ")[0];
  const today = new Date();
  const greeting = getGreeting();

  const formattedDate = today.toLocaleDateString("en-US", {
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            {greeting.text}, {firstName}
          </h1>
        </div>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{formattedDate}</p>
      </div>

      {/* Cool Quick Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/meals"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs transition-all"
        >
          <UtensilsCrossed size={13} className="text-primary" />
          <span>মিল আপডেট</span>
        </Link>
        <Link
          href="/bazar"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs transition-all"
        >
          <ShoppingBasket size={13} className="text-amber-600" />
          <span>বাজার হিসাব</span>
        </Link>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 shadow-2xs transition-all"
        >
          <CreditCard size={13} />
          <span>টাকা লেনদেন</span>
        </Link>
      </div>
    </div>
  );
}
