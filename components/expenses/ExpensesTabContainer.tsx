"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Home, Receipt } from "lucide-react";
import { UtilityBillSplitter } from "@/components/expenses/UtilityBillSplitter";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface ExpensesTabContainerProps {
  expenses: any[];
  utilities: any[];
  members: any[];
  month: number;
  year: number;
  isAdmin: boolean;
}

export function ExpensesTabContainer({
  expenses,
  utilities,
  members,
  month,
  year,
  isAdmin,
}: ExpensesTabContainerProps) {
  const [activeTab, setActiveTab] = useState<"utilities" | "expenses">("utilities");
  const { t } = usePreferences();

  return (
    <div className="space-y-5">
      {/* Sleek Segmented Pill Navigation */}
      <div className="inline-flex p-1 bg-gray-100 dark:bg-slate-800/80 rounded-2xl gap-1 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("utilities")}
          className={cn(
            "px-3.5 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 select-none",
            activeTab === "utilities"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs font-extrabold"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Home size={13} className="text-purple-500 shrink-0" />
          <span>{t("বাসা ভাড়া ও ইউটিলিটি বিল", "Rent & Utility Bills")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={cn(
            "px-3.5 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 select-none",
            activeTab === "expenses"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs font-extrabold"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Receipt size={13} className="text-rose-500 shrink-0" />
          <span>{t("অন্যান্য খরচ", "Other Expenses")}</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
              activeTab === "expenses"
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                : "bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            )}
          >
            {expenses.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Utility Bills & 7-Member Splitter */}
      {activeTab === "utilities" && (
        <UtilityBillSplitter
          utilities={utilities}
          members={members}
          month={month}
          year={year}
          isAdmin={isAdmin}
        />
      )}

      {/* Tab 2: Other Shared Mess Expenses */}
      {activeTab === "expenses" && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-slate-100">
                {t("অন্যান্য মেস খরচসমূহ", "Other Mess Expenses")}
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                {t("ফিল্টার সার্ভিস, ক্লিনিং সামগ্রী ও বিবিধ খরচের হিসাব", "Filter servicing, cleaning supplies & miscellaneous expenses")}
              </p>
            </div>
          </div>
          <ExpenseList expenses={expenses} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  );
}

