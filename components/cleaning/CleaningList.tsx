"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Brush, CheckSquare, Calendar, Plus, Check, MoreHorizontal, RotateCcw } from "lucide-react";
import { completeCleaningTaskAction, createCleaningTaskAction } from "@/app/actions/app.actions";
import { formatShortDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

interface CleaningListProps {
  tasks: any[];
  isAdmin: boolean;
  type: "cleaning" | "household";
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-warning",
  DONE: "badge-success",
  OVERDUE: "badge-urgent",
};

export function CleaningList({ tasks, isAdmin, type }: CleaningListProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (tasks.length === 0) {
    return <EmptyState icon={type === "cleaning" ? Brush : CheckSquare} title={`No ${type === "cleaning" ? "cleaning" : "household"} tasks`} description="All caught up!" />;
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
          <div key={task.id} className={cn(
            "bg-white border rounded-[var(--radius)] px-4 py-3 flex items-center gap-3",
            isDone ? "border-[hsl(var(--border))] opacity-60" : isOverdue ? "border-red-200" : "border-[hsl(var(--border))]"
          )}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              isDone ? "bg-green-50" : "bg-[hsl(var(--secondary))]")}>
              {type === "cleaning" ? <Brush size={14} className={isDone ? "text-green-600" : "text-[hsl(var(--secondary-foreground))]"} />
                : <CheckSquare size={14} className={isDone ? "text-green-600" : "text-[hsl(var(--secondary-foreground))]"} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", isDone && "line-through text-[hsl(var(--muted-foreground))]")}>{task.title}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {task.location ?? task.category} · {task.assignedMember?.user?.name} · Due {formatShortDate(task.dueDate)}
              </p>
              {task.recurrence && <p className="text-xs text-[hsl(var(--primary))]">↻ Recurring</p>}
            </div>
            <Badge variant="outline" className={`text-xs ${STATUS_STYLES[isOverdue ? "OVERDUE" : task.status] ?? ""}`}>
              {isOverdue ? "Overdue" : task.status}
            </Badge>
            {!isDone && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 gap-1 text-xs"
                onClick={() => handleComplete(task.id)}
                disabled={pending}
              >
                <Check size={12} />Done
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
