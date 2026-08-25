import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { getLiveNotifications } from "@/backend/notifications/notification.service";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  const notifications = await getLiveNotifications(session?.user.memberId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="মেসের বাজার, টাকা জমা, মিল, ক্লিনিং ডিউটি ও নোটিশের সকল লাইভ নোটিফিকেশন"
      />
      <NotificationCenter initialNotifications={notifications} />
    </div>
  );
}
