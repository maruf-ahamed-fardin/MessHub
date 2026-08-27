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
        content: `<!--MH_META:{"sos":{"alertLevel":"HIGH","acknowledgedUserIds":["u1","u2"]}}-->\nজরুরি সতর্কতা: মেইন গেটের তালা রাতে অবশ্যই দুই প্যাঁচ দিতে হবে। কেউ ভুলবেন না! @Tanvir Ahmed @Rahim Chowdhury`,
        type: "ANNOUNCEMENT",
        isPinned: true,
        createdAt: new Date(Date.now() - 1800000),
        author: { id: "u1", name: "Admin (You)", image: null },
        comments: [
          {
            id: "c1",
            postId: "p1",
            authorId: "u2",
            content: "Got it bhai, checked and locked! 👍",
            createdAt: new Date(Date.now() - 900000),
            author: { id: "u2", name: "Tanvir Ahmed", image: null },
          },
        ],
        reactions: [
          { id: "r1", postId: "p1", userId: "u1", emoji: "👍" },
          { id: "r2", postId: "p1", userId: "u2", emoji: "❤️" },
        ],
      },
      {
        id: "p2",
        content: `<!--MH_META:{"poll":{"question":"শুক্রবার রাতে কী আয়োজন করা হবে?","options":[{"id":"opt-1","text":"🍗 মোরগ পোলাও ও সালাদ","votes":["u2"]},{"id":"opt-2","text":"🍲 স্পেশাল ভুনা খিচুড়ি ও ডিম","votes":["u1"]},{"id":"opt-3","text":"🍚 সাধারণ ভাত ও রুই মাছ","votes":[]}]}}-->\nসকল মেম্বারদের মতামত দেওয়ার জন্য অনুরোধ করা হচ্ছে। সবাই ভোট দিন!`,
        type: "IDEA",
        isPinned: false,
        createdAt: new Date(Date.now() - 7200000),
        author: { id: "u2", name: "Tanvir Ahmed", image: null },
        comments: [],
        reactions: [
          { id: "r3", postId: "p2", userId: "u1", emoji: "🔥" },
        ],
      },
      {
        id: "p3",
        content: `<!--MH_META:{"expenseSplit":{"title":"ডাইনিং রুমের জন্য ২০ লিটার মিনারেল পানির জার","totalAmount":100,"currency":"৳","participants":[{"id":"u1","name":"Admin"},{"id":"u2","name":"Tanvir Ahmed"},{"id":"u3","name":"Rahim Chowdhury"}]}}-->\nপানির জার ডেলিভারি নেওয়া হয়েছে। যারা পানি ব্যবহার করবেন স্প্লিটে যোগ দিন।`,
        type: "GENERAL",
        isPinned: false,
        createdAt: new Date(Date.now() - 14400000),
        author: { id: "u3", name: "Rahim Chowdhury", image: null },
        comments: [],
        reactions: [{ id: "r4", postId: "p3", userId: "u1", emoji: "👏" }],
      },
      {
        id: "p4",
        content: `<!--MH_META:{"event":{"title":"মেস গেট-টুগেদার ও ক্রিকেট ম্যাচ ফিস্ট","date":"২০২৬-০৮-৩১","budgetPerPerson":250,"rsvps":{"going":["u1","u2"],"maybe":[],"cant":[]}}}-->\nআসন্ন ছুটির দিনে আমাদের মেসের মিনি টুর্নামেন্ট ও ডিনার পার্টি। সবাই কনফার্ম করুন!`,
        type: "IDEA",
        isPinned: false,
        createdAt: new Date(Date.now() - 21600000),
        author: { id: "u1", name: "Admin (You)", image: null },
        comments: [],
        reactions: [{ id: "r5", postId: "p4", userId: "u2", emoji: "🎉" }],
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
