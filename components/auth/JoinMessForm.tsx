"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Mail, User, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Building2 } from "lucide-react";
import { registerMemberWithInviteCodeAction } from "@/app/actions/auth.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import Link from "next/link";

interface JoinMessFormProps {
  rooms?: any[];
}

export function JoinMessForm({ rooms = [] }: JoinMessFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const { t } = usePreferences();

  const [inviteCode, setInviteCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await registerMemberWithInviteCodeAction({
        inviteCode: inviteCode.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        roomId: roomId || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to join mess");
        setLoading(false);
        return;
      }

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Invite Code */}
        <div className="space-y-1">
          <Label className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t("মেস ইনভাইট কোড (Invite Code)*", "Mess Invite Code*")}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">{t("এডমিনের থেকে প্রাপ্ত", "From Admin")}</span>
          </Label>
          <Input
            type="text"
            placeholder="e.g. MESSHUB2026"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            className="h-10 text-xs font-mono font-bold tracking-wider rounded-xl uppercase"
          />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <User size={13} className="text-muted-foreground" />
            <span>{t("আপনার পূর্ণ নাম*", "Full Name*")}</span>
          </Label>
          <Input
            type="text"
            placeholder={t("যেমন: তানভীর আহমেদ", "e.g. Tanvir Ahmed")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-10 text-xs rounded-xl"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Mail size={13} className="text-muted-foreground" />
              <span>{t("ইমেইল ঠিকানা*", "Email*")}</span>
            </Label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Phone size={13} className="text-muted-foreground" />
              <span>{t("মোবাইল নম্বর", "Phone")}</span>
            </Label>
            <Input
              type="tel"
              placeholder="017XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 text-xs rounded-xl font-mono"
            />
          </div>
        </div>

        {/* Room Selection (Optional) */}
        {rooms.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Building2 size={13} className="text-muted-foreground" />
              <span>{t("রুম নির্বাচন করুন (ঐচ্ছিক)", "Select Room (Optional)")}</span>
            </Label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl bg-card border border-border text-foreground font-medium"
            >
              <option value="">{t("পরে নির্ধারণ করা হবে", "Assign Later")}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <Lock size={13} className="text-muted-foreground" />
            <span>{t("পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)*", "Password (min 6 chars)*")}</span>
          </Label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-10 text-xs pr-10 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 font-bold text-xs bg-gradient-to-r from-indigo-600 to-primary text-white rounded-xl shadow-xs cursor-pointer gap-2 mt-2"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={14} />
              <span>{t("মেসে জয়েন করুন ও একাউন্ট খুলুন", "Join Mess & Create Account")}</span>
              <ArrowRight size={14} />
            </>
          )}
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        <span>{t("ইতোমধ্যে একটি একাউন্ট রয়েছে?", "Already have an account?")} </span>
        <Link href="/login" className="font-bold text-primary hover:underline">
          {t("লগইন করুন", "Log In")}
        </Link>
      </div>
    </div>
  );
}
