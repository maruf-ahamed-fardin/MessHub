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
  ThumbsUp, Heart, Flame, Lightbulb, Image as ImageIcon,
  Video, AtSign, X, Reply, ChevronDown, ChevronUp,
  UploadCloud, Link as LinkIcon, FileText, Sparkles,
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

const EMOJI_OPTIONS = [
  { emoji: "👍", label: "লাইক" },
  { emoji: "❤️", label: "লাভ" },
  { emoji: "🔥", label: "দারুণ" },
  { emoji: "💡", label: "আইডিয়া" },
];

// Helper to highlight @mentions in text
function renderFormattedContent(content: string) {
  const parts = content.split(/(@[A-Za-z0-9_.\s]+(?=\s|$|[.,!?]))/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={i}
          className="inline-block font-extrabold text-indigo-600 bg-indigo-50/90 border border-indigo-200/80 px-1.5 py-0.2 rounded-md hover:bg-indigo-100 transition-colors"
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
  const [posts, setPosts] = useState(initialPosts);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"GENERAL" | "ANNOUNCEMENT" | "IDEA" | "ISSUE">("GENERAL");
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "pinned" | "media">("all");

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
          setMediaFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  // Handle Local Video File Select
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      alert("ভিডিও ফাইলটি অনেক বড় (৩০MB এর বেশি)। ছোট ভিডিও আপলোড করুন।");
      return;
    }

    setMediaFileName(file.name);
    setCompressionStats({
      dataUrl: "",
      originalSize: file.size,
      compressedSize: file.size,
      reductionPercentage: 0,
      fileName: file.name,
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoUrl(event.target.result as string);
        setImageUrl(""); // clear image if video selected
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset input
  };

  // Watch for "@" in textarea to trigger mention autocomplete
  const handleContentChange = (val: string) => {
    setContent(val);
    const lastAtIdx = val.lastIndexOf("@");
    if (lastAtIdx !== -1 && lastAtIdx >= val.length - 15) {
      const query = val.slice(lastAtIdx + 1).toLowerCase();
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleSelectMention = (memberName: string) => {
    const lastAtIdx = content.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const updated = content.slice(0, lastAtIdx) + `@${memberName} `;
      setContent(updated);
    }
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  // Create New Post
  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !imageUrl && !videoUrl) return;

    setSubmitting(true);
    const newPost = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      type: postType,
      imageUrl: imageUrl.trim() || null,
      videoUrl: videoUrl.trim() || null,
      isPinned: postType === "ANNOUNCEMENT" && isAdmin,
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUserName,
        image: null,
      },
      comments: [],
      reactions: [],
    };

    setPosts([newPost, ...posts]);
    setContent("");
    setImageUrl("");
    setVideoUrl("");
    setMediaFileName("");
    setShowUrlInput(null);

    try {
      await createPostAction({
        type: postType,
        content: newPost.content,
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
    if (!confirm("Are you sure you want to delete this post?")) return;
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

  // Add Comment or Nested Reply
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
        return <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">📢 ঘোষণা</Badge>;
      case "IDEA":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">💡 প্রস্তাব</Badge>;
      case "ISSUE":
        return <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">⚠️ সমস্যা</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200">💬 আলোচনা</Badge>;
    }
  };

  const filteredMentionMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-44">
      {/* Hidden File Inputs for Device Image & Video Upload */}
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

      {/* 1. Header Filter Bar & Activity Pulse (Spacious Width) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            সব পোস্ট ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("pinned")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeFilter === "pinned" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            📌 পিন করা ({posts.filter((p) => p.isPinned).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("media")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeFilter === "media" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            📸 মিডিয়া ({posts.filter((p) => p.imageUrl || p.videoUrl).length})
          </button>
        </div>

        {/* Live Members Pulse */}
        <div className="flex items-center gap-2 pr-1">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-extrabold text-gray-700">
            ৭ জন মেম্বার লাইভ সক্রিয়
          </span>
        </div>
      </div>

      {/* 2. Main Feed Posts Stream (Spacious Cards) */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center text-xs text-gray-400 shadow-2xs">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30 text-indigo-500" />
            <p className="font-bold text-sm text-gray-700">কোনো পোস্ট পাওয়া যায়নি।</p>
            <p className="text-gray-400 mt-1">নিচের ফ্লোটিং পোস্ট বার থেকে ছবি, ভিডিও বা বার্তা লিখে পোস্ট করুন!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const authorName = post.author?.name ?? post.authorName ?? "মেম্বার";
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
                  "bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all space-y-4",
                  post.isPinned && "border-indigo-200 bg-indigo-50/15 ring-1 ring-indigo-200/60"
                )}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-11 w-11 shrink-0 border-2 border-indigo-100 shadow-2xs">
                      <AvatarFallback className="text-xs font-black bg-indigo-50 text-indigo-600">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900 truncate">
                          {authorName}
                        </span>
                        {getTagBadge(post.type)}
                        {post.isPinned && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100">
                            📌 পিন করা
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
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
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
                            <span>{post.isPinned ? "আনপিন করুন" : "পিন করুন"}</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeletePost(post.id)}
                          className="text-rose-600 focus:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={13} className="mr-2" />
                          <span>মুছে ফেলুন</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Post Content Body */}
                {post.content && (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {renderFormattedContent(post.content)}
                  </p>
                )}

                {/* Attached Image (Wide & High-Res Frame) */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200/90 bg-gray-50 max-h-96 shadow-2xs">
                    <img
                      src={post.imageUrl}
                      alt="Post attachment"
                      className="w-full h-full object-cover max-h-96 hover:scale-[1.01] transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Attached Video */}
                {post.videoUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200/90 bg-black max-h-96 shadow-2xs">
                    <video src={post.videoUrl} controls className="w-full max-h-96 object-contain" />
                  </div>
                )}

                {/* Reactions & Comment Bar */}
                <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  {/* Emoji Reactions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map(({ emoji }) => {
                      const matching = postReactions.filter((r: any) => r.emoji === emoji);
                      const hasReacted = matching.some((r: any) => r.userId === currentUserId);
                      const count = matching.length;

                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(post.id, emoji)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none",
                            hasReacted
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs scale-105"
                              : count > 0
                              ? "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
                              : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                          )}
                          title="রিঅ্যাকশন দিন"
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Comment & Reply Count Button */}
                  <button
                    type="button"
                    onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none",
                      isCommentsOpen || postComments.length > 0
                        ? "text-primary bg-primary/10 hover:bg-primary/15"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <MessageSquare size={14} />
                    <span>{postComments.length > 0 ? `${postComments.length} মন্তব্য ও রিপ্লাই` : "মন্তব্য করুন"}</span>
                    {isCommentsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* 3. Threaded Comments & Nested Replies Box */}
                {isCommentsOpen && (
                  <div className="pt-4 border-t border-gray-100 space-y-3.5 animate-in fade-in-0 duration-150">
                    {/* Comments List */}
                    {rootComments.length > 0 && (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {rootComments.map((comment: any) => {
                          const cAuthor = comment.author?.name || "মেম্বার";
                          const cInitials = cAuthor.replace(/[()]/g, "").trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "M";
                          const replies = getReplies(comment.id);

                          return (
                            <div key={comment.id} className="space-y-2.5">
                              {/* Root Comment */}
                              <div className="flex items-start gap-3 text-xs bg-gray-50/90 rounded-2xl p-3.5 border border-gray-100">
                                <Avatar className="h-8 w-8 shrink-0 mt-0.5 border border-primary/20">
                                  <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                    {cInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-black text-gray-900 text-xs">{cAuthor}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">{formatRelativeDate(new Date(comment.createdAt))}</span>
                                  </div>
                                  <p className="text-gray-700 text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                                    {renderFormattedContent(comment.content)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo((prev) => ({ ...prev, [post.id]: { id: comment.id, name: cAuthor } }));
                                      setCommentInputs((prev) => ({ ...prev, [post.id]: `@${cAuthor} ` }));
                                    }}
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    <Reply size={12} />
                                    <span>রিপ্লাই</span>
                                  </button>
                                </div>
                              </div>

                              {/* Nested Replies (রিপ্লাইয়ের রিপ্লাই) */}
                              {replies.length > 0 && (
                                <div className="pl-8 border-l-2 border-indigo-200 space-y-2.5">
                                  {replies.map((reply: any) => {
                                    const rAuthor = reply.author?.name || "মেম্বার";
                                    const rInitials = rAuthor.replace(/[()]/g, "").trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "M";

                                    return (
                                      <div key={reply.id} className="flex items-start gap-2.5 text-xs bg-indigo-50/40 rounded-2xl p-3 border border-indigo-100/70">
                                        <Avatar className="h-7 w-7 shrink-0 mt-0.5 border border-indigo-200">
                                          <AvatarFallback className="text-[9px] font-black bg-indigo-100 text-indigo-700">
                                            {rInitials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="font-extrabold text-gray-900 text-[11px]">{rAuthor}</span>
                                            <span className="text-[9px] text-gray-400">{formatRelativeDate(new Date(reply.createdAt))}</span>
                                          </div>
                                          <p className="text-gray-700 text-xs mt-0.5 leading-relaxed whitespace-pre-wrap">
                                            {renderFormattedContent(reply.content)}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReplyingTo((prev) => ({ ...prev, [post.id]: { id: comment.id, name: rAuthor } }));
                                              setCommentInputs((prev) => ({ ...prev, [post.id]: `@${rAuthor} ` }));
                                            }}
                                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                          >
                                            <Reply size={11} />
                                            <span>রিপ্লাই</span>
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
                      <div className="flex items-center justify-between bg-indigo-50 px-3.5 py-1.5 rounded-xl text-xs text-indigo-700 font-semibold border border-indigo-100">
                        <span className="flex items-center gap-1.5">
                          <Reply size={13} />
                          <span>@{activeReplyTarget.name} এর মন্তব্যে রিপ্লাই দিচ্ছেন...</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))}
                          className="text-gray-500 hover:text-gray-900 cursor-pointer"
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
                      <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
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
                          placeholder={activeReplyTarget ? `@${activeReplyTarget.name} এর উত্তরে লিখুন...` : "একটি মন্তব্য লিখুন..."}
                          className="w-full text-xs bg-transparent border-0 outline-none placeholder:text-gray-400 py-1"
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

      {/* ========================================================================= */}
      {/* 3. WIDE STICKY BOTTOM POST COMPOSER (max-w-4xl, Image & Video File Uploads) */}
      {/* ========================================================================= */}
      <div
        ref={bottomComposerRef}
        className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-auto sm:w-[896px] sm:max-w-4xl mx-auto z-40"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-2xl shadow-2xl p-3.5 sm:p-4 space-y-2.5 ring-1 ring-black/5 animate-in slide-in-from-bottom-3 duration-200">
          {/* Loading Compression Status */}
          {isCompressing && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-indigo-700 text-xs font-bold animate-pulse">
              <Sparkles size={15} className="animate-spin text-indigo-600" />
              <span>ছবিটি স্বয়ংক্রিয়ভাবে কম্প্রেস ও অপটিমাইজ করা হচ্ছে...</span>
            </div>
          )}

          {/* Top Row: Floating Media Previews with Compression Badge */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 max-h-44 bg-gray-50 flex items-center justify-center">
              <img src={imageUrl} alt="Attached Preview" className="max-h-44 object-contain" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                <div className="bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ImageIcon size={11} />
                  <span className="truncate max-w-36">{mediaFileName || "ছবি"}</span>
                </div>
                {compressionStats && compressionStats.reductionPercentage > 0 && (
                  <div className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <span>⚡ সাইজ কমানো হয়েছে: {formatFileSize(compressionStats.originalSize)} ➔ {formatFileSize(compressionStats.compressedSize)} (-{compressionStats.reductionPercentage}%)</span>
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
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black max-h-44 flex items-center justify-center">
              <video src={videoUrl} controls className="max-h-44 object-contain" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <div className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Video size={11} />
                  <span>{mediaFileName || "ভিডিও"}</span>
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
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2 animate-in fade-in duration-100">
              <LinkIcon size={15} className="text-indigo-600 shrink-0" />
              <input
                type="url"
                placeholder={showUrlInput === "image" ? "ছবির ওয়েব লিঙ্ক (Image URL) দিন..." : "ভিডিওর ওয়েব লিঙ্ক (Video URL) দিন..."}
                value={showUrlInput === "image" ? imageUrl : videoUrl}
                onChange={(e) => {
                  if (showUrlInput === "image") setImageUrl(e.target.value);
                  else setVideoUrl(e.target.value);
                }}
                className="flex-1 text-xs bg-transparent border-0 outline-none text-gray-800 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowUrlInput(null)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-0.5"
              >
                ঠিক আছে
              </button>
            </div>
          )}

          {/* Mention Suggestions Floating Dropdown */}
          {showMentionMenu && filteredMentionMembers.length > 0 && (
            <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
              <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                মেম্বার মেনশন করুন (@)
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredMentionMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMention(m.name)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="truncate">@{m.name}</span>
                    {m.room && <span className="text-[10px] text-gray-400">{m.room}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-end gap-3">
            <Avatar className="h-9 w-9 shrink-0 mb-1 border border-primary/20">
              <AvatarFallback className="text-xs font-black bg-indigo-50 text-indigo-600">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200/90 rounded-2xl px-3.5 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
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
                placeholder="মেসের মেম্বারদের কিছু জানান... (@ লিখে মেনশন করুন, ফাইল থেকে ছবি/ভিডিও আপলোড করুন)"
                className="w-full text-xs sm:text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[38px] max-h-32 placeholder:text-gray-400 leading-relaxed bg-transparent outline-none"
                maxLength={3000}
                rows={1}
              />

              {/* Bottom Quick Tag Selection & File Action Icons inside Composer */}
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/50 mt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPostType("GENERAL")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                      postType === "GENERAL" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    💬 সাধারণ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("ANNOUNCEMENT")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                      postType === "ANNOUNCEMENT" ? "bg-rose-600 text-white" : "text-rose-700 hover:bg-rose-100"
                    )}
                  >
                    📢 ঘোষণা
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("IDEA")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                      postType === "IDEA" ? "bg-amber-500 text-white" : "text-amber-700 hover:bg-amber-100"
                    )}
                  >
                    💡 প্রস্তাব
                  </button>
                </div>

                {/* Native File Upload & Action Buttons */}
                <div className="flex items-center gap-1">
                  {/* Upload Image from Device File */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className={cn(
                      "px-2 py-1 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
                      imageUrl && "text-indigo-600 bg-indigo-50"
                    )}
                    title="ডিভাইস থেকে ছবি আপলোড করুন"
                  >
                    <ImageIcon size={15} />
                    <span className="hidden sm:inline">ছবি আপলোড</span>
                  </button>

                  {/* Upload Video from Device File */}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className={cn(
                      "px-2 py-1 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
                      videoUrl && "text-purple-600 bg-purple-50"
                    )}
                    title="ডিভাইস থেকে ভিডিও আপলোড করুন"
                  >
                    <Video size={15} />
                    <span className="hidden sm:inline">ভিডিও আপলোড</span>
                  </button>

                  {/* Mention Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setContent((prev) => prev + " @");
                      setShowMentionMenu(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="মেম্বার মেনশন করুন (@)"
                  >
                    <AtSign size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Glowing Send Button */}
            <Button
              type="button"
              size="sm"
              onClick={() => handleCreatePost()}
              disabled={(!content.trim() && !imageUrl && !videoUrl) || submitting}
              className="h-11 w-11 p-0 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 mb-0.5 flex items-center justify-center"
              title="পোস্ট করুন"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
