"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Home, Receipt } from "lucide-react";
import { UtilityBillSplitter } from "@/components/expenses/UtilityBillSplitter";
import { ExpenseList } from "@/components/expenses/ExpenseList";

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

  return (
    <div className="space-y-4">
      {/* Clean Minimal Horizontal Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 border border-gray-200/60 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("utilities")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            activeTab === "utilities"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Home size={13} />
          <span>বাসা ভাড়া ও ইউটিলিটি বিল (৭ জনের ভাগ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            activeTab === "expenses"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Receipt size={13} />
          <span>অন্যান্য খরচ ({expenses.length})</span>
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
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">অন্যান্য মেস খরচ</h4>
              <p className="text-[11px] text-gray-400">ফিল্টার সার্ভিস, ক্লিন সামগ্রী ও অন্যান্য রসিদ</p>
            </div>
          </div>
          <ExpenseList expenses={expenses} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  );
}
