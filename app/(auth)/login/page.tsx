import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ReactBitsSpinner } from "@/components/ui/ReactBitsSpinner";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  ShoppingBag,
  Calculator,
  Bot,
  Users2,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In • MessHub",
  description: "Secure Sign In to MessHub - Digital Mess Management Platform",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex items-center justify-center bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* ============================================================
          ReactBits Ambient Background: Luminous Gradient Orbs & Mesh
         ============================================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left Indigo Orb */}
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-br from-indigo-600/30 via-indigo-800/20 to-transparent blur-[120px] animate-reactbits-pulse-glow" />

        {/* Bottom-right Violet / Fuchsia Orb */}
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tl from-purple-600/30 via-pink-600/20 to-transparent blur-[130px] animate-reactbits-pulse-glow"
          style={{ animationDelay: "2.5s" }}
        />

        {/* Subtle Cyber Grid Dot Matrix */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ============================================================
          Main Responsive Layout (Mobile, Tablet, Desktop)
         ============================================================ */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 lg:py-16 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* ------------------------------------------------------------
            LEFT COLUMN: Brand Story & Live Features (Hidden on mobile if needed, or compact)
           ------------------------------------------------------------ */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left space-y-6">
          {/* ReactBits Shimmer Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md self-center lg:self-start shadow-sm shadow-indigo-500/20">
            <Sparkles size={14} className="text-indigo-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span className="text-xs font-semibold tracking-wide text-indigo-300">
              MessHub 2.0 • Digital Mess OS
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              স্মার্ট মেস ম্যানেজমেন্ট,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                এক ক্লিকেই সমাধান।
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              মিল হিসাব, প্রতিদিনের বাজার রোটেশন, ইউটিলিটি বিল এবং মাসিক ব্যালেন্স শিট—সবকিছু পরিচালিত হোক রিয়েলটাইমে।
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shrink-0">
                <Utensils size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">স্মার্ট মিল কাউন্টিং</div>
                <div className="text-[11px] text-slate-400 mt-0.5">অটোমেটিক মিল রেট হিসাব</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20 shrink-0">
                <ShoppingBag size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">সাপ্তাহিক বাজার শিডিউল</div>
                <div className="text-[11px] text-slate-400 mt-0.5">সোয়াপ রিকোয়েস্ট সুবিধা</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Calculator size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">ফেয়ার বিল স্প্লিটিং</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ইউটিলিটি ও বাসা ভাড়া</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/15 text-pink-400 border border-pink-500/20 shrink-0">
                <Bot size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Gemini AI অ্যাসিস্ট্যান্ট</div>
                <div className="text-[11px] text-slate-400 mt-0.5">মেমো স্ক্যান ও পরামর্শ</div>
              </div>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>3 Rooms • 7 Members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-indigo-400" />
              <span>100% PWA Offline Ready</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------
            RIGHT COLUMN: ReactBits Glassmorphic Auth Card
           ------------------------------------------------------------ */}
        <div className="w-full sm:max-w-md lg:w-1/2">
          <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-indigo-950/50">
            {/* Top Glowing Beam Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

            {/* Mobile Header Branding */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30 mb-3">
                M
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                স্বাগতম MessHub-এ
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                আপনার অ্যাকাউন্টে লগইন করুন অথবা নিচের ডেমো ব্যবহার করুন
              </p>
            </div>

            {/* Direct Instant Enter & Self Registration */}
            <div className="mb-6 space-y-2.5">
              <Link
                href="/join"
                className="group relative flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-200 active:scale-[0.99]"
              >
                <Users2 size={15} className="text-emerald-400" />
                <span>মেস ইনভাইট কোড দিয়ে জয়েন করুন (Join Mess)</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform text-emerald-400" />
              </Link>

              <Link
                href="/dashboard"
                className="group relative flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-indigo-500/40 transition-all duration-200 active:scale-[0.99]"
              >
                <span>অ্যাপ সরাসরি প্রিভিউ করুন (Explore Dashboard)</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-400" />
              </Link>
            </div>

            {/* Form Container with ReactBits Loader Fallback */}
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <ReactBitsSpinner size="lg" label="লগইন ফর্ম লোড হচ্ছে..." />
                </div>
              }
            >
              <LoginForm />
            </Suspense>

            {/* Card Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-between">
              <span>MessHub © {new Date().getFullYear()}</span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
