"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check, MessageCircle, UserPlus, Sparkles } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MessInviteCardProps {
  inviteCode?: string;
}

export function MessInviteCard({ inviteCode = "MESSHUB2026" }: MessInviteCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = usePreferences();

  const getJoinUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/join?code=${encodeURIComponent(inviteCode)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getJoinUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const link = getJoinUrl();
    const msg = `আসসালামু আলাইকুম, MessHub-এ আমাদের মেসে যুক্ত হওয়ার ইনভাইট লিংক ও কোড:\n\n🔑 ইনভাইট কোড: ${inviteCode}\n🔗 জয়েন লিংক: ${link}\n\nএই লিংকে গিয়ে নাম ও পাসওয়ার্ড দিয়ে একাউন্ট তৈরি করে মেসে যুক্ত হোন।`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8.5 px-3 rounded-xl text-xs font-semibold border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 hover:text-indigo-800 transition-all gap-1.5 cursor-pointer shadow-2xs"
        >
          <UserPlus size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t("ইনভাইট লিংক", "Invite Member")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
              <Sparkles size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-slate-100">
                {t("মেস ইনভাইট কোড ও লিংক", "Mess Invite Code & Link")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t(
                  "নতুন রুমমেট বা মেম্বারদের মেসে যুক্ত করতে নিচের কোড বা লিংক শেয়ার করুন।",
                  "Share this code or link with new roommates to let them self-register."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Invite Code Display Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center space-y-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {t("মেস ইনভাইট কোড (Invite Code)", "Mess Invite Code")}
            </span>
            <div className="text-2xl font-black font-mono tracking-widest text-indigo-600 dark:text-indigo-400 select-all">
              {inviteCode}
            </div>
            <p className="text-[11px] text-slate-400">
              {t("মেম্বাররা /join পেজে গিয়ে এই কোডটি দিয়ে অ্যাকাউন্ট খুলতে পারবে।", "Members can enter this code on the /join page.")}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="h-10 rounded-xl text-xs font-semibold gap-1.5 border-gray-200 dark:border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span>{t("কপি হয়েছে!", "Copied!")}</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>{t("লিংক কপি করুন", "Copy Link")}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-10 rounded-xl text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <MessageCircle size={15} />
              <span>{t("WhatsApp এ পাঠান", "Share WhatsApp")}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
