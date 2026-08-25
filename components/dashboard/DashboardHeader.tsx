import { formatDate } from "@/lib/utils/date";

interface DashboardHeaderProps {
  name: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  const firstName = name.split(" ")[0];
  const today = new Date();
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">
        {getGreeting()}, {firstName} 👋
      </h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
        {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>
  );
}
