import type { Metadata } from "next";
import { getPosts } from "@/backend/community/community.repository";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { CommunityFeedHub } from "@/components/community/CommunityFeedHub";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Community Feed" };

export default async function CommunityPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";

  let posts: any[] = [];
  let members: any[] = [];

  try {
    const [dbPosts, dbMembers] = await Promise.all([
      getPosts(30),
      prisma.memberProfile.findMany({
        where: { isActive: true },
        include: {
          user: { select: { id: true, name: true } },
          room: { select: { name: true } },
        },
      }),
    ]);

    posts = dbPosts;
    members = dbMembers.map((m) => ({
      id: m.userId,
      name: m.user.name ?? "Member",
      room: m.room?.name ?? undefined,
    }));
  } catch (err) {
    console.warn("DB offline (demo mode community):", err);
  }

  // Fallback if no posts
  if (posts.length === 0) {
    posts = [
      {
        id: "p1",
        content: "Reminder: Please turn off the AC and fan before leaving your room. Let's keep electricity costs reasonable! @Tanvir Ahmed @Rahim Chowdhury",
        type: "ANNOUNCEMENT",
        isPinned: true,
        createdAt: new Date(Date.now() - 3600000),
        author: { id: "u1", name: "Admin (You)", image: null },
        comments: [
          {
            id: "c1",
            postId: "p1",
            authorId: "u2",
            content: "Got it bhai, checked my room fans! 👍",
            createdAt: new Date(Date.now() - 1800000),
            author: { id: "u2", name: "Tanvir Ahmed", image: null },
          },
        ],
        reactions: [
          { id: "r1", postId: "p1", userId: "u1", emoji: "👍" },
          { id: "r2", postId: "p1", userId: "u2", emoji: "❤️" },
        ],
      },
    ];
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pages.community.title}
        description={T.pages.community.description}
      />

      <CommunityFeedHub
        posts={posts}
        isAdmin={isAdmin}
        currentUserId={session?.user.id ?? "admin-user"}
        currentUserName={session?.user.name ?? "Admin (You)"}
        members={members.length > 0 ? members : undefined}
      />
    </div>
  );
}
