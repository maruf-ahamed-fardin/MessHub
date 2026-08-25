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
    <div className={cn("bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-4", post.isPinned && "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{post.author?.name ?? "Unknown"}</span>
              {post.isPinned && <span className="ml-2 text-xs text-[hsl(var(--primary))]">📌 Pinned</span>}
            </div>
            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                    <MoreHorizontal size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
          <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{formatRelativeDate(post.createdAt)}</p>
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
    <form onSubmit={handleSubmit} className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-3 mb-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with your mess..."
        className="text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[60px]"
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
