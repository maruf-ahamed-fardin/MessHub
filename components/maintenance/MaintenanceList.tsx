"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Wrench, CheckCircle } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/date";
import { updateMaintenanceStatusAction } from "@/app/actions/app.actions";
import { cn } from "@/lib/utils/cn";

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "badge-warning",
  HIGH: "badge-urgent",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_STYLES: Record<string, string> = {
  REPORTED: "badge-warning",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "badge-success",
};

export function MaintenanceList({ reports, isAdmin }: { reports: any[]; isAdmin: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (reports.length === 0) {
    return <EmptyState icon={Wrench} title="No maintenance reports" description="Great! Everything is running smoothly." />;
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
        <div key={report.id} className={cn(
          "bg-white border rounded-[var(--radius)] p-4",
          report.status === "RESOLVED" ? "border-[hsl(var(--border))] opacity-70" : "border-[hsl(var(--border))]"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              report.status === "RESOLVED" ? "bg-green-50" : "bg-red-50")}>
              <Wrench size={14} className={report.status === "RESOLVED" ? "text-green-600" : "text-red-600"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-medium">{report.title}</p>
                <Badge variant="outline" className={`text-xs ${PRIORITY_STYLES[report.priority] ?? ""}`}>{report.priority}</Badge>
                <Badge variant="outline" className={`text-xs ${STATUS_STYLES[report.status] ?? ""}`}>{report.status.replace("_", " ")}</Badge>
              </div>
              {report.description && <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{report.description}</p>}
              {report.location && <p className="text-xs text-[hsl(var(--muted-foreground))]">📍 {report.location}</p>}
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Reported by {report.reportedBy?.user?.name} · {formatRelativeDate(report.createdAt)}
              </p>
              {isAdmin && report.status !== "RESOLVED" && (
                <div className="flex gap-2 mt-2">
                  {report.status === "REPORTED" && (
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleStatus(report.id, "IN_PROGRESS")} disabled={pending}>
                      Mark In Progress
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleStatus(report.id, "RESOLVED")} disabled={pending}>
                    <CheckCircle size={11} className="mr-1" />Resolved
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
