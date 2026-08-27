"use client";

import { useState, useTransition } from "react";
import { createPostAction } from "@/app/actions/app.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pin, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { togglePinAction, deletePostAction } from "@/app/actions/app.actions";
import { formatRelativeDate } from "@/lib/utils/date";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface FeedPostProps {
  post: any;
  isAdmin: boolean;
  currentUserId: string;
}

export function FeedPost({ post, isAdmin, currentUserId }: FeedPostProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const initials = (post.author?.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const canModify = isAdmin || post.author?.id === currentUserId;

  return (
    <div className={cn("bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs", post.isPinned && "border-primary dark:border-primary bg-primary/5 dark:bg-primary/10")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{post.author?.name ?? "Unknown"}</span>
              {post.isPinned && <span className="ml-2 text-xs font-bold text-primary">📌 Pinned</span>}
            </div>
            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer">
                    <MoreHorizontal size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => startTransition(() => togglePinAction(post.id).then(() => router.refresh()))}>
                      <Pin size={13} className="mr-2" />{post.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive focus:text-destructive"
                    onClick={() => startTransition(() => deletePostAction(post.id).then(() => router.refresh()))}>
                    <Trash2 size={13} className="mr-2" />Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap text-gray-800 dark:text-slate-200">{post.content}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">{formatRelativeDate(post.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export function CreatePostDialog({ isAdmin, authorId }: { isAdmin: boolean; authorId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await createPostAction({ type: "GENERAL", content: content.trim(), authorId });
      setContent("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-3 mb-4 shadow-2xs">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with your mess..."
        className="text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[60px] bg-transparent text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
        maxLength={1000}
      />
      <div className="flex justify-end mt-2">
        <Button type="submit" size="sm" disabled={!content.trim() || loading} className="h-7 text-xs">
          Post
        </Button>
      </div>
    </form>
  );
}
