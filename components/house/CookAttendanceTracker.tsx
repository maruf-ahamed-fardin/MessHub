"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Check, X, Calendar as CalendarIcon, DollarSign, Clock, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { recordCookAttendanceAction } from "@/app/actions/cook.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";

interface CookAttendanceTrackerProps {
  initialStats: {
    month: number;
    year: number;
    totalDaysInMonth: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    overtimeCount: number;
    baseSalary: number;
    totalDeduction: number;
    netPayable: number;
    records: any[];
  };
  isAdmin?: boolean;
}

export function CookAttendanceTracker({ initialStats, isAdmin = false }: CookAttendanceTrackerProps) {
  const { t, language } = usePreferences();
  const router = useRouter();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecord = initialStats.records.find((r) => new Date(r.date).toISOString().split("T")[0] === todayStr);

  const [todayStatus, setTodayStatus] = useState<string>(todayRecord?.status || "PRESENT");
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

  const handleMarkAttendance = async (dateStr: string, status: "PRESENT" | "ABSENT" | "LEAVE" | "OVERTIME") => {
    if (!isAdmin) return;
    setLoadingDate(dateStr);
    try {
      const res = await recordCookAttendanceAction({
        date: dateStr,
        status,
      });
      if (res.success) {
        if (dateStr === todayStr) setTodayStatus(status);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDate(null);
    }
  };

  // Generate days array for the month
  const daysInMonth = Array.from({ length: initialStats.totalDaysInMonth }, (_, i) => {
    const day = i + 1;
    const dateObj = new Date(Date.UTC(initialStats.year, initialStats.month - 1, day));
    const dStr = dateObj.toISOString().split("T")[0];
    const rec = initialStats.records.find((r) => new Date(r.date).toISOString().split("T")[0] === dStr);
    return {
      day,
      dateStr: dStr,
      status: rec?.status || null,
      note: rec?.note,
    };
  });

  return (
    <div className="space-y-4">
      {/* 1. Today's Quick Attendance Card */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ChefHat size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground">{t("বুয়া / খালার আজকের হাজিরা", "Cook's Attendance Today")}</h4>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {t("বর্তমান স্থিতি: ", "Status: ")}
            <strong>
              {todayStatus === "PRESENT"
                ? t("উপস্থিত 🟢", "Present 🟢")
                : todayStatus === "ABSENT"
                ? t("অনুপস্থিত 🔴", "Absent 🔴")
                : todayStatus === "LEAVE"
                ? t("ছুটি 🟡", "On Leave 🟡")
                : t("ওভারটাইম 🔵", "Overtime 🔵")}
            </strong>
          </span>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={() => handleMarkAttendance(todayStr, "PRESENT")}
              disabled={loadingDate === todayStr}
              className={`h-9 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                todayStatus === "PRESENT"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Check size={14} className="mr-1.5" />
              {t("উপস্থিত (Present)", "Present")}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleMarkAttendance(todayStr, "ABSENT")}
              disabled={loadingDate === todayStr}
              className={`h-9 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                todayStatus === "ABSENT"
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <X size={14} className="mr-1.5" />
              {t("অনুপস্থিত (Absent)", "Absent")}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleMarkAttendance(todayStr, "LEAVE")}
              disabled={loadingDate === todayStr}
              className={`h-9 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                todayStatus === "LEAVE"
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Clock size={14} className="mr-1.5" />
              {t("অনুমোদিত ছুটি (Leave)", "Leave")}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleMarkAttendance(todayStr, "OVERTIME")}
              disabled={loadingDate === todayStr}
              className={`h-9 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                todayStatus === "OVERTIME"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Sparkles size={14} className="mr-1.5" />
              {t("ওভারটাইম / বিশেষ", "Overtime")}
            </Button>
          </div>
        )}
      </div>

      {/* 2. Salary & Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40">
          <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{t("মোট উপস্থিত দিন", "Present Days")}</p>
          <h4 className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
            {initialStats.presentCount} {t("দিন", "days")}
          </h4>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40">
          <p className="text-[11px] font-bold text-rose-800 dark:text-rose-300">{t("অনুপস্থিতি (কাটা দিন)", "Absent Days")}</p>
          <h4 className="text-xl font-black text-rose-950 dark:text-rose-100 mt-0.5">
            {initialStats.absentCount} {t("দিন", "days")}
          </h4>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">{t("অনুপস্থিতি কর্তন", "Salary Deduction")}</p>
          <h4 className="text-xl font-black text-amber-950 dark:text-amber-100 mt-0.5">
            -{formatCurrency(initialStats.totalDeduction)}
          </h4>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40">
          <p className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">{t("চলতি প্রদেয় বেতন", "Net Payable Salary")}</p>
          <h4 className="text-xl font-black text-indigo-950 dark:text-indigo-100 mt-0.5">
            {formatCurrency(initialStats.netPayable)}
          </h4>
        </div>
      </div>

      {/* 3. Monthly Calendar Grid */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-4 sm:p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-primary" />
          <span>{t("মাসিক হাজিরার ক্যালেন্ডার", "Monthly Attendance Calendar")}</span>
        </h4>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {daysInMonth.map((d) => {
            const isToday = d.dateStr === todayStr;
            return (
              <div
                key={d.day}
                className={`p-2 rounded-xl border text-xs flex flex-col items-center justify-between gap-1 transition-all ${
                  isToday
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "border-border/60 bg-muted/20"
                }`}
              >
                <span className="font-extrabold text-[11px] text-muted-foreground">{d.day}</span>
                <span className="text-sm">
                  {d.status === "PRESENT" ? "🟢" : d.status === "ABSENT" ? "🔴" : d.status === "LEAVE" ? "🟡" : d.status === "OVERTIME" ? "🔵" : "⚪"}
                </span>
                <span className="text-[9px] font-bold truncate">
                  {d.status === "PRESENT"
                    ? t("উপস্থিত", "Present")
                    : d.status === "ABSENT"
                    ? t("অনুপস্থিত", "Absent")
                    : d.status === "LEAVE"
                    ? t("ছুটি", "Leave")
                    : d.status === "OVERTIME"
                    ? t("ওভারটাইম", "OT")
                    : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
