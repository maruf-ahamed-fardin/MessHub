import type { Metadata } from "next";
import { getPosts, getActiveNotices } from "@/backend/community/community.repository";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { FeedPost } from "@/components/community/FeedPost";
import { NoticeCard } from "@/components/community/NoticeCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  let posts: any[] = [
    {
      id: "p1",
      content: "Reminder: Please turn off the AC and fan before leaving your room. Electricity bill was higher last month!",
      isPinned: true,
      createdAt: new Date(Date.now() - 86400000),
      author: { id: "u1", name: "Admin (You)", image: null }
    },
    {
      id: "p2",
      content: "Anyone interested in cooking Khichuri + Beef this Friday evening?",
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000 * 2),
      author: { id: "u2", name: "Tanvir Ahmed", image: null }
    },
  ];

  let notices: any[] = [
    {
      id: "n1",
      title: "Mess Meeting Tonight at 9:00 PM",
      description: "Monthly meal calculation and settlement discussion in the dining area. Everyone must attend.",
      priority: "IMPORTANT",
      createdAt: new Date(),
      author: { name: "Admin" },
    }
  ];

  try {
    const [dbPosts, dbNotices] = await Promise.all([getPosts(30), getActiveNotices()]);
    if (dbPosts.length > 0) posts = dbPosts;
    if (dbNotices.length > 0) notices = dbNotices;
  } catch {}

  return (
    <div>
      <PageHeader
        title="Community"
        description="Mess feed, notices, and announcements"
        action={<CreatePostDialog isAdmin={isAdmin} authorId={session?.user.id ?? "u1"} />}
      />
      <Tabs defaultValue="feed">
        <TabsList className="mb-4">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="notices">Notices ({notices.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="feed">
          {posts.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No posts yet" description="Be the first to post something!" />
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <FeedPost key={post.id} post={post} isAdmin={isAdmin} currentUserId={session?.user.id ?? "u1"} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="notices">
          {notices.length === 0 ? (
            <EmptyState icon={MessageSquare} title="You're all caught up" description="No active notices." />
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
