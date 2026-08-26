"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Wrench, CheckCircle } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/date";
import { updateMaintenanceStatusAction } from "@/app/actions/app.actions";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function MaintenanceList({ reports, isAdmin }: { reports: any[]; isAdmin: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = usePreferences();

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title={t("কোনো মেরামত রিপোর্ট নেই", "No maintenance reports")}
        description={t("সব কিছু ঠিকঠাক চলছে!", "Everything is running smoothly.")}
      />
    );
  }

  const handleStatus = (id: string, status: string) => {
    startTransition(async () => {
      await updateMaintenanceStatusAction(id, status);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className={cn(
            "bg-white dark:bg-slate-900 border rounded-xl p-4",
            report.status === "RESOLVED" ? "border-gray-200 dark:border-slate-800 opacity-70" : "border-gray-200 dark:border-slate-800"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                report.status === "RESOLVED" ? "bg-green-50 dark:bg-green-950/40" : "bg-red-50 dark:bg-red-950/40"
              )}
            >
              <Wrench size={14} className={report.status === "RESOLVED" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{report.title}</p>
                <Badge variant="outline" className="text-xs">
                  {report.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    report.status === "RESOLVED"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  {report.status === "RESOLVED" ? t("সমাধান হয়েছে", "Resolved") : t("চলমান", "In Progress")}
                </Badge>
              </div>
              {report.description && <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{report.description}</p>}
              {report.location && <p className="text-xs text-gray-400 dark:text-slate-500">📍 {report.location}</p>}
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {t(`রিপোর্টকারী: ${report.reportedBy?.user?.name}`, `Reported by: ${report.reportedBy?.user?.name}`)} · {formatRelativeDate(report.createdAt)}
              </p>
              {isAdmin && report.status !== "RESOLVED" && (
                <div className="flex gap-2 mt-2">
                  {report.status === "REPORTED" && (
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleStatus(report.id, "IN_PROGRESS")} disabled={pending}>
                      {t("চলমান চিহ্নিত করুন", "Mark In Progress")}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleStatus(report.id, "RESOLVED")} disabled={pending}>
                    <CheckCircle size={11} className="mr-1" />
                    {t("সমাধান হয়েছে", "Resolved")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
