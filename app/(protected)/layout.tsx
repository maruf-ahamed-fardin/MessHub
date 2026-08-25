import { auth } from "@/lib/auth/config";
import { DEFAULT_MOCK_SESSION } from "@/lib/auth/auth.config";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { TopBar } from "@/components/shared/TopBar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = (await auth()) ?? DEFAULT_MOCK_SESSION;

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

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
