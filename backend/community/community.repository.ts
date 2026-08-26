import { prisma } from "@/lib/db/prisma";

export async function getPosts(limit = 30) {
  return prisma.communityPost.findMany({
    include: {
      author: { select: { id: true, name: true, image: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: {
        select: { id: true, emoji: true, userId: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function createPost(data: {
  type: string;
  content: string;
  imageUrl?: string;
  authorId: string;
}) {
  return prisma.communityPost.create({
    data: { ...data, type: data.type as any },
    include: {
      author: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      reactions: true,
    },
  });
}

export async function addPostComment(data: {
  postId: string;
  authorId: string;
  content: string;
}) {
  return prisma.postComment.create({
    data,
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function togglePostReaction(data: {
  postId: string;
  userId: string;
  emoji: string;
}) {
  const existing = await prisma.postReaction.findUnique({
    where: {
      postId_userId_emoji: {
        postId: data.postId,
        userId: data.userId,
        emoji: data.emoji,
      },
    },
  });

  if (existing) {
    return prisma.postReaction.delete({
      where: { id: existing.id },
    });
  }

  return prisma.postReaction.create({
    data,
  });
}

export async function togglePin(id: string) {
  const post = await prisma.communityPost.findUnique({ where: { id } });
  if (!post) throw new Error("Post not found.");
  return prisma.communityPost.update({
    where: { id },
    data: { isPinned: !post.isPinned },
  });
}

export async function deletePost(id: string) {
  return prisma.communityPost.delete({ where: { id } });
}

export async function getActiveNotices() {
  return prisma.notice.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { author: { select: { name: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function createNotice(data: {
  title: string;
  description: string;
  priority: string;
  authorId: string;
  expiresAt?: Date;
}) {
  return prisma.notice.create({
    data: { ...data, priority: data.priority as any },
  });
}

export async function deleteNotice(id: string) {
  return prisma.notice.delete({ where: { id } });
}

export async function getCalendarEvents(month: number, year: number, userId?: string) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return prisma.calendarEvent.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(userId ? { createdById: userId } : {}),
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { date: "asc" },
  });
}

export async function createCalendarEvent(data: {
  title: string;
  type: string;
  date: Date;
  description?: string;
  createdById: string;
}) {
  return prisma.calendarEvent.create({ data });
}

export async function deleteCalendarEvent(id: string, userId: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event || event.createdById !== userId) {
    throw new Error("Unauthorized to delete this personal schedule.");
  }
  return prisma.calendarEvent.delete({ where: { id } });
}
