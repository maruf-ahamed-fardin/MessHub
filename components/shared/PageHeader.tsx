import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}
