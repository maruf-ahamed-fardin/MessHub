import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { getLiveNotifications } from "@/backend/notifications/notification.service";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const notifications = await getLiveNotifications(session?.user?.id, session?.user?.memberId ?? undefined);

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pages.notifications.title}
        description={T.pages.notifications.description}
      />
      <NotificationCenter initialNotifications={notifications} />
    </div>
  );
}
