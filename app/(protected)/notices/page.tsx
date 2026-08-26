import type { Metadata } from "next";
import { getActiveNotices } from "@/backend/community/community.repository";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { NoticeCard } from "@/components/community/NoticeCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bell } from "lucide-react";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Notices" };

export default async function NoticesPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";

  let notices: any[] = [
    {
      id: "n1",
      title: "Mess Meeting Tonight at 9:00 PM",
      description: "Monthly meal calculation and settlement discussion in the dining area. Everyone must attend.",
      priority: "IMPORTANT",
      createdAt: new Date(),
      author: { name: "Admin" },
    },
    {
      id: "n2",
      title: "Water Tank Cleaning Tomorrow Morning",
      description: "Water supply will be temporarily paused from 8:00 AM to 11:00 AM. Please store necessary water beforehand.",
      priority: "NORMAL",
      createdAt: new Date(Date.now() - 86400000),
      author: { name: "Admin" },
    }
  ];

  try {
    const dbNotices = await getActiveNotices();
    if (dbNotices.length > 0) notices = dbNotices;
  } catch {}

  const count = notices.length;
  const descriptionText = count === 0
    ? T.pages.notices.noNotices
    : `${count} ${count === 1 ? T.pages.notices.activeNotice : T.pages.notices.activeNotices}`;

  return (
    <div>
      <PageHeader title={T.pages.notices.title} description={descriptionText} />
      {notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={T.pages.notices.noNotices}
          description={T.pages.notices.allClear}
        />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
