"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileSpreadsheet, Building2, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { MONTH_NAMES_BN, MONTH_NAMES_EN } from "@/lib/constants/categories";
import { downloadCsv, generateSettlementCsv } from "@/lib/utils/export-csv";
import { SettlementSummary } from "@/types";

interface MonthlyReportExportModalProps {
  summary: SettlementSummary;
  month: number;
  year: number;
  messSettings?: any;
  trigger?: React.ReactNode;
}

export function MonthlyReportExportModal({
  summary,
  month,
  year,
  messSettings,
  trigger,
}: MonthlyReportExportModalProps) {
  const [open, setOpen] = useState(false);
  const { t, language } = usePreferences();

  const monthName = language === "bn" ? MONTH_NAMES_BN[month] : MONTH_NAMES_EN[month];
  const currency = messSettings?.currency ?? "৳";
  const messName = messSettings?.messName ?? "MessHub";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csv = generateSettlementCsv({
      messName,
      monthName,
      year,
      currency,
      summary,
    });
    const filename = `Settlement_${messName.replace(/\s+/g, "_")}_${month}_${year}.csv`;
    downloadCsv(filename, csv);
  };

  const totalMealsAll = summary.memberSummaries.reduce((s, m) => s + m.totalMeals, 0);
  const totalCostAll = summary.memberSummaries.reduce((s, m) => s + m.totalCost, 0);
  const totalPaidAll = summary.memberSummaries.reduce((s, m) => s + m.totalPaid, 0);
  const totalBalanceAll = summary.memberSummaries.reduce((s, m) => s + m.balance, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 gap-1.5 font-bold text-xs rounded-xl border-border hover:bg-primary/10 hover:border-primary/40 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet size={15} className="text-primary" />
            <span>{t("রিপোর্ট এক্সপোর্ট (PDF / Excel)", "Export Report (PDF / Excel)")}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-primary" />
              <span>{t("মাসিক সেটেলমেন্ট রিপোর্ট", "Monthly Settlement Report")}</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {monthName} {year} &bull; {messName}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              onClick={handleDownloadCsv}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 hover:border-emerald-300"
            >
              <Download size={13} />
              <span>{t("Excel / CSV ডাউনলোড", "Download CSV")}</span>
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="h-8 gap-1.5 text-xs font-bold rounded-xl bg-primary text-white cursor-pointer hover:bg-primary/90 shadow-2xs"
            >
              <Printer size={13} />
              <span>{t("প্রিন্ট / PDF সেভ", "Print / PDF")}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Sheet View */}
        <div id="monthly-printable-sheet" className="p-4 sm:p-6 bg-card border border-border/70 rounded-2xl space-y-6 text-foreground print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-border/80">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                  <Building2 size={16} />
                </div>
                <h2 className="text-xl font-black text-foreground">{messName}</h2>
              </div>
              {messSettings?.address && (
                <p className="text-xs text-muted-foreground mt-1">{messSettings.address}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                <Calendar size={13} />
                <span>{monthName} {year}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t("তৈরির তারিখ:", "Generated:")} {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("মিল রেট", "Meal Rate")}</p>
              <p className="text-base font-black text-primary mt-0.5">{currency}{summary.mealRate.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("মোট বাজার খরচ", "Food Expense")}</p>
              <p className="text-base font-black text-foreground mt-0.5">{currency}{summary.totalFoodExpense.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("মোট মিল সংখ্যা", "Total Meals")}</p>
              <p className="text-base font-black text-foreground mt-0.5">{summary.totalNormalMeals} {t("টি", "meals")}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("মোট ইউটিলিটি বিল", "Total Utilities")}</p>
              <p className="text-base font-black text-foreground mt-0.5">{currency}{summary.totalUtility.toLocaleString()}</p>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground font-black border-b border-border text-[11px]">
                  <th className="p-2.5 text-center">#</th>
                  <th className="p-2.5">{t("মেম্বার", "Member")}</th>
                  <th className="p-2.5 text-center">{t("মিল", "Meals")}</th>
                  <th className="p-2.5 text-right">{t("খাবার খরচ", "Food Cost")}</th>
                  <th className="p-2.5 text-right">{t("গেস্ট মিল", "Guest")}</th>
                  <th className="p-2.5 text-right">{t("ইউটিলিটি", "Utility")}</th>
                  <th className="p-2.5 text-right">{t("সিট ভাড়া", "Seat Rent")}</th>
                  <th className="p-2.5 text-right">{t("মোট খরচ", "Total Cost")}</th>
                  <th className="p-2.5 text-right">{t("জমা", "Deposited")}</th>
                  <th className="p-2.5 text-right">{t("ব্যালেন্স", "Balance")}</th>
                  <th className="p-2.5 text-center">{t("অবস্থা", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {summary.memberSummaries.map((m, idx) => {
                  const isRefund = m.balance > 0;
                  const isDue = m.balance < 0;
                  return (
                    <tr key={m.memberId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-center font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-foreground">{m.memberName}</td>
                      <td className="p-2.5 text-center font-medium">{m.totalMeals}</td>
                      <td className="p-2.5 text-right font-mono">{currency}{m.foodCost.toFixed(1)}</td>
                      <td className="p-2.5 text-right font-mono">{m.guestMealCost > 0 ? `${currency}${m.guestMealCost.toFixed(1)}` : "—"}</td>
                      <td className="p-2.5 text-right font-mono">{currency}{m.utilityCost.toFixed(0)}</td>
                      <td className="p-2.5 text-right font-mono">{currency}{m.seatRent.toFixed(0)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">{currency}{m.totalCost.toFixed(1)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-primary">{currency}{m.totalPaid.toFixed(0)}</td>
                      <td className={`p-2.5 text-right font-mono font-black ${isRefund ? "text-emerald-600 dark:text-emerald-400" : isDue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                        {currency}{Math.abs(m.balance).toFixed(1)}
                      </td>
                      <td className="p-2.5 text-center">
                        {isRefund ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={10} />
                            <span>{t("ফেরত", "Refund")}</span>
                          </span>
                        ) : isDue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                            <AlertCircle size={10} />
                            <span>{t("বকেয়া", "Due")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {t("পরিশোধিত", "Settled")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Row */}
                <tr className="bg-muted/60 font-black text-foreground border-t-2 border-border text-[11px]">
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wider">{t("সর্বমোট", "Total")}</td>
                  <td className="p-2.5 text-center">{totalMealsAll}</td>
                  <td className="p-2.5 text-right font-mono">{currency}{summary.totalFoodExpense.toFixed(1)}</td>
                  <td className="p-2.5 text-right font-mono">—</td>
                  <td className="p-2.5 text-right font-mono">{currency}{summary.totalUtility.toFixed(0)}</td>
                  <td className="p-2.5 text-right font-mono">—</td>
                  <td className="p-2.5 text-right font-mono">{currency}{totalCostAll.toFixed(1)}</td>
                  <td className="p-2.5 text-right font-mono text-primary">{currency}{totalPaidAll.toFixed(0)}</td>
                  <td className="p-2.5 text-right font-mono">{currency}{Math.abs(totalBalanceAll).toFixed(1)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Footer (Visible on print) */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-muted-foreground">
            <div>
              <div className="w-36 mx-auto border-t border-border pt-1 font-bold text-foreground">
                {t("ম্যানেজার স্বাক্ষর", "Manager Signature")}
              </div>
            </div>
            <div>
              <div className="w-36 mx-auto border-t border-border pt-1 font-bold text-foreground">
                {t("অডিটর / মেম্বার প্রতিনিধি", "Auditor / Representative")}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
