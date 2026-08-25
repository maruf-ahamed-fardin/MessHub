"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/useT";
import {
  UtensilsCrossed, CreditCard, MessageSquare, Home, User,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const T = useT();

  const isHomeActive = pathname === "/dashboard";
  const isMealsActive = pathname === "/meals" || pathname.startsWith("/meals/");
  const isMoneyActive = pathname === "/payments" || pathname.startsWith("/payments/");
  const isCommunityActive = pathname === "/community" || pathname.startsWith("/community/");
  const isProfileActive = pathname === "/members/me" || pathname.startsWith("/members/me");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/90 flex items-center justify-around px-2 h-16 md:hidden shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 1. Meals (Amber / Orange) */}
      <Link
        href="/meals"
        className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs",
            isMealsActive
              ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30 scale-105"
              : "bg-amber-50 text-amber-600 border border-amber-200/80 hover:bg-amber-100"
          )}
        >
          <UtensilsCrossed size={17} strokeWidth={2.3} />
        </div>
        <span
          className={cn(
            "text-[10px] leading-none transition-colors",
            isMealsActive ? "text-amber-700 font-extrabold" : "text-gray-500 font-semibold"
          )}
        >
          {T.nav.meals}
        </span>
      </Link>

      {/* 2. Money (Emerald / Green) */}
      <Link
        href="/payments"
        className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs",
            isMoneyActive
              ? "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 scale-105"
              : "bg-emerald-50 text-emerald-600 border border-emerald-200/80 hover:bg-emerald-100"
          )}
        >
          <CreditCard size={17} strokeWidth={2.3} />
        </div>
        <span
          className={cn(
            "text-[10px] leading-none transition-colors",
            isMoneyActive ? "text-emerald-700 font-extrabold" : "text-gray-500 font-semibold"
          )}
        >
          {T.nav.money}
        </span>
      </Link>

      {/* 3. CENTER: Home (Indigo / Blue Gradient - Balanced In-Line) */}
      <Link
        href="/dashboard"
        className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-xs",
            isHomeActive
              ? "bg-gradient-to-tr from-indigo-600 via-primary to-violet-600 text-white shadow-indigo-500/35 ring-2 ring-indigo-200 scale-105"
              : "bg-indigo-50 text-indigo-600 border border-indigo-200/90 hover:bg-indigo-100"
          )}
          title="Dashboard Home"
        >
          <Home size={19} strokeWidth={2.4} />
        </div>
        <span
          className={cn(
            "text-[10px] leading-none transition-colors",
            isHomeActive ? "text-indigo-600 font-extrabold" : "text-gray-500 font-semibold"
          )}
        >
          {T.nav.home}
        </span>
      </Link>

      {/* 4. Community (Purple / Violet) */}
      <Link
        href="/community"
        className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs",
            isCommunityActive
              ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/30 scale-105"
              : "bg-purple-50 text-purple-600 border border-purple-200/80 hover:bg-purple-100"
          )}
        >
          <MessageSquare size={17} strokeWidth={2.3} />
        </div>
        <span
          className={cn(
            "text-[10px] leading-none transition-colors",
            isCommunityActive ? "text-purple-700 font-extrabold" : "text-gray-500 font-semibold"
          )}
        >
          {T.nav.feed}
        </span>
      </Link>

      {/* 5. Profile (Violet / Slate) */}
      <Link
        href="/members/me"
        className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 py-1"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs",
            isProfileActive
              ? "bg-gradient-to-tr from-violet-500 to-purple-600 text-white shadow-violet-500/30 scale-105"
              : "bg-violet-50 text-violet-600 border border-violet-200/80 hover:bg-violet-100"
          )}
        >
          <User size={17} strokeWidth={2.3} />
        </div>
        <span
          className={cn(
            "text-[10px] leading-none transition-colors",
            isProfileActive ? "text-violet-700 font-extrabold" : "text-gray-500 font-semibold"
          )}
        >
          {T.nav.profile}
        </span>
      </Link>
    </nav>
  );
}

