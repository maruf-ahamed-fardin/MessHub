import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { TopBar } from "@/components/shared/TopBar";
import { AIAssistantWidget } from "@/components/ai/AIAssistantWidget";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[hsl(var(--background))]">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto bottom-nav-safe md:pb-0">
          <div className="page-container fade-in">{children}</div>
        </main>
      </div>

      {/* Global AI Assistant Floating Buddy */}
      <AIAssistantWidget user={session.user} />

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
