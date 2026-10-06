import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { JoinMessForm } from "@/components/auth/JoinMessForm";
import { ReactBitsSpinner } from "@/components/ui/ReactBitsSpinner";
import { prisma } from "@/lib/db/prisma";
import { KeyRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Join Mess • MessHub",
  description: "Join your mess with secret invite code on MessHub",
};

export default async function JoinPage() {
  const rooms = await prisma.room.findMany({ select: { id: true, name: true } }).catch(() => []);
  const settings = await prisma.messSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const messName = settings?.messName || "MessHub";

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex items-center justify-center bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-br from-indigo-600/30 via-indigo-800/20 to-transparent blur-[120px] animate-reactbits-pulse-glow" />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tl from-purple-600/30 via-pink-600/20 to-transparent blur-[130px] animate-reactbits-pulse-glow"
          style={{ animationDelay: "2.5s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-indigo-950/50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30 mb-3">
              <KeyRound size={22} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {messName}-এ জয়েন করুন
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ইনভাইট কোড দিয়ে মেম্বার হিসেবে আপনার একাউন্ট তৈরি করুন
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ReactBitsSpinner size="lg" label="ফর্ম লোড হচ্ছে..." />
              </div>
            }
          >
            <JoinMessForm rooms={rooms} />
          </Suspense>

          {/* Card Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-between">
            <Link href="/login" className="text-indigo-400 hover:underline">
              ← লগইন পেজে ফিরে যান
            </Link>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              MessHub Auto-Join
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
