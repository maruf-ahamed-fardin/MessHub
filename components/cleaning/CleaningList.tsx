"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Brush, CheckSquare, Check } from "lucide-react";
import { completeCleaningTaskAction } from "@/app/actions/app.actions";
import { formatShortDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface CleaningListProps {
  tasks: any[];
  isAdmin: boolean;
  type: "cleaning" | "household";
}

export function CleaningList({ tasks, type }: CleaningListProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = usePreferences();

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={type === "cleaning" ? Brush : CheckSquare}
        title={t("কোনো টাস্ক নেই", "No tasks scheduled")}
        description={t("সব কাজ সম্পন্ন হয়েছে!", "All caught up!")}
      />
    );
  }

  const handleComplete = (id: string) => {
    startTransition(async () => {
      await completeCleaningTaskAction(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isDone = task.status === "DONE";
        const isOverdue = !isDone && new Date(task.dueDate) < new Date();

        return (
          <div
            key={task.id}
            className={cn(
              "bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 flex items-center gap-3",
              isDone ? "border-gray-200 dark:border-slate-800 opacity-60" : isOverdue ? "border-red-200 dark:border-red-900/60" : "border-gray-200 dark:border-slate-800"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isDone ? "bg-green-50 dark:bg-green-950/40" : "bg-gray-100 dark:bg-slate-800"
              )}
            >
              {type === "cleaning" ? (
                <Brush size={14} className={isDone ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-slate-300"} />
              ) : (
                <CheckSquare size={14} className={isDone ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-slate-300"} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium text-gray-900 dark:text-slate-100", isDone && "line-through text-gray-400 dark:text-slate-500")}>
                {task.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {task.location ?? task.category} · {task.assignedMember?.user?.name} · {t("মেয়াদ:", "Due:")} {formatShortDate(task.dueDate)}
              </p>
              {task.recurrence && <p className="text-xs text-primary font-medium">{t("↻ পুনরাবৃত্তি", "↻ Recurring")}</p>}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isOverdue ? "bg-red-50 text-red-700 border-red-200" : isDone ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              {isOverdue ? t("মেয়াদোত্তীর্ণ", "Overdue") : isDone ? t("সম্পন্ন", "Done") : t("বাকি", "Pending")}
            </Badge>
            {!isDone && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 gap-1 text-xs"
                onClick={() => handleComplete(task.id)}
                disabled={pending}
              >
                <Check size={12} />
                {t("সম্পন্ন", "Done")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
