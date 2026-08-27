"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Pin,
  Trash2,
  MoreHorizontal,
  Send,
  Image as ImageIcon,
  Video,
  AtSign,
  X,
  Reply,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SmilePlus,
  BarChart2,
  FileText,
  Bookmark,
  BookmarkCheck,
  Edit3,
  Search,
  CheckCircle2,
  Plus,
  Zap,
  Shield,
  BookOpen,
  ArrowRight,
  Download,
  Check,
  Mic,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Users,
  Award,
  Radio,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  createPostAction,
  updatePostAction,
  togglePinAction,
  deletePostAction,
  addPostCommentAction,
  togglePostReactionAction,
} from "@/app/actions/app.actions";
import { compressImageFile, formatFileSize, CompressionResult } from "@/lib/utils/media-compression";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { VoiceRecorder, VoicePlayer, VoiceNoteData } from "./VoiceRecordPlayer";
import { AIFeedSummaryDialog } from "./AIFeedSummaryDialog";
import { GeminiAiIcon } from "@/components/ai/GeminiAiIcon";

export interface MemberItem {
  id: string;
  name: string;
  room?: string;
  karma?: number;
  badge?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // userIds
}

export interface PollData {
  question: string;
  options: PollOption[];
  expiresAt?: string;
  isClosed?: boolean;
}

export interface DocumentAttachment {
  name: string;
  size: number;
  dataUrl?: string;
  fileType: string;
}

export interface ActionCardData {
  type: "PAYMENT" | "BAZAR" | "MEAL" | "CLEANING" | "CUSTOM";
  title: string;
  description?: string;
  buttonText: string;
  href: string;
}

export interface ExpenseSplitData {
  title: string;
  totalAmount: number;
  currency: string;
  participants: Array<{ id: string; name: string }>;
  isSettled?: boolean;
}

export interface EmergencySOSData {
  alertLevel: "HIGH" | "CRITICAL";
  acknowledgedUserIds: string[];
}

export interface DutySwapData {
  taskType: "BAZAR" | "CLEANING" | "COOKING";
  dutyDate: string;
  offerNote?: string;
  swappedWith?: { id: string; name: string };
  isAccepted?: boolean;
}

export interface EventRsvpData {
  title: string;
  date: string;
  time?: string;
  budgetPerPerson?: number;
  rsvps: {
    going: string[];
    maybe: string[];
    cant: string[];
  };
}

export interface PostMetadata {
  poll?: PollData;
  document?: DocumentAttachment;
  action?: ActionCardData;
  voice?: VoiceNoteData;
  expenseSplit?: ExpenseSplitData;
  sos?: EmergencySOSData;
  dutySwap?: DutySwapData;
  event?: EventRsvpData;
  channel?: string; // "all" | "room-101" | "room-102" | "kitchen" | "adda"
  isAnonymous?: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

interface CommunityFeedHubProps {
  posts: any[];
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
  members?: MemberItem[];
}

const DEFAULT_MEMBERS: MemberItem[] = [
  { id: "m1", name: "Admin", room: "Room 101", karma: 120, badge: "👑 Mess Hero" },
  { id: "m2", name: "Tanvir Ahmed", room: "Room 101", karma: 95, badge: "🌟 Star Bazari" },
  { id: "m3", name: "Rahim Chowdhury", room: "Room 102", karma: 80, badge: "🧹 Clean Master" },
  { id: "m4", name: "Karim Hasan", room: "Room 102", karma: 65 },
  { id: "m5", name: "Nafis Iqbal", room: "Room 103", karma: 50 },
  { id: "m6", name: "Shakil Mahmud", room: "Room 103", karma: 70 },
  { id: "m7", name: "Sifat Khan", room: "Room 103", karma: 60 },
];

// Helper to serialize & parse embedded post metadata safely
export function parsePostContent(rawContent: string): { text: string; meta: PostMetadata } {
  if (!rawContent) return { text: "", meta: {} };
  const metaMatch = rawContent.match(/^<!--MH_META:([\s\S]*?)-->\n?/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      const text = rawContent.slice(metaMatch[0].length);
      return { text, meta };
    } catch {
      return { text: rawContent, meta: {} };
    }
  }
  return { text: rawContent, meta: {} };
}

export function serializePostContent(text: string, meta: PostMetadata): string {
  const hasMeta = Object.keys(meta).length > 0 && Object.values(meta).some((v) => v !== undefined);
  if (!hasMeta) return text;
  return `<!--MH_META:${JSON.stringify(meta)}-->\n${text}`;
}

// Helper to highlight @mentions in text
function renderFormattedContent(content: string) {
  const parts = content.split(/(@[A-Za-z0-9_.\s\u0980-\u09FF]+(?=\s|$|[.,!?]))/g);
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

  // Channel Selection (All, Room Channels, Kitchen, Adda)
  const [activeChannel, setActiveChannel] = useState<string>("all");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pinned" | "polls" | "announcements" | "splits" | "sos" | "swaps" | "events" | "media" | "saved"
  >("all");

  // Bookmarking / Saved Posts State (persisted in localStorage)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("messhub_saved_post_ids");
      if (stored) {
        setSavedPostIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load saved posts from localStorage", e);
    }
  }, []);

  const toggleBookmark = (postId: string) => {
    setSavedPostIds((prev) => {
      const updated = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem("messhub_saved_post_ids", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save bookmarks to localStorage", e);
      }
      return updated;
    });
  };

  // Reactions Pickers
  const [reactionPickerPostId, setReactionPickerPostId] = useState<string | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<string, Record<string, string[]>>>({});

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

  // Media Attachment States (Files, URLs, Documents, Voice)
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [attachedDocument, setAttachedDocument] = useState<DocumentAttachment | null>(null);
  const [attachedVoice, setAttachedVoice] = useState<VoiceNoteData | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [mediaFileName, setMediaFileName] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);

  // Poll Creation State inside Composer
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // In-Feed Expense Split Creation State
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);
  const [splitTitle, setSplitTitle] = useState("");
  const [splitAmount, setSplitAmount] = useState<string>("");

  // Duty Swap Creation State
  const [isCreatingSwap, setIsCreatingSwap] = useState(false);
  const [swapDutyType, setSwapDutyType] = useState<"BAZAR" | "CLEANING" | "COOKING">("BAZAR");
  const [swapDate, setSwapDate] = useState("");

  // Event RSVP Creation State
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventBudget, setEventBudget] = useState("");

  // Emergency SOS Toggle
  const [isCreatingSOS, setIsCreatingSOS] = useState(false);

  // Contextual Action Card Attachment State
  const [attachedAction, setAttachedAction] = useState<ActionCardData | null>(null);
  const [showActionSelector, setShowActionSelector] = useState(false);

  // Anonymous Post Toggle
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);

  // Modals
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAISummaryModal, setShowAISummaryModal] = useState(false);

  // Post Edit State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContentText, setEditContentText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Hidden File Input Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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

  // Handle Image Upload with Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const res = await compressImageFile(file, 1280, 1280, 0.75);
      setImageUrl(res.dataUrl);
      setVideoUrl("");
      setMediaFileName(file.name);
      setCompressionStats(res);
    } catch (err) {
      console.error("Compression error:", err);
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

  // Handle Video Upload
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoUrl(event.target.result as string);
        setImageUrl("");
        setMediaFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Document Upload (PDF, Word, TXT, etc.)
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedDocument({
          name: file.name,
          size: file.size,
          dataUrl: event.target.result as string,
          fileType: file.type || "application/octet-stream",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Mention Trigger Handler
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

  // Quick Action Presets
  const ACTION_PRESETS: ActionCardData[] = [
    {
      type: "PAYMENT",
      title: t("মেস পেমেন্ট পরিশোধ", "Mess Payment Settlement"),
      description: t("আপনার মেসের চলতি মাসের ব্যালেন্স বা ইউটিলিটি বিল পরিশোধ করুন।", "Pay your monthly mess balance or utility contribution."),
      buttonText: t("💳 টাকা পরিশোধ করুন", "💳 Make Payment"),
      href: "/payments",
    },
    {
      type: "BAZAR",
      title: t("আজকের বাজার দায়িত্ব", "Today's Bazar Duty"),
      description: t("বাজারের লিস্ট এবং খরচের তালিকা চেক করুন বা শিডিউল বদল করুন।", "Check market item list, costs, or request duty swap."),
      buttonText: t("🛒 বাজার শিডিউল দেখুন", "🛒 View Bazar Schedule"),
      href: "/bazar",
    },
    {
      type: "MEAL",
      title: t("খাবারের মিল পরিবর্তন", "Update Meal Count"),
      description: t("আজকের বা আগামীকালের মিল সময়মতো অফ/অন করুন।", "Toggle your breakfast, lunch, or dinner meal status in time."),
      buttonText: t("🍽️ মিল নিশ্চিত করুন", "🍽️ Confirm Meals"),
      href: "/meals",
    },
    {
      type: "CLEANING",
      title: t("মেস ক্লিনিং ডিউটি", "Mess Cleaning Duty"),
      description: t("রুম ও ডাইনিং পরিচ্ছন্নতার দায়িত্বে কে আছেন তা দেখে নিন।", "Check assigned member for house and kitchen cleaning."),
      buttonText: t("🧹 ক্লিনিং লিস্ট", "🧹 Cleaning List"),
      href: "/house",
    },
  ];

  // Create Post
  const handleCreatePost = async () => {
    const hasPoll = isCreatingPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2;
    const hasSplit = isCreatingSplit && splitTitle.trim() && Number(splitAmount) > 0;
    const hasSwap = isCreatingSwap && swapDate.trim();
    const hasEvent = isCreatingEvent && eventTitle.trim() && eventDate.trim();
    const hasVoice = !!attachedVoice;
    const hasText = !!content.trim();
    const hasMedia = !!imageUrl || !!videoUrl || !!attachedDocument;

    if (!hasText && !hasMedia && !hasPoll && !hasSplit && !hasSwap && !hasEvent && !hasVoice && !isCreatingSOS) return;
    setSubmitting(true);

    const postMeta: PostMetadata = {
      channel: activeChannel !== "all" ? activeChannel : undefined,
    };

    if (hasPoll) {
      postMeta.poll = {
        question: pollQuestion.trim(),
        options: pollOptions
          .filter((o) => o.trim())
          .map((text, idx) => ({
            id: `opt-${idx + 1}-${Date.now()}`,
            text: text.trim(),
            votes: [],
          })),
      };
    }

    if (hasSplit) {
      postMeta.expenseSplit = {
        title: splitTitle.trim(),
        totalAmount: Number(splitAmount),
        currency: "৳",
        participants: [{ id: currentUserId, name: currentUserName }],
      };
    }

    if (hasSwap) {
      postMeta.dutySwap = {
        taskType: swapDutyType,
        dutyDate: swapDate,
        offerNote: content.trim() || undefined,
      };
    }

    if (hasEvent) {
      postMeta.event = {
        title: eventTitle.trim(),
        date: eventDate,
        budgetPerPerson: Number(eventBudget) || undefined,
        rsvps: {
          going: [currentUserId],
          maybe: [],
          cant: [],
        },
      };
    }

    if (isCreatingSOS) {
      postMeta.sos = {
        alertLevel: "HIGH",
        acknowledgedUserIds: [currentUserId],
      };
    }

    if (attachedVoice) {
      postMeta.voice = attachedVoice;
    }

    if (attachedDocument) {
      postMeta.document = attachedDocument;
    }

    if (attachedAction) {
      postMeta.action = attachedAction;
    }

    if (isAnonymousPost) {
      postMeta.isAnonymous = true;
    }

    const finalContent = serializePostContent(content.trim(), postMeta);

    const newPost = {
      id: `temp-${Date.now()}`,
      content: finalContent,
      type: isCreatingSOS ? "ANNOUNCEMENT" : hasPoll ? "IDEA" : postType,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      isPinned: isCreatingSOS,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: isAnonymousPost ? "anon" : currentUserId,
        name: isAnonymousPost ? t("বেনামী মেম্বার", "Anonymous Member") : currentUserName,
        image: null,
      },
      comments: [],
      reactions: [],
    };

    setPosts((prev) => [newPost, ...prev]);

    // Reset composer states
    setContent("");
    setImageUrl("");
    setVideoUrl("");
    setAttachedDocument(null);
    setAttachedVoice(null);
    setAttachedAction(null);
    setMediaFileName("");
    setCompressionStats(null);
    setIsCreatingPoll(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setIsCreatingSplit(false);
    setSplitTitle("");
    setSplitAmount("");
    setIsCreatingSwap(false);
    setSwapDate("");
    setIsCreatingEvent(false);
    setEventTitle("");
    setEventDate("");
    setEventBudget("");
    setIsCreatingSOS(false);
    setIsAnonymousPost(false);

    try {
      await createPostAction({
        content: newPost.content,
        type: newPost.type,
        imageUrl: newPost.imageUrl || undefined,
        videoUrl: newPost.videoUrl || undefined,
        authorId: isAnonymousPost ? "anon" : currentUserId,
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

  // Start Edit Post
  const handleStartEdit = (post: any) => {
    const { text } = parsePostContent(post.content);
    setEditingPostId(post.id);
    setEditContentText(text);
  };

  // Save Edit Post
  const handleSaveEdit = async (postId: string) => {
    if (!editContentText.trim()) return;
    setIsSavingEdit(true);

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { meta } = parsePostContent(post.content);
    meta.isEdited = true;
    meta.editedAt = new Date().toISOString();

    const updatedRaw = serializePostContent(editContentText.trim(), meta);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: updatedRaw, updatedAt: new Date() } : p))
    );

    setEditingPostId(null);
    setEditContentText("");

    try {
      await updatePostAction({
        id: postId,
        content: updatedRaw,
        type: post.type,
        imageUrl: post.imageUrl || undefined,
        videoUrl: post.videoUrl || undefined,
      });
      router.refresh();
    } catch (err) {
      console.error("Edit post error:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Vote on Poll Option
  const handleVotePoll = async (postId: string, optionId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { text, meta } = parsePostContent(post.content);
    if (!meta.poll) return;

    const updatedOptions = meta.poll.options.map((opt) => {
      const hasVoted = opt.votes.includes(currentUserId);
      if (opt.id === optionId) {
        return {
          ...opt,
          votes: hasVoted ? opt.votes.filter((u) => u !== currentUserId) : [...opt.votes, currentUserId],
        };
      } else {
        return {
          ...opt,
          votes: opt.votes.filter((u) => u !== currentUserId),
        };
      }
    });

    meta.poll.options = updatedOptions;
    const updatedRaw = serializePostContent(text, meta);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: updatedRaw } : p))
    );

    try {
      await updatePostAction({ id: postId, content: updatedRaw, type: post.type });
    } catch (err) {
      console.error("Vote poll error:", err);
    }
  };

  // Join or Leave Expense Split
  const handleToggleSplitJoin = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { text, meta } = parsePostContent(post.content);
    if (!meta.expenseSplit) return;

    const alreadyJoined = meta.expenseSplit.participants.some((p) => p.id === currentUserId);
    if (alreadyJoined) {
      meta.expenseSplit.participants = meta.expenseSplit.participants.filter(
        (p) => p.id !== currentUserId
      );
    } else {
      meta.expenseSplit.participants.push({ id: currentUserId, name: currentUserName });
    }

    const updatedRaw = serializePostContent(text, meta);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: updatedRaw } : p))
    );

    try {
      await updatePostAction({ id: postId, content: updatedRaw, type: post.type });
    } catch (err) {
      console.error("Split update error:", err);
    }
  };

  // Acknowledge SOS Alert
  const handleAcknowledgeSOS = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { text, meta } = parsePostContent(post.content);
    if (!meta.sos) return;

    if (!meta.sos.acknowledgedUserIds.includes(currentUserId)) {
      meta.sos.acknowledgedUserIds.push(currentUserId);
    }

    const updatedRaw = serializePostContent(text, meta);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: updatedRaw } : p))
    );

    try {
      await updatePostAction({ id: postId, content: updatedRaw, type: post.type });
    } catch (err) {
      console.error("SOS ack error:", err);
    }
  };

  // Accept Duty Swap
  const handleAcceptDutySwap = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { text, meta } = parsePostContent(post.content);
    if (!meta.dutySwap) return;

    meta.dutySwap.isAccepted = true;
    meta.dutySwap.swappedWith = { id: currentUserId, name: currentUserName };

    const updatedRaw = serializePostContent(text, meta);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: updatedRaw } : p))
    );

    try {
      await updatePostAction({ id: postId, content: updatedRaw, type: post.type });
    } catch (err) {
      console.error("Swap accept error:", err);
    }
  };

  // RSVP to Event
  const handleRsvpEvent = async (postId: string, response: "going" | "maybe" | "cant") => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const { text, meta } = parsePostContent(post.content);
    if (!meta.event) return;

    const { rsvps } = meta.event;
    rsvps.going = rsvps.going.filter((u) => u !== currentUserId);
    rsvps.maybe = rsvps.maybe.filter((u) => u !== currentUserId);
    rsvps.cant = rsvps.cant.filter((u) => u !== currentUserId);

    rsvps[response].push(currentUserId);

    const updatedRaw = serializePostContent(text, meta);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: updatedRaw } : p))
    );

    try {
      await updatePostAction({ id: postId, content: updatedRaw, type: post.type });
    } catch (err) {
      console.error("RSVP error:", err);
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

  // React to Comment
  const handleCommentReact = (commentId: string, emoji: string) => {
    setCommentReactions((prev) => {
      const postReactions = prev[commentId] || {};
      const currentUsers = postReactions[emoji] || [];
      const hasReacted = currentUsers.includes(currentUserId);
      const updatedUsers = hasReacted
        ? currentUsers.filter((u) => u !== currentUserId)
        : [...currentUsers, currentUserId];

      return {
        ...prev,
        [commentId]: {
          ...postReactions,
          [emoji]: updatedUsers,
        },
      };
    });
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

  // Filtered & Searched Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const { text, meta } = parsePostContent(p.content);
      const isBookmarked = savedPostIds.includes(p.id);

      // Channel Filter
      if (activeChannel !== "all") {
        if (meta.channel && meta.channel !== activeChannel) return false;
        if (!meta.channel && activeChannel !== "all") return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const authorMatch = (p.author?.name || "").toLowerCase().includes(query);
        const textMatch = text.toLowerCase().includes(query);
        const pollMatch = meta.poll?.question.toLowerCase().includes(query) || false;
        const splitMatch = meta.expenseSplit?.title.toLowerCase().includes(query) || false;
        const eventMatch = meta.event?.title.toLowerCase().includes(query) || false;
        if (!authorMatch && !textMatch && !pollMatch && !splitMatch && !eventMatch) {
          return false;
        }
      }

      // Tab Filter
      if (activeFilter === "pinned") return p.isPinned;
      if (activeFilter === "polls") return !!meta.poll;
      if (activeFilter === "announcements") return p.type === "ANNOUNCEMENT" || !!meta.sos;
      if (activeFilter === "splits") return !!meta.expenseSplit;
      if (activeFilter === "sos") return !!meta.sos;
      if (activeFilter === "swaps") return !!meta.dutySwap;
      if (activeFilter === "events") return !!meta.event;
      if (activeFilter === "media") return !!p.imageUrl || !!p.videoUrl || !!meta.document || !!meta.voice;
      if (activeFilter === "saved") return isBookmarked;

      return true;
    });
  }, [posts, searchQuery, activeFilter, activeChannel, savedPostIds]);

  const pollCount = useMemo(() => posts.filter((p) => !!parsePostContent(p.content).meta.poll).length, [posts]);
  const splitCount = useMemo(() => posts.filter((p) => !!parsePostContent(p.content).meta.expenseSplit).length, [posts]);
  const sosCount = useMemo(() => posts.filter((p) => !!parsePostContent(p.content).meta.sos).length, [posts]);
  const eventCount = useMemo(() => posts.filter((p) => !!parsePostContent(p.content).meta.event).length, [posts]);

  const getTagBadge = (type: string, meta: PostMetadata) => {
    if (meta.sos) {
      return (
        <Badge variant="outline" className="text-[10px] bg-rose-600 text-white border-rose-500 flex items-center gap-1 font-black animate-pulse shadow-xs">
          <AlertTriangle size={11} className="fill-white" />
          <span>{t("🚨 জরুরি অ্যালার্ট", "🚨 Emergency SOS")}</span>
        </Badge>
      );
    }
    if (meta.poll) {
      return (
        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1 font-bold">
          <BarChart2 size={11} />
          <span>{t("📊 পোল", "📊 Poll")}</span>
        </Badge>
      );
    }
    if (meta.expenseSplit) {
      return (
        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold flex items-center gap-1">
          <DollarSign size={11} />
          <span>{t("💸 খরচ স্প্লিট", "💸 Expense Split")}</span>
        </Badge>
      );
    }
    if (meta.dutySwap) {
      return (
        <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 font-bold flex items-center gap-1">
          <RefreshCw size={11} />
          <span>{t("🔄 সোয়াপ ট্রেড", "🔄 Duty Swap")}</span>
        </Badge>
      );
    }
    if (meta.event) {
      return (
        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 font-bold flex items-center gap-1">
          <Calendar size={11} />
          <span>{t("📅 ফিস্ট / ইভেন্ট", "📅 Feast & Event")}</span>
        </Badge>
      );
    }
    switch (type) {
      case "ANNOUNCEMENT":
        return <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 font-bold">{t("📢 ঘোষণা", "📢 Notice")}</Badge>;
      case "IDEA":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 font-bold">{t("💡 প্রস্তাব", "💡 Idea")}</Badge>;
      case "ISSUE":
        return <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 font-bold">{t("⚠️ সমস্যা", "⚠️ Issue")}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 font-bold">{t("💬 সাধারণ", "💬 Discussion")}</Badge>;
    }
  };

  const filteredMentionMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-48">
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
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleDocumentFileChange}
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.zip"
        className="hidden"
      />

      {/* 1. TOP ROOM & TOPIC CHANNELS BAR */}
      <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/10 dark:from-slate-900 dark:to-indigo-950/60 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: "all", label: t("🌐 All Mess", "🌐 All Mess") },
              { id: "room-101", label: t("🚪 Room 101", "🚪 Room 101") },
              { id: "room-102", label: t("🚪 Room 102", "🚪 Room 102") },
              { id: "room-103", label: t("🚪 Room 103", "🚪 Room 103") },
              { id: "kitchen", label: t("🍳 Kitchen & Meals", "🍳 Kitchen & Meals") },
              { id: "adda", label: t("🎮 Adda & Fun", "🎮 Adda & Fun") },
            ].map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer select-none whitespace-nowrap",
                  activeChannel === ch.id
                    ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xs scale-100"
                    : "bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/70 dark:border-slate-700/60"
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* AI Feed Catchup Action Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAISummaryModal(true)}
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black gap-1.5 shadow-xs hover:shadow-md hover:scale-105 transition-all cursor-pointer shrink-0"
          >
            <GeminiAiIcon size={14} className="animate-pulse text-amber-300" />
            <span>{t("✨ AI সামারি", "✨ AI TL;DR")}</span>
          </Button>
        </div>
      </div>

      {/* 2. SEARCH & ADVANCED FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Search & Actions */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("পোস্ট, মেম্বার বা কীওয়ার্ড দিয়ে খুঁজুন...", "Search posts, members, or topics...")}
              className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mess Rules Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRulesModal(true)}
              className="h-9 px-3 rounded-xl border-gray-200 dark:border-slate-700 text-xs font-bold gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
            >
              <BookOpen size={14} className="text-indigo-500" />
              <span className="hidden sm:inline">{t("মেসের নিয়মাবলী", "Mess Rules")}</span>
            </Button>

            {/* Active Members Live Pulse */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-black shadow-2xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t(`${members.length} সক্রিয়`, `${members.length} Active`)}</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: "all", label: t(`সব (${posts.length})`, `All (${posts.length})`) },
            { id: "pinned", label: `📌 ${t("পিন", "Pinned")}` },
            { id: "sos", label: `🚨 ${t(`এসওএস (${sosCount})`, `SOS (${sosCount})`)}` },
            { id: "polls", label: `📊 ${t(`পোল (${pollCount})`, `Polls (${pollCount})`)}` },
            { id: "splits", label: `💸 ${t(`স্প্লিট (${splitCount})`, `Splits (${splitCount})`)}` },
            { id: "events", label: `📅 ${t(`ফিস্ট (${eventCount})`, `Events (${eventCount})`)}` },
            { id: "swaps", label: `🔄 ${t("সোয়াপ", "Swaps")}` },
            { id: "media", label: `📸 ${t("মিডিয়া ও অডিও", "Media & Audio")}` },
            { id: "saved", label: `🔖 ${t(`সংরক্ষিত (${savedPostIds.length})`, `Saved (${savedPostIds.length})`)}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer select-none whitespace-nowrap text-xs flex items-center gap-1",
                activeFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200/80 dark:hover:bg-slate-700"
              )}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN POST STREAM */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl py-16 text-center text-xs text-gray-400 shadow-2xs space-y-2">
            <MessageSquare size={40} className="mx-auto mb-2 opacity-30 text-indigo-500" />
            <p className="font-bold text-sm text-gray-800 dark:text-slate-200">
              {searchQuery
                ? t("কোনো পোস্ট পাওয়া যায়নি। অন্য কিছু দিয়ে সার্চ করুন।", "No matching posts found. Try another search.")
                : activeFilter === "saved"
                ? t("আপনার কোনো পোস্ট সংরক্ষিত (Saved) নেই।", "You don't have any saved posts.")
                : t("এই চ্যানেলে এখনো কোনো পোস্ট নেই।", "No posts in this channel yet.")}
            </p>
            <p className="text-gray-400 dark:text-slate-500">
              {t("নিচের বার থেকে বার্তা, ভয়েস নোট, স্প্লিট বা পোল পোস্ট করুন!", "Post an update, voice note, expense split, or poll below!")}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const { text: postCleanText, meta: postMeta } = parsePostContent(post.content);
            const isAnonymous = postMeta.isAnonymous;
            const authorName = isAnonymous
              ? t("বেনামী মেম্বার", "Anonymous Member")
              : post.author?.name ?? post.authorName ?? "Member";
            const initials = isAnonymous
              ? "🕵️"
              : authorName
                  .replace(/[()]/g, "")
                  .trim()
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "M";

            const canModify = !isAnonymous && (isAdmin || post.author?.id === currentUserId || post.authorId === currentUserId);
            const isBookmarked = savedPostIds.includes(post.id);

            const postComments = Array.isArray(post.comments) ? post.comments : [];
            const postReactions = Array.isArray(post.reactions) ? post.reactions : [];
            const isCommentsOpen = !!openComments[post.id];
            const activeReplyTarget = replyingTo[post.id];

            const rootComments = postComments.filter((c: any) => !c.parentId);
            const getReplies = (parentId: string) =>
              postComments.filter((c: any) => c.parentId === parentId);

            // Member Badge (Karma)
            const authorMemberInfo = members.find((m) => m.name === authorName || m.id === post.author?.id);
            const karmaBadge = !isAnonymous && authorMemberInfo?.badge;

            // Poll stats calculation
            const pollData = postMeta.poll;
            const totalPollVotes = pollData
              ? pollData.options.reduce((sum, opt) => sum + opt.votes.length, 0)
              : 0;

            const isEditingThisPost = editingPostId === post.id;

            return (
              <article
                key={post.id}
                className={cn(
                  "bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-xs hover:border-gray-300 dark:hover:border-slate-700 transition-all space-y-4",
                  postMeta.sos && "border-rose-500/90 dark:border-rose-500/80 bg-rose-50/15 dark:bg-rose-950/20 ring-2 ring-rose-500/30",
                  post.isPinned && !postMeta.sos && "border-indigo-200 dark:border-indigo-800 bg-indigo-50/10 dark:bg-indigo-950/20 ring-1 ring-indigo-200/60 dark:ring-indigo-800/60"
                )}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className={cn(
                      "h-10 w-10 sm:h-11 sm:w-11 shrink-0 border-2 shadow-2xs",
                      postMeta.sos
                        ? "border-rose-500 bg-rose-100 text-rose-800"
                        : isAnonymous
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-indigo-100 dark:border-indigo-900"
                    )}>
                      <AvatarFallback className={cn(
                        "text-xs font-black",
                        postMeta.sos
                          ? "bg-rose-100 text-rose-700 font-black"
                          : isAnonymous
                          ? "bg-amber-100 text-base"
                          : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                      )}>
                        {postMeta.sos ? "🚨" : initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">
                          {authorName}
                        </span>

                        {karmaBadge && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                            <Award size={10} className="text-amber-500" />
                            <span>{karmaBadge}</span>
                          </span>
                        )}

                        {getTagBadge(post.type, postMeta)}

                        {post.isPinned && !postMeta.sos && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100 dark:border-indigo-800">
                            {t("📌 পিন করা", "📌 Pinned")}
                          </span>
                        )}

                        {postMeta.isEdited && (
                          <span className="text-[10px] text-gray-400 font-medium italic">
                            ({t("সম্পাদিত", "Edited")})
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">
                        {formatRelativeDate(new Date(post.createdAt))}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Bookmark */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(post.id)}
                      className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer select-none",
                        isBookmarked
                          ? "text-amber-600 bg-amber-50 dark:bg-amber-950/60"
                          : "text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}
                      title={isBookmarked ? t("বুকমার্ক সরানো", "Remove Bookmark") : t("পোস্ট সংরক্ষণ", "Bookmark Post")}
                    >
                      {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>

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
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem
                            onClick={() => handleStartEdit(post)}
                            className="cursor-pointer"
                          >
                            <Edit3 size={13} className="mr-2 text-indigo-600" />
                            <span>{t("এডিট করুন", "Edit Post")}</span>
                          </DropdownMenuItem>

                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleTogglePin(post.id)}
                              className="cursor-pointer"
                            >
                              <Pin size={13} className="mr-2 text-amber-600" />
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
                </div>

                {/* 🚨 EMERGENCY SOS ALERT BANNER */}
                {postMeta.sos && (
                  <div className="bg-rose-600 text-white rounded-2xl p-4 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-rose-800">
                          <AlertTriangle size={16} className="fill-white" />
                        </span>
                        <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                          {t("জরুরি নোটিশ / অবিলম্বে দৃষ্টি আকর্ষণ", "Emergency Notice / Urgent Attention")}
                        </h4>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white text-[10px] font-black">
                        {t(`${postMeta.sos.acknowledgedUserIds.length}/${members.length} জন দেখেছেন`, `${postMeta.sos.acknowledgedUserIds.length}/${members.length} Acknowledged`)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-rose-100 leading-relaxed">
                        {t("নোটিশটি পড়া শেষে নিচের বাটনে ক্লিক করে নিশ্চিত করুন।", "Please confirm by acknowledging you have seen this alert.")}
                      </p>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAcknowledgeSOS(post.id)}
                        disabled={postMeta.sos.acknowledgedUserIds.includes(currentUserId)}
                        className="h-8 px-3.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shrink-0 shadow-xs cursor-pointer"
                      >
                        {postMeta.sos.acknowledgedUserIds.includes(currentUserId) ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>{t("দেখা হয়েছে", "Acknowledged")}</span>
                          </span>
                        ) : (
                          <span>{t("👀 সতর্ক আছি", "👀 Seen & Aware")}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Post Editing Mode */}
                {isEditingThisPost ? (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                    <textarea
                      value={editContentText}
                      onChange={(e) => setEditContentText(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-indigo-500 resize-none min-h-[80px]"
                      rows={3}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPostId(null)}
                        className="h-7 text-xs"
                      >
                        {t("বাতিল", "Cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSavingEdit || !editContentText.trim()}
                        onClick={() => handleSaveEdit(post.id)}
                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        {isSavingEdit ? t("সংরক্ষণ হচ্ছে...", "Saving...") : t("সংরক্ষণ করুন", "Save Changes")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Post Content Body */}
                    {postCleanText && (
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                        {renderFormattedContent(postCleanText)}
                      </p>
                    )}
                  </>
                )}

                {/* 🎙️ ATTACHED VOICE NOTE PLAYER */}
                {postMeta.voice && (
                  <VoicePlayer voice={postMeta.voice} />
                )}

                {/* 💸 IN-FEED EXPENSE SPLIT CARD */}
                {postMeta.expenseSplit && (
                  <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-slate-800/90 dark:to-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/70 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                          <DollarSign size={16} />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100">
                            {postMeta.expenseSplit.title}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {t("মোট খরচ:", "Total Cost:")} <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">{postMeta.expenseSplit.currency}{postMeta.expenseSplit.totalAmount}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold block">{t("মাথাপিছু খরচ", "Per Head")}</span>
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                          {postMeta.expenseSplit.currency}
                          {postMeta.expenseSplit.participants.length > 0
                            ? Math.ceil(postMeta.expenseSplit.totalAmount / postMeta.expenseSplit.participants.length)
                            : postMeta.expenseSplit.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Participants List */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-emerald-200/60 dark:border-slate-700 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                        <Users size={14} className="text-emerald-600" />
                        <span>
                          {t(`যুক্ত হয়েছেন (${postMeta.expenseSplit.participants.length} জন): `, `Joined (${postMeta.expenseSplit.participants.length}): `)}
                          <strong>{postMeta.expenseSplit.participants.map((p) => p.name).join(", ") || t("কেউ নেই", "None")}</strong>
                        </span>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleToggleSplitJoin(post.id)}
                        className={cn(
                          "h-8 px-3.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer",
                          postMeta.expenseSplit.participants.some((p) => p.id === currentUserId)
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {postMeta.expenseSplit.participants.some((p) => p.id === currentUserId)
                          ? t("বাদ দিন", "Leave Split")
                          : t("💸 আমিও শেয়ার করব", "💸 Join Split")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 🔄 DUTY SWAP CARD */}
                {postMeta.dutySwap && (
                  <div className="bg-gradient-to-r from-cyan-50/70 to-blue-50/50 dark:from-slate-800/90 dark:to-cyan-950/40 border border-cyan-200/90 dark:border-cyan-800/70 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-cyan-600 text-white shadow-2xs">
                          <RefreshCw size={15} />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100">
                            {t("বাজার / ডিউটি অদলবদল (Swap Request)", "Duty Swap Trade Offer")}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {t("নির্ধারিত তারিখ:", "Target Date:")} <strong>{postMeta.dutySwap.dutyDate}</strong>
                          </p>
                        </div>
                      </div>

                      {postMeta.dutySwap.isAccepted ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                          ✅ {t(`বদল করেছেন ${postMeta.dutySwap.swappedWith?.name}`, `Swapped with ${postMeta.dutySwap.swappedWith?.name}`)}
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAcceptDutySwap(post.id)}
                          className="h-8 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
                        >
                          {t("🔄 দায়িত্ব নিলাম", "🔄 Accept Swap")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 📅 EVENT / FEAST RSVP CARD */}
                {postMeta.event && (
                  <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/50 dark:from-slate-800/90 dark:to-purple-950/40 border border-purple-200/90 dark:border-purple-800/70 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-2xs">
                          <Calendar size={16} />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100">
                            {postMeta.event.title}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            📅 {postMeta.event.date} {postMeta.event.budgetPerPerson && `• ৳${postMeta.event.budgetPerPerson}/জন`}
                          </p>
                        </div>
                      </div>

                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-bold text-xs">
                        {t(`${postMeta.event.rsvps.going.length} জন নিশ্চিত`, `${postMeta.event.rsvps.going.length} Going`)}
                      </Badge>
                    </div>

                    {/* RSVP Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRsvpEvent(post.id, "going")}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                          postMeta.event.rsvps.going.includes(currentUserId)
                            ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 border-gray-200 text-gray-700 hover:bg-purple-50"
                        )}
                      >
                        ✅ {t("যাচ্ছি", "Going")} ({postMeta.event.rsvps.going.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRsvpEvent(post.id, "maybe")}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                          postMeta.event.rsvps.maybe.includes(currentUserId)
                            ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 border-gray-200 text-gray-700 hover:bg-amber-50"
                        )}
                      >
                        🤔 {t("সম্ভবত", "Maybe")} ({postMeta.event.rsvps.maybe.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRsvpEvent(post.id, "cant")}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                          postMeta.event.rsvps.cant.includes(currentUserId)
                            ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 border-gray-200 text-gray-700 hover:bg-rose-50"
                        )}
                      >
                        ❌ {t("অফ", "Can't")} ({postMeta.event.rsvps.cant.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* 📊 INTERACTIVE POLL CARD */}
                {pollData && (
                  <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/50 dark:from-slate-800/90 dark:to-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/70 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                          <BarChart2 size={15} />
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100">
                          {pollData.question}
                        </h4>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                        {t(`${totalPollVotes} ভোট`, `${totalPollVotes} votes`)}
                      </Badge>
                    </div>

                    {/* Poll Option Bars */}
                    <div className="space-y-2.5">
                      {pollData.options.map((option) => {
                        const hasVoted = option.votes.includes(currentUserId);
                        const count = option.votes.length;
                        const percentage = totalPollVotes > 0 ? Math.round((count / totalPollVotes) * 100) : 0;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleVotePoll(post.id, option.id)}
                            className={cn(
                              "relative w-full text-left rounded-xl p-3 border transition-all overflow-hidden group cursor-pointer select-none",
                              hasVoted
                                ? "border-indigo-500 bg-indigo-100/40 dark:bg-indigo-950/60 shadow-2xs"
                                : "border-gray-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 hover:border-indigo-300 dark:hover:border-indigo-700"
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-0 bottom-0 left-0 transition-all duration-500 opacity-25",
                                hasVoted
                                  ? "bg-indigo-600 dark:bg-indigo-500 opacity-30"
                                  : "bg-indigo-400 dark:bg-indigo-600"
                              )}
                              style={{ width: `${percentage}%` }}
                            />

                            <div className="relative z-10 flex items-center justify-between gap-3 text-xs sm:text-sm">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={cn(
                                    "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-black transition-all",
                                    hasVoted
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent group-hover:border-indigo-400"
                                  )}
                                >
                                  {hasVoted && <Check size={11} />}
                                </span>
                                <span className={cn("font-bold truncate", hasVoted ? "text-indigo-950 dark:text-indigo-100 font-black" : "text-gray-800 dark:text-slate-200")}>
                                  {option.text}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 font-extrabold text-xs">
                                <span className="text-gray-400 dark:text-slate-400 text-[11px] font-medium">({count})</span>
                                <span className={cn(hasVoted ? "text-indigo-600 dark:text-indigo-400 font-black" : "text-gray-700 dark:text-slate-300")}>
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 font-medium pt-1">
                      <span>{t("ভোট দিতে অপশনে চাপুন", "Tap an option to vote")}</span>
                      {pollData.options.some((o) => o.votes.includes(currentUserId)) && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>{t("ভোট সম্পন্ন", "Voted")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 📄 ATTACHED DOCUMENT CARD */}
                {postMeta.document && (
                  <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                          {postMeta.document.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatFileSize(postMeta.document.size)}
                        </p>
                      </div>
                    </div>

                    {postMeta.document.dataUrl ? (
                      <a
                        href={postMeta.document.dataUrl}
                        download={postMeta.document.name}
                        className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-2xs"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">{t("ডাউনলোড", "Download")}</span>
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 text-xs font-bold shrink-0">
                        <FileText size={13} className="mr-1" />
                        <span>{t("দেখুন", "View")}</span>
                      </Button>
                    )}
                  </div>
                )}

                {/* ⚡ CONTEXTUAL ACTION CARD */}
                {postMeta.action && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-200/90 dark:border-indigo-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap shadow-2xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300">
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        <span>{postMeta.action.title}</span>
                      </div>
                      {postMeta.action.description && (
                        <p className="text-xs text-gray-600 dark:text-slate-300 leading-normal">
                          {postMeta.action.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href={postMeta.action.href}
                      className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-700 hover:to-primary/90 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-2xs transition-all select-none"
                    >
                      <span>{postMeta.action.buttonText}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
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

                {/* Reactions & Comment Trigger Bar */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
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

                {/* Comments Stream & Sub-Replies */}
                {isCommentsOpen && (
                  <div className="pt-3.5 border-t border-gray-100 dark:border-slate-800 space-y-3 animate-in fade-in-0 duration-150">
                    {rootComments.length > 0 && (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {rootComments.map((comment: any) => {
                          const cAuthor = comment.author?.name || "Member";
                          const cInitials = cAuthor.replace(/[()]/g, "").trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "M";
                          const replies = getReplies(comment.id);
                          const cEmojiReactions = commentReactions[comment.id] || {};

                          return (
                            <div key={comment.id} className="space-y-2">
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

                                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo((prev) => ({ ...prev, [post.id]: { id: comment.id, name: cAuthor } }));
                                        setCommentInputs((prev) => ({ ...prev, [post.id]: `@${cAuthor} ` }));
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                      <Reply size={12} />
                                      <span>{t("রিপ্লাই", "Reply")}</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                      {["👍", "❤️", "🔥"].map((emoji) => {
                                        const count = (cEmojiReactions[emoji] || []).length;
                                        const userReacted = (cEmojiReactions[emoji] || []).includes(currentUserId);
                                        return (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => handleCommentReact(comment.id, emoji)}
                                            className={cn(
                                              "px-1.5 py-0.5 rounded-md text-[10px] border transition-all cursor-pointer select-none",
                                              userReacted
                                                ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-bold"
                                                : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-500 hover:bg-gray-100"
                                            )}
                                          >
                                            {emoji} {count > 0 && <span>{count}</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {replies.length > 0 && (
                                <div className="pl-8 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2">
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

                    {/* Replying banner */}
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

      {/* 4. STICKY BOTTOM POST COMPOSER */}
      <div
        ref={bottomComposerRef}
        className="fixed bottom-16 md:bottom-5 left-2 right-2 md:left-auto md:right-auto md:w-[896px] md:max-w-4xl mx-auto z-40"
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 space-y-2.5 ring-1 ring-black/5 animate-in slide-in-from-bottom-3 duration-200">
          {/* Loading Compression Status */}
          {isCompressing && (
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-pulse">
              <Sparkles size={15} className="animate-spin text-indigo-600" />
              <span>{t("ছবিটি অপটিমাইজ ও কম্প্রেস করা হচ্ছে...", "Compressing photo automatically...")}</span>
            </div>
          )}

          {/* Voice Recording Drawer */}
          {isRecordingVoice && (
            <VoiceRecorder
              onRecordingComplete={(voice) => {
                setAttachedVoice(voice);
                setIsRecordingVoice(false);
              }}
              onCancel={() => setIsRecordingVoice(false)}
            />
          )}

          {/* Voice Player Preview in Composer */}
          {attachedVoice && !isRecordingVoice && (
            <VoicePlayer
              voice={attachedVoice}
              onDelete={() => setAttachedVoice(null)}
            />
          )}

          {/* Floating Image/Video Preview */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 max-h-40 bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
              <img src={imageUrl} alt="Attached Preview" loading="lazy" decoding="async" className="max-h-40 object-contain" />
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
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-black max-h-40 flex items-center justify-center">
              <video src={videoUrl} controls className="max-h-40 object-contain" />
              <button
                type="button"
                onClick={() => {
                  setVideoUrl("");
                  setMediaFileName("");
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {attachedDocument && (
            <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">{attachedDocument.name}</span>
                <span className="text-[10px] text-gray-400">({formatFileSize(attachedDocument.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedDocument(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* 📊 Interactive Poll Creation Drawer */}
          {isCreatingPoll && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5 animate-in fade-in-0 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300">
                  <BarChart2 size={14} />
                  <span>{t("📊 মেস পোল তৈরি করুন", "📊 Create Poll")}</span>
                </div>
                <button type="button" onClick={() => setIsCreatingPoll(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={13} />
                </button>
              </div>

              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder={t("পোলের প্রশ্ন লিখুন...", "Poll question...")}
                className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-gray-900 dark:text-slate-100"
              />

              <div className="space-y-1.5">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={t(`অপশন ${idx + 1}...`, `Option ${idx + 1}...`)}
                      className="flex-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-gray-900 dark:text-slate-100"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="p-1 text-gray-400 hover:text-rose-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer pt-0.5"
                >
                  <Plus size={12} />
                  <span>{t("অপশন যোগ করুন", "Add option")}</span>
                </button>
              )}
            </div>
          )}

          {/* 💸 In-Feed Split Creation Drawer */}
          {isCreatingSplit && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5 animate-in fade-in-0 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  <DollarSign size={14} />
                  <span>{t("💸 মেস খরচ স্প্লিট কার্ড", "💸 Create Expense Split Card")}</span>
                </div>
                <button type="button" onClick={() => setIsCreatingSplit(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  placeholder={t("খরচের বিবরণ (যেমন: ২০লিটার পানির জার)", "Expense title (e.g. Water Jar 20L)")}
                  className="text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder={t("মোট টাকা (৳)", "Total Amount (৳)")}
                  className="text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* 🔄 Duty Swap Drawer */}
          {isCreatingSwap && (
            <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 space-y-2.5 animate-in fade-in-0 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-cyan-700 dark:text-cyan-300">
                  <RefreshCw size={14} />
                  <span>{t("🔄 বাজার/ক্লিনিং ডিউটি সোয়াপ অফার", "🔄 Duty Swap Trade Offer")}</span>
                </div>
                <button type="button" onClick={() => setIsCreatingSwap(false)} className="text-gray-400">
                  <X size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={swapDutyType}
                  onChange={(e) => setSwapDutyType(e.target.value as any)}
                  className="text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-bold outline-none"
                >
                  <option value="BAZAR">{t("🛒 বাজার দায়িত্ব", "🛒 Bazar Duty")}</option>
                  <option value="CLEANING">{t("🧹 ক্লিনিং দায়িত্ব", "🧹 Cleaning Duty")}</option>
                </select>
                <input
                  type="date"
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>
          )}

          {/* 📅 Event RSVP Drawer */}
          {isCreatingEvent && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2.5 animate-in fade-in-0 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300">
                  <Calendar size={14} />
                  <span>{t("📅 মেস ফিস্ট ও ইভেন্ট তৈরি", "📅 Create Feast / Event RSVP")}</span>
                </div>
                <button type="button" onClick={() => setIsCreatingEvent(false)} className="text-gray-400">
                  <X size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder={t("ইভেন্ট / ফিস্টের নাম (যেমন: মুরগি পোলাও ফিস্ট)", "Event / Feast Title")}
                  className="text-xs font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none sm:col-span-2"
                />
                <input
                  type="number"
                  value={eventBudget}
                  onChange={(e) => setEventBudget(e.target.value)}
                  placeholder={t("বাজেট/জন (৳)", "Budget/Head (৳)")}
                  className="text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                />
              </div>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none w-full"
              />
            </div>
          )}

          {/* Action Preset Selector Drawer */}
          {showActionSelector && (
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-2 animate-in fade-in-0 duration-100">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Zap size={13} className="text-amber-500" />
                  <span>{t("মেস কুইক অ্যাকশন বাটন যুক্ত করুন", "Attach Quick Mess Action")}</span>
                </span>
                <button type="button" onClick={() => setShowActionSelector(false)} className="text-gray-400">
                  <X size={13} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ACTION_PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => {
                      setAttachedAction(preset);
                      setShowActionSelector(false);
                    }}
                    className="p-2 text-left bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between gap-1"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{preset.title}</p>
                      <p className="text-[10px] text-gray-400">{preset.buttonText}</p>
                    </div>
                    <Plus size={14} className="text-indigo-500" />
                  </button>
                ))}
              </div>
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
          <div className={cn(
            "bg-gray-50/90 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all space-y-2",
            isCreatingSOS && "border-rose-500 bg-rose-50/20"
          )}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && (content.trim() || imageUrl || videoUrl || attachedDocument || attachedVoice || isCreatingPoll || isCreatingSplit || isCreatingSwap || isCreatingEvent || isCreatingSOS)) {
                  e.preventDefault();
                  handleCreatePost();
                }
              }}
              placeholder={
                isCreatingSOS
                  ? t("🚨 জরুরি অ্যালার্টের বিবরণ লিখুন... (সকল মেম্বারের কাছে রেড অ্যালার্ট যাবে)", "🚨 Write emergency alert details...")
                  : isAnonymousPost
                  ? t("বেনামী মেম্বার হিসেবে মতামত বা পরামর্শ লিখুন... (নাম গোপন থাকবে)", "Write feedback as anonymous member... (identity hidden)")
                  : t("মেসের মেম্বারদের কিছু জানান... (@ লিখে মেনশন করুন)", "Share an update with mess members... (type @ to mention)")
              }
              className="w-full text-xs sm:text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[38px] max-h-32 placeholder:text-gray-400 leading-relaxed bg-transparent outline-none text-gray-900 dark:text-slate-100"
              maxLength={3000}
              rows={1}
            />

            {/* Bottom Toolbar: Tags, Special Next-Gen Features & Send Button */}
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 dark:border-slate-700 flex-wrap gap-2">
              {/* Category Tags & Emergency SOS & Anonymous Pill */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSOS(!isCreatingSOS);
                    if (!isCreatingSOS) setPostType("ANNOUNCEMENT");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none flex items-center gap-1",
                    isCreatingSOS
                      ? "bg-rose-600 text-white shadow-xs animate-pulse"
                      : "text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                  )}
                  title={t("🚨 জরুরি রেড অ্যালার্ট", "🚨 Emergency SOS")}
                >
                  <AlertTriangle size={11} className={isCreatingSOS ? "fill-white" : ""} />
                  <span>{t("🚨 SOS", "🚨 SOS")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostType("GENERAL")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    postType === "GENERAL" && !isCreatingSOS ? "bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 shadow-2xs" : "text-gray-500 hover:bg-gray-200/80 dark:hover:bg-slate-700"
                  )}
                >
                  {t("💬 সাধারণ", "💬 General")}
                </button>

                <button
                  type="button"
                  onClick={() => setPostType("ANNOUNCEMENT")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none",
                    postType === "ANNOUNCEMENT" && !isCreatingSOS ? "bg-rose-600 text-white shadow-2xs" : "text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                  )}
                >
                  {t("📢 ঘোষণা", "📢 Notice")}
                </button>

                {/* Anonymous Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setIsAnonymousPost(!isAnonymousPost)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer select-none flex items-center gap-1",
                    isAnonymousPost
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-gray-500 hover:bg-gray-200/80 dark:hover:bg-slate-700"
                  )}
                  title={t("নাম গোপন রেখে পোস্ট করুন", "Post anonymously")}
                >
                  <span>🕵️</span>
                  <span>{t("বেনামী", "Anon")}</span>
                </button>
              </div>

              {/* Special Features Toolbar (Voice, Poll, Split, Swap, Event, Media) */}
              <div className="flex items-center gap-1 ml-auto flex-wrap">
                {/* 🎙️ Voice Note Button */}
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(!isRecordingVoice)}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    isRecordingVoice || attachedVoice
                      ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-rose-600"
                  )}
                  title={t("🎙️ ভয়েস মেসেজ রেকর্ড করুন", "Record voice message")}
                >
                  <Mic size={15} />
                </button>

                {/* 💸 Expense Split Button */}
                <button
                  type="button"
                  onClick={() => setIsCreatingSplit(!isCreatingSplit)}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    isCreatingSplit
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-emerald-600"
                  )}
                  title={t("💸 খরচ স্প্লিট কার্ড তৈরি করুন", "Create expense split card")}
                >
                  <DollarSign size={15} />
                </button>

                {/* 📊 Poll Button */}
                <button
                  type="button"
                  onClick={() => setIsCreatingPoll(!isCreatingPoll)}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    isCreatingPoll
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-indigo-600"
                  )}
                  title={t("📊 পোল তৈরি করুন", "Create poll")}
                >
                  <BarChart2 size={15} />
                </button>

                {/* 📅 Event Button */}
                <button
                  type="button"
                  onClick={() => setIsCreatingEvent(!isCreatingEvent)}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    isCreatingEvent
                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-purple-600"
                  )}
                  title={t("📅 ফিস্ট / ইভেন্ট আরএসভিপি", "Feast / Event RSVP")}
                >
                  <Calendar size={15} />
                </button>

                {/* 🔄 Duty Swap Button */}
                <button
                  type="button"
                  onClick={() => setIsCreatingSwap(!isCreatingSwap)}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    isCreatingSwap
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-cyan-600"
                  )}
                  title={t("🔄 বাজার/ক্লিনিং সোয়াপ অফার", "Offer duty swap")}
                >
                  <RefreshCw size={15} />
                </button>

                {/* 📄 Document Button */}
                <button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    attachedDocument
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-indigo-600"
                  )}
                  title={t("📄 ডকুমেন্ট / বিলের PDF", "Attach document / bill PDF")}
                >
                  <FileText size={15} />
                </button>

                {/* ⚡ Action Button */}
                <button
                  type="button"
                  onClick={() => setShowActionSelector(!showActionSelector)}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    attachedAction
                      ? "bg-amber-50 border-amber-300 text-amber-700 shadow-2xs"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-amber-600"
                  )}
                  title={t("⚡ মেস কুইক অ্যাকশন বাটন যুক্ত করুন", "Attach quick action card")}
                >
                  <Zap size={15} />
                </button>

                {/* 📸 Image Button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all cursor-pointer",
                    imageUrl ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 hover:text-indigo-600"
                  )}
                  title={t("ছবি আপলোড", "Upload photo")}
                >
                  <ImageIcon size={15} />
                </button>

                {/* Submit Post Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCreatePost()}
                  disabled={
                    (!content.trim() &&
                      !imageUrl &&
                      !videoUrl &&
                      !attachedDocument &&
                      !attachedVoice &&
                      !isCreatingSOS &&
                      !(isCreatingPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2) &&
                      !(isCreatingSplit && splitTitle.trim() && Number(splitAmount) > 0) &&
                      !(isCreatingSwap && swapDate.trim()) &&
                      !(isCreatingEvent && eventTitle.trim() && eventDate.trim())) ||
                    submitting
                  }
                  className={cn(
                    "h-8 px-3.5 rounded-xl text-white shadow-xs hover:shadow-md transition-all cursor-pointer font-bold text-xs gap-1.5 select-none",
                    isCreatingSOS
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700"
                  )}
                >
                  <span>{isCreatingSOS ? t("🚨 অ্যালার্ট পাঠান", "🚨 Post SOS") : t("পোস্ট", "Post")}</span>
                  <Send size={12} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. MESS RULES MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Shield size={18} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100">
                    {t("মেসের সাধারণ নিয়মাবলী ও নির্দেশিকা", "Mess Code of Conduct & Rules")}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {t("সকল মেম্বারদের জন্য প্রযোজ্য", "Applicable for all mess members")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-1">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200">১. বিদ্যুৎ ও ফ্যান সাশ্রয়:</span>
                <p className="text-xs text-gray-600 dark:text-slate-400">রুম বা ডাইনিং ত্যাগ করার আগে ফ্যান, লাইট এবং এসি সুইচ অফ করুন।</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 space-y-1">
                <span className="font-extrabold text-amber-900 dark:text-amber-200">২. মিল সময়সীমা (Meal Deadline):</span>
                <p className="text-xs text-gray-600 dark:text-slate-400">দুপুরের মিল সকাল ৯টার মধ্যে এবং রাতের মিল বিকাল ৫টার মধ্যে অ্যাপে কনফার্ম করতে হবে।</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 space-y-1">
                <span className="font-extrabold text-emerald-900 dark:text-emerald-200">৩. বাজার ও ক্লিনিং শিডিউল:</span>
                <p className="text-xs text-gray-600 dark:text-slate-400">নির্ধারিত তারিখে দায়িত্ব পালন করুন। অপারগ হলে আগেই শিডিউল সোয়াপ (Swap) রিকোয়েস্ট পাঠান।</p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 space-y-1">
                <span className="font-extrabold text-purple-900 dark:text-purple-200">৪. গেস্ট মিল এন্ট্রি:</span>
                <p className="text-xs text-gray-600 dark:text-slate-400">মেহমান আসলে খাওয়ার আগেই গেস্ট মিল হিসেবে অ্যাপে যুক্ত করুন।</p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
              >
                {t("বুঝতে পেরেছি", "I Understand")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI FEED CATCHUP SUMMARY DIALOG */}
      {showAISummaryModal && (
        <AIFeedSummaryDialog
          posts={posts}
          onClose={() => setShowAISummaryModal(false)}
        />
      )}
    </div>
  );
}
