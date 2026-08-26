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
    <div className="space-y-4">
      {/* Horizontal Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("utilities")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            activeTab === "utilities"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          )}
        >
          <Home size={13} />
          <span>{t("বাসা ভাড়া ও ইউটিলিটি বিল", "Rent & Utility Bills")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            activeTab === "expenses"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          )}
        >
          <Receipt size={13} />
          <span>{t(`অন্যান্য খরচ (${expenses.length})`, `Other Expenses (${expenses.length})`)}</span>
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
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
                {t("অন্যান্য মেস খরচ", "Other Mess Expenses")}
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                {t("ফিল্টার সার্ভিস, ক্লিন সামগ্রী ও অন্যান্য রসিদ", "Filter servicing, cleaning supplies & other expenses")}
              </p>
            </div>
          </div>
          <ExpenseList expenses={expenses} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  );
}
