"use client";

import { useState } from "react";
import { MemberSettlementSummary } from "@/types";
import { MemberSettlementCard } from "./MemberSettlementCard";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Input } from "@/components/ui/input";
import { Search, Users, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MemberSettlementListProps {
  memberSummaries: MemberSettlementSummary[];
  currentMemberId: string | null;
  isAdmin?: boolean;
  month?: number;
  year?: number;
  messSettings?: any;
}

export function MemberSettlementList({
  memberSummaries,
  currentMemberId,
  isAdmin = false,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  messSettings,
}: MemberSettlementListProps) {
  const [filter, setFilter] = useState<"all" | "credit" | "due">("all");
  const [search, setSearch] = useState("");
  const { t } = usePreferences();

  // If not admin, only show current user's card
  const visibleSummaries = !isAdmin && currentMemberId
    ? memberSummaries.filter((m) => m.memberId === currentMemberId)
    : memberSummaries;

  const creditList = visibleSummaries.filter((m) => m.balance > 0);
  const dueList = visibleSummaries.filter((m) => m.balance < 0);

  const filteredList = visibleSummaries.filter((m) => {
    if (filter === "credit" && m.balance <= 0) return false;
    if (filter === "due" && m.balance >= 0) return false;
    if (search.trim() && !m.memberName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-x-auto max-w-full no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none flex items-center gap-1.5",
              filter === "all"
                ? "bg-primary text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            <Users size={13} />
            <span>{t(`সবাই (${memberSummaries.length})`, `All (${memberSummaries.length})`)}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("credit")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none flex items-center gap-1.5",
              filter === "credit"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            )}
          >
            <TrendingUp size={13} />
            <span>{t(`ফেরত পাবে (${creditList.length})`, `Refunds (${creditList.length})`)}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("due")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none flex items-center gap-1.5",
              filter === "due"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            )}
          >
            <AlertCircle size={13} />
            <span>{t(`বকেয়া রয়েছে (${dueList.length})`, `Due (${dueList.length})`)}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("মেম্বারের নাম খুঁজুন...", "Search member by name...")}
            className="pl-8.5 h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-gray-400 dark:text-slate-500">
          <p className="font-bold">{t("কোনো মেম্বার পাওয়া যায়নি।", "No members found matching filter.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((ms) => (
            <MemberSettlementCard
              key={ms.memberId}
              data={ms}
              isCurrentMember={ms.memberId === currentMemberId}
              month={month}
              year={year}
              messSettings={messSettings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
