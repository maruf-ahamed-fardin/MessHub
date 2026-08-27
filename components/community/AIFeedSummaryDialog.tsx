"use client";

import { useState } from "react";
import { X, CheckCircle2, Megaphone, Utensils, ShoppingCart, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { GeminiAiIcon } from "@/components/ai/GeminiAiIcon";
import { parsePostContent } from "./CommunityFeedHub";

interface AIFeedSummaryDialogProps {
  posts: any[];
  onClose: () => void;
}

export function AIFeedSummaryDialog({ posts, onClose }: AIFeedSummaryDialogProps) {
  const { t } = usePreferences();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate structured summary from current feed posts
  const summaryData = (() => {
    const announcements = posts.filter((p) => p.type === "ANNOUNCEMENT" || p.isPinned);
    const polls = posts.filter((p) => {
      const { meta } = parsePostContent(p.content);
      return !!meta.poll;
    });
    const regularPosts = posts.filter((p) => p.type !== "ANNOUNCEMENT" && !p.isPinned);

    return {
      totalPosts: posts.length,
      announcementsSummary: announcements.map((p) => {
        const { text } = parsePostContent(p.content);
        return { author: p.author?.name || "Admin", text: text.slice(0, 120) };
      }),
      activePolls: polls.map((p) => {
        const { meta } = parsePostContent(p.content);
        return meta.poll?.question || "Poll";
      }),
      actionItems: [
        t("বিদ্যুৎ ও এসি ব্যবহারের পর রুমের সুইচ বন্ধ রাখুন।", "Turn off room switches and AC after use."),
        t("আজকের মিল কাউন্ট বিকাল ৫টার মধ্যে অ্যাপে কনফার্ম করুন।", "Confirm your dinner meal count before 5:00 PM."),
        t("চলতি মাসের মেস খরচের হিসাব ও নোটিশ চেক করুন।", "Review this month's mess billing and notices."),
      ],
    };
  })();

  const handleRefresh = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <GeminiAiIcon size={18} className="animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100">
                  {t("✨ আজকের দিনের AI সারসংক্ষেপ", "✨ Daily AI Feed Catchup & TL;DR")}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200">
                  {t("লাইভ সামারি", "Live Summary")}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400">
                {t(`মোট ${summaryData.totalPosts}টি পোস্ট ও আলোচনার দ্রুত সারমর্ম`, `Quick synthesis of ${summaryData.totalPosts} posts & updates`)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* AI Synthesized Content */}
        <div className="space-y-3.5">
          {/* Key Announcements */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-rose-300">
              <Megaphone size={14} />
              <span>{t("📢 প্রধান ঘোষণা ও নোটিশ:", "📢 Key Notices & Announcements:")}</span>
            </div>
            {summaryData.announcementsSummary.length > 0 ? (
              <ul className="space-y-1 text-xs text-gray-700 dark:text-slate-300">
                {summaryData.announcementsSummary.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>
                      <strong className="text-gray-900 dark:text-slate-100">{item.author}:</strong> {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">{t("আজকে কোনো নতুন নোটিশ নেই।", "No special notices today.")}</p>
            )}
          </div>

          {/* Active Polls & Decisions */}
          {summaryData.activePolls.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-800 dark:text-indigo-300">
                <Utensils size={14} />
                <span>{t("📊 চলমান মেস ভোটিং ও সিদ্ধান্ত:", "📊 Ongoing Polls & Decisions:")}</span>
              </div>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-slate-300">
                {summaryData.activePolls.map((q, i) => (
                  <li key={i} className="flex items-center gap-1.5 font-semibold">
                    <span className="text-indigo-500">👉</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items for Today */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span>{t("⚡ মেম্বারদের আজকের করণীয়:", "⚡ Today's Action Items:")}</span>
            </div>
            <ul className="space-y-1 text-xs text-gray-700 dark:text-slate-300">
              {summaryData.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw size={12} className={cn(isGenerating && "animate-spin")} />
            <span>{t("পুনরায় আপডেট করুন", "Regenerate")}</span>
          </button>

          <Button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs hover:from-primary/90 hover:to-indigo-700 shadow-2xs cursor-pointer"
          >
            {t("সম্পন্ন", "Got It")}
          </Button>
        </div>
      </div>
    </div>
  );
}
