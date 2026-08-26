"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Pin, Trash2, MoreHorizontal, Send,
  Image as ImageIcon, Video, AtSign, X, Reply, ChevronDown, ChevronUp,
  Sparkles, SmilePlus, Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  createPostAction,
  togglePinAction,
  deletePostAction,
  addPostCommentAction,
  togglePostReactionAction,
} from "@/app/actions/app.actions";
import { compressImageFile, formatFileSize, CompressionResult } from "@/lib/utils/media-compression";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MemberItem {
  id: string;
  name: string;
  room?: string;
}

interface CommunityFeedHubProps {
  posts: any[];
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
  members?: MemberItem[];
}

const DEFAULT_MEMBERS: MemberItem[] = [
  { id: "m1", name: "Admin", room: "Room 101" },
  { id: "m2", name: "Tanvir Ahmed", room: "Room 101" },
  { id: "m3", name: "Rahim Chowdhury", room: "Room 102" },
  { id: "m4", name: "Karim Hasan", room: "Room 102" },
  { id: "m5", name: "Nafis Iqbal", room: "Room 103" },
  { id: "m6", name: "Shakil Mahmud", room: "Room 103" },
  { id: "m7", name: "Sifat Khan", room: "Room 103" },
];

// Helper to highlight @mentions in text
function renderFormattedContent(content: string) {
  const parts = content.split(/(@[A-Za-z0-9_.\s]+(?=\s|$|[.,!?]))/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={i}
          className="inline-block font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 px-1.5 py-0.2 rounded-md hover:bg-indigo-100 transition-colors"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function CommunityFeedHub({
  posts: initialPosts,
  isAdmin,
  currentUserId,
  currentUserName,
  members = DEFAULT_MEMBERS,
}: CommunityFeedHubProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const [posts, setPosts] = useState(initialPosts);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"GENERAL" | "ANNOUNCEMENT" | "IDEA" | "ISSUE">("GENERAL");
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "pinned" | "media">("all");
  const [reactionPickerPostId, setReactionPickerPostId] = useState<string | null>(null);

  const WHATSAPP_EMOJIS = [
    { emoji: "👍", label: t("লাইক", "Like") },
    { emoji: "❤️", label: t("লাভ", "Love") },
    { emoji: "😂", label: t("হাসি", "Haha") },
    { emoji: "😮", label: t("বিস্ময়", "Wow") },
    { emoji: "😢", label: t("কষ্ট", "Sad") },
    { emoji: "🙏", label: t("ধন্যবাদ", "Thanks") },
    { emoji: "🔥", label: t("দারুণ", "Fire") },
    { emoji: "💡", label: t("আইডিয়া", "Idea") },
    { emoji: "👏", label: t("সাবাশ", "Clap") },
    { emoji: "🎉", label: t("উদযাপন", "Celebrate") },
  ];

  // Media Attachment States (Files & URLs & Compression)
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaFileName, setMediaFileName] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [showUrlInput, setShowUrlInput] = useState<"image" | "video" | null>(null);

  // Hidden File Input Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Mention system states
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomComposerRef = useRef<HTMLDivElement>(null);

  // Comment & Reply states
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, { id: string; name: string } | null>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  const userInitials = (currentUserName || "Admin")
    .replace(/[()]/g, "")
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";

  // Handle Local Image File Select with Smart Auto Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const res = await compressImageFile(file, 1280, 1280, 0.75);
      setImageUrl(res.dataUrl);
      setVideoUrl(""); // clear video if image selected
      setMediaFileName(file.name);
      setCompressionStats(res);
    } catch (err) {
      console.error("Compression error:", err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setVideoUrl("");
          setMediaFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Local Video File Select
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoUrl(event.target.result as string);
        setImageUrl(""); // clear image if video selected
        setMediaFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle @ Mention Search trigger in input
  const handleContentChange = (val: string) => {
    setContent(val);
    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex >= 0 && lastAtIndex === val.length - 1) {
      setShowMentionMenu(true);
      setMentionQuery("");
    } else if (lastAtIndex >= 0 && showMentionMenu) {
      const query = val.slice(lastAtIndex + 1).trim();
      setMentionQuery(query.toLowerCase());
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (memberName: string) => {
    const lastAtIndex = content.lastIndexOf("@");
    if (lastAtIndex >= 0) {
      const newContent = content.slice(0, lastAtIndex) + `@${memberName} `;
      setContent(newContent);
    }
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  // Create Post
  const handleCreatePost = async () => {
    if (!content.trim() && !imageUrl && !videoUrl) return;
    setSubmitting(true);

    const newPost = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      type: postType,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      isPinned: false,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUserName,
        image: null,
      },
      comments: [],
      reactions: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setContent("");
    setImageUrl("");
    setVideoUrl("");
    setMediaFileName("");
    setCompressionStats(null);
    setShowUrlInput(null);

    try {
      await createPostAction({
        content: newPost.content,
        type: newPost.type,
        imageUrl: newPost.imageUrl || undefined,
        videoUrl: newPost.videoUrl || undefined,
        authorId: currentUserId,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p))
    );
    try {
      await togglePinAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    if (!confirm(t("আপনি কি এই পোস্টটি মুছে ফেলতে চান?", "Are you sure you want to delete this post?"))) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePostAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // React to Post
  const handleReact = async (postId: string, emoji: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentReactions = Array.isArray(p.reactions) ? [...p.reactions] : [];
        const existingIdx = currentReactions.findIndex(
          (r: any) => r.userId === currentUserId && r.emoji === emoji
        );

        if (existingIdx >= 0) {
          currentReactions.splice(existingIdx, 1);
        } else {
          currentReactions.push({
            id: `temp-r-${Date.now()}`,
            postId,
            userId: currentUserId,
            emoji,
          });
        }
        return { ...p, reactions: currentReactions };
      })
    );

    try {
      await togglePostReactionAction({ postId, userId: currentUserId, emoji });
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment
  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const parent = replyingTo[postId];
    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));

    const optimisticComment = {
      id: `temp-c-${Date.now()}`,
      postId,
      authorId: currentUserId,
      parentId: parent ? parent.id : null,
      content: text,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUserName,
        image: null,
      },
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentComments = Array.isArray(p.comments) ? [...p.comments] : [];
        return { ...p, comments: [...currentComments, optimisticComment] };
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setReplyingTo((prev) => ({ ...prev, [postId]: null }));
    setOpenComments((prev) => ({ ...prev, [postId]: true }));

    try {
      await addPostCommentAction({
        postId,
        authorId: currentUserId,
        parentId: parent ? parent.id : undefined,
        content: text,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === "pinned") return p.isPinned;
    if (activeFilter === "media") return !!p.imageUrl || !!p.videoUrl;
    return true;
  });

  const getTagBadge = (type: string) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">{t("📢 ঘোষণা", "📢 Announcement")}</Badge>;
      case "IDEA":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{t("💡 প্রস্তাব", "💡 Idea")}</Badge>;
      case "ISSUE":
        return <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">{t("⚠️ সমস্যা", "⚠️ Issue")}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200">{t("💬 সাধারণ", "💬 Discussion")}</Badge>;
    }
  };

  const filteredMentionMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-44">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoFileChange}
        accept="video/*"
        className="hidden"
      />

      {/* 1. Header Filter Bar & Activity Pulse */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/90 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
              activeFilter === "all" ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            {t(`সব (${posts.length})`, `All (${posts.length})`)}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("pinned")}
            className={cn(
              "px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
              activeFilter === "pinned" ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            {t(`📌 পিন (${posts.filter((p) => p.isPinned).length})`, `📌 Pinned (${posts.filter((p) => p.isPinned).length})`)}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("media")}
            className={cn(
              "px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
              activeFilter === "media" ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            {t(`📸 মিডিয়া (${posts.filter((p) => p.imageUrl || p.videoUrl).length})`, `📸 Media (${posts.filter((p) => p.imageUrl || p.videoUrl).length})`)}
          </button>
        </div>

        {/* Live Members Pulse Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-extrabold shrink-0 shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{t(`${members.length} জন সক্রিয়`, `${members.length} Members Active`)}</span>
        </div>
      </div>

      {/* 2. Main Feed Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl py-16 text-center text-xs text-gray-400 shadow-2xs">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30 text-indigo-500" />
            <p className="font-bold text-sm text-gray-700 dark:text-slate-300">{t("কোনো পোস্ট পাওয়া যায়নি।", "No posts found.")}</p>
            <p className="text-gray-400 dark:text-slate-500 mt-1">{t("নিচের বার থেকে বার্তা লিখে পোস্ট করুন!", "Write something in the composer below to post!")}</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const authorName = post.author?.name ?? post.authorName ?? "Member";
            const initials = authorName
              .replace(/[()]/g, "")
              .trim()
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "M";
            const canModify = isAdmin || post.author?.id === currentUserId || post.authorId === currentUserId;

            const postComments = Array.isArray(post.comments) ? post.comments : [];
            const postReactions = Array.isArray(post.reactions) ? post.reactions : [];
            const isCommentsOpen = !!openComments[post.id];
            const activeReplyTarget = replyingTo[post.id];

            const rootComments = postComments.filter((c: any) => !c.parentId);
            const getReplies = (parentId: string) =>
              postComments.filter((c: any) => c.parentId === parentId);

            return (
              <article
                key={post.id}
                className={cn(
                  "bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-gray-300 dark:hover:border-slate-700 transition-all space-y-4",
                  post.isPinned && "border-indigo-200 dark:border-indigo-800 bg-indigo-50/15 dark:bg-indigo-950/20 ring-1 ring-indigo-200/60 dark:ring-indigo-800/60"
                )}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-11 w-11 shrink-0 border-2 border-indigo-100 dark:border-indigo-900 shadow-2xs">
                      <AvatarFallback className="text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">
                          {authorName}
                        </span>
                        {getTagBadge(post.type)}
                        {post.isPinned && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100 dark:border-indigo-800">
                            {t("📌 পিন করা", "📌 Pinned")}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">
                        {formatRelativeDate(new Date(post.createdAt))}
                      </p>
                    </div>
                  </div>

                  {/* Options Menu */}
                  {canModify && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 text-xs">
                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(post.id)}
                            className="cursor-pointer"
                          >
                            <Pin size={13} className="mr-2" />
                            <span>{post.isPinned ? t("আনপিন করুন", "Unpin Post") : t("পিন করুন", "Pin Post")}</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeletePost(post.id)}
                          className="text-rose-600 focus:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={13} className="mr-2" />
                          <span>{t("মুছে ফেলুন", "Delete Post")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Post Content Body */}
                {post.content && (
                  <p className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                    {renderFormattedContent(post.content)}
                  </p>
                )}

                {/* Attached Image */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200/90 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 max-h-96 shadow-2xs">
                    <img
                      src={post.imageUrl}
                      alt="Post attachment"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover max-h-96 hover:scale-[1.01] transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Attached Video */}
                {post.videoUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200/90 dark:border-slate-800 bg-black max-h-96 shadow-2xs">
                    <video src={post.videoUrl} controls className="w-full max-h-96 object-contain" />
                  </div>
                )}

                {/* Reactions & Comment Bar */}
                <div className="pt-3.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap relative">
                    {WHATSAPP_EMOJIS.filter(({ emoji }) => {
                      const matching = postReactions.filter((r: any) => r.emoji === emoji);
                      return matching.length > 0;
                    }).map(({ emoji }) => {
                      const matching = postReactions.filter((r: any) => r.emoji === emoji);
                      const hasReacted = matching.some((r: any) => r.userId === currentUserId);
                      const count = matching.length;

                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(post.id, emoji)}
                          className={cn(
                            "px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none",
                            hasReacted
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs scale-105"
                              : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                          )}
                        >
                          <span>{emoji}</span>
                          <span className="text-[11px] font-extrabold">{count}</span>
                        </button>
                      );
                    })}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setReactionPickerPostId(reactionPickerPostId === post.id ? null : post.id)
                        }
                        className={cn(
                          "h-8 px-2.5 rounded-full border flex items-center gap-1.5 transition-all text-xs font-semibold select-none cursor-pointer",
                          reactionPickerPostId === post.id
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                            : "bg-gray-50/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        )}
                      >
                        <SmilePlus size={15} className="text-primary" />
                        <span className="text-[11px]">{t("রিঅ্যাক্ট", "React")}</span>
                      </button>

                      {reactionPickerPostId === post.id && (
                        <div className="absolute bottom-full left-0 mb-2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200/90 dark:border-slate-700 shadow-2xl rounded-full px-2.5 py-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                          {WHATSAPP_EMOJIS.map(({ emoji, label }) => {
                            const hasReacted = postReactions.some(
                              (r: any) => r.emoji === emoji && r.userId === currentUserId
                            );
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  handleReact(post.id, emoji);
                                  setReactionPickerPostId(null);
                                }}
                                className={cn(
                                  "text-lg sm:text-xl p-1 rounded-full hover:scale-130 transition-transform active:scale-95 cursor-pointer select-none",
                                  hasReacted && "bg-indigo-100 dark:bg-indigo-900/60"
                                )}
                                title={label}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment & Reply Count Button */}
                  <button
                    type="button"
                    onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none",
                      isCommentsOpen || postComments.length > 0
                        ? "text-primary bg-primary/10 hover:bg-primary/15"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <MessageSquare size={14} />
                    <span>
                      {postComments.length > 0
                        ? t(`${postComments.length} টি মন্তব্য`, `${postComments.length} Comments`)
                        : t("মন্তব্য লিখুন", "Comment")}
                    </span>
                    {isCommentsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* 3. Threaded Comments & Nested Replies Box */}
                {isCommentsOpen && (
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3.5 animate-in fade-in-0 duration-150">
                    {/* Comments List */}
                    {rootComments.length > 0 && (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {rootComments.map((comment: any) => {
                          const cAuthor = comment.author?.name || "Member";
                          const cInitials = cAuthor.replace(/[()]/g, "").trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "M";
                          const replies = getReplies(comment.id);

                          return (
                            <div key={comment.id} className="space-y-2.5">
                              {/* Root Comment */}
                              <div className="flex items-start gap-3 text-xs bg-gray-50/90 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-gray-100 dark:border-slate-800">
                                <Avatar className="h-8 w-8 shrink-0 mt-0.5 border border-primary/20">
                                  <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                    {cInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-black text-gray-900 dark:text-slate-100 text-xs">{cAuthor}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">{formatRelativeDate(new Date(comment.createdAt))}</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-slate-300 text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                                    {renderFormattedContent(comment.content)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo((prev) => ({ ...prev, [post.id]: { id: comment.id, name: cAuthor } }));
                                      setCommentInputs((prev) => ({ ...prev, [post.id]: `@${cAuthor} ` }));
                                    }}
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    <Reply size={12} />
                                    <span>{t("রিপ্লাই", "Reply")}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Nested Replies */}
                              {replies.length > 0 && (
                                <div className="pl-8 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2.5">
                                  {replies.map((reply: any) => {
                                    const rAuthor = reply.author?.name || "Member";
                                    const rInitials = rAuthor.replace(/[()]/g, "").trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "M";

                                    return (
                                      <div key={reply.id} className="flex items-start gap-2.5 text-xs bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-3 border border-indigo-100/70 dark:border-indigo-900/60">
                                        <Avatar className="h-7 w-7 shrink-0 mt-0.5 border border-indigo-200">
                                          <AvatarFallback className="text-[9px] font-black bg-indigo-100 text-indigo-700">
                                            {rInitials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="font-extrabold text-gray-900 dark:text-slate-100 text-[11px]">{rAuthor}</span>
                                            <span className="text-[9px] text-gray-400">{formatRelativeDate(new Date(reply.createdAt))}</span>
                                          </div>
                                          <p className="text-gray-700 dark:text-slate-300 text-xs mt-0.5 leading-relaxed whitespace-pre-wrap">
                                            {renderFormattedContent(reply.content)}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReplyingTo((prev) => ({ ...prev, [post.id]: { id: comment.id, name: rAuthor } }));
                                              setCommentInputs((prev) => ({ ...prev, [post.id]: `@${rAuthor} ` }));
                                            }}
                                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                          >
                                            <Reply size={11} />
                                            <span>{t("রিপ্লাই", "Reply")}</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Replying target indicator banner */}
                    {activeReplyTarget && (
                      <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1.5 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800">
                        <span className="flex items-center gap-1.5">
                          <Reply size={13} />
                          <span>{t(`@${activeReplyTarget.name} এর মন্তব্যে রিপ্লাই দিচ্ছেন...`, `Replying to @${activeReplyTarget.name}...`)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}
                          className="text-gray-500 hover:text-gray-900 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}

                    {/* Comment Input Box */}
                    <div className="flex items-center gap-2.5 pt-1">
                      <Avatar className="h-8 w-8 shrink-0 border border-primary/20">
                        <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder={activeReplyTarget ? t(`@${activeReplyTarget.name} এর উত্তরে লিখুন...`, `Reply to @${activeReplyTarget.name}...`) : t("একটি মন্তব্য লিখুন...", "Write a comment...")}
                          className="w-full text-xs bg-transparent border-0 outline-none text-gray-900 dark:text-slate-100 placeholder:text-gray-400 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim() || commentSubmitting[post.id]}
                          className="h-7 w-7 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-all cursor-pointer shadow-2xs shrink-0"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* 3. STICKY BOTTOM POST COMPOSER */}
      <div
        ref={bottomComposerRef}
        className="fixed bottom-16 md:bottom-5 left-2 right-2 md:left-auto md:right-auto md:w-[896px] md:max-w-4xl mx-auto z-40"
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 sm:p-4 space-y-2.5 ring-1 ring-black/5 animate-in slide-in-from-bottom-3 duration-200">
          {/* Loading Compression Status */}
          {isCompressing && (
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-pulse">
              <Sparkles size={15} className="animate-spin text-indigo-600" />
              <span>{t("ছবিটি স্বয়ংক্রিয়ভাবে কম্প্রেস ও অপটিমাইজ করা হচ্ছে...", "Optimizing and compressing image automatically...")}</span>
            </div>
          )}

          {/* Floating Media Previews */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 max-h-44 bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
              <img src={imageUrl} alt="Attached Preview" loading="lazy" decoding="async" className="max-h-44 object-contain" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                <div className="bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ImageIcon size={11} />
                  <span className="truncate max-w-36">{mediaFileName || t("ছবি", "Image")}</span>
                </div>
                {compressionStats && compressionStats.reductionPercentage > 0 && (
                  <div className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <span>⚡ {formatFileSize(compressionStats.originalSize)} ➔ {formatFileSize(compressionStats.compressedSize)} (-{compressionStats.reductionPercentage}%)</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageUrl("");
                  setMediaFileName("");
                  setCompressionStats(null);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {videoUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-black max-h-44 flex items-center justify-center">
              <video src={videoUrl} controls className="max-h-44 object-contain" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <div className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Video size={11} />
                  <span>{mediaFileName || t("ভিডিও", "Video")}</span>
                </div>
                {compressionStats && compressionStats.originalSize > 0 && (
                  <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <span>{formatFileSize(compressionStats.originalSize)}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoUrl("");
                  setMediaFileName("");
                  setCompressionStats(null);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {showUrlInput && (
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center gap-2 animate-in fade-in duration-100">
              <LinkIcon size={15} className="text-indigo-600 shrink-0" />
              <input
                type="url"
                placeholder={showUrlInput === "image" ? t("ছবির লিঙ্ক দিন...", "Enter image URL...") : t("ভিডিও লিঙ্ক দিন...", "Enter video URL...")}
                value={showUrlInput === "image" ? imageUrl : videoUrl}
                onChange={(e) => {
                  if (showUrlInput === "image") setImageUrl(e.target.value);
                  else setVideoUrl(e.target.value);
                }}
                className="flex-1 text-xs bg-transparent border-0 outline-none text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowUrlInput(null)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2 py-0.5"
              >
                {t("ঠিক আছে", "Done")}
              </button>
            </div>
          )}

          {/* Mention Suggestions Floating Dropdown */}
          {showMentionMenu && filteredMentionMembers.length > 0 && (
            <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
              <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                {t("মেম্বার মেনশন করুন (@)", "Mention Member (@)")}
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredMentionMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMention(m.name)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="truncate">@{m.name}</span>
                    {m.room && <span className="text-[10px] text-gray-400">{m.room}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Input Box */}
          <div className="bg-gray-50/90 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all space-y-2">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && (content.trim() || imageUrl || videoUrl)) {
                  e.preventDefault();
                  handleCreatePost();
                }
              }}
              placeholder={t("মেসের মেম্বারদের কিছু জানান... (@ লিখে মেনশন করুন)", "Share an update with mess members... (type @ to mention)")}
              className="w-full text-xs sm:text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[38px] max-h-32 placeholder:text-gray-400 leading-relaxed bg-transparent outline-none text-gray-900 dark:text-slate-100"
              maxLength={3000}
              rows={1}
            />

            {/* Bottom Quick Tag Selection & File Action Toolbar */}
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 dark:border-slate-700 flex-wrap gap-2">
              {/* Left: Post Category Tags */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPostType("GENERAL")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    postType === "GENERAL" ? "bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-2xs" : "text-gray-500 hover:bg-gray-200/80 dark:hover:bg-slate-700"
                  )}
                >
                  {t("💬 সাধারণ", "💬 General")}
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("ANNOUNCEMENT")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    postType === "ANNOUNCEMENT" ? "bg-rose-600 text-white shadow-2xs" : "text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                  )}
                >
                  {t("📢 ঘোষণা", "📢 Announcement")}
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("IDEA")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    postType === "IDEA" ? "bg-amber-500 text-white shadow-2xs" : "text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                  )}
                >
                  {t("💡 প্রস্তাব", "💡 Idea")}
                </button>
              </div>

              {/* Right: Media Picker Icons & Send Button */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={cn(
                    "p-1.5 rounded-xl border text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all cursor-pointer",
                    imageUrl ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  )}
                  title={t("ছবি আপলোড", "Upload image")}
                >
                  <ImageIcon size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className={cn(
                    "p-1.5 rounded-xl border text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 transition-all cursor-pointer",
                    videoUrl ? "bg-purple-50 border-purple-200 text-purple-600 shadow-2xs" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  )}
                  title={t("ভিডিও আপলোড", "Upload video")}
                >
                  <Video size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setContent((prev) => prev + " @");
                    setShowMentionMenu(true);
                  }}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title={t("মেম্বার মেনশন (@)", "Mention member (@)")}
                >
                  <AtSign size={15} />
                </button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCreatePost()}
                  disabled={(!content.trim() && !imageUrl && !videoUrl) || submitting}
                  className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-700 shadow-xs hover:shadow-md transition-all cursor-pointer font-bold text-xs gap-1.5 select-none"
                >
                  <span>{t("পোস্ট", "Post")}</span>
                  <Send size={12} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
