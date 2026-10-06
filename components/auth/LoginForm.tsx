"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  Mail,
  AlertCircle,
  Zap,
} from "lucide-react";
import { ReactBitsButtonLoader, ReactBitsSpinner } from "@/components/ui/ReactBitsSpinner";

const loginSchema = z.object({
  email: z.string().email("সঠিক ইমেইল ঠিকানা দিন (Enter a valid email)"),
  password: z.string().min(1, "পাসওয়ার্ড প্রদান করুন (Password is required)"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

type AccountRole = "SUPER_ADMIN" | "MEMBER";

const DEMO_ACCOUNTS: Record<AccountRole, { email: string; password: string }> = {
  SUPER_ADMIN: {
    email: "admin@messhub.app",
    password: "admin123",
  },
  MEMBER: {
    email: "tanvir@example.com",
    password: "member123",
  },
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<AccountRole | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Submit standard credentials
  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email.trim(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। (Invalid email or password)");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("সাইন ইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    }
  };

  // Instant 1-Click Demo Login
  const handleInstantDemoLogin = async (role: AccountRole) => {
    setDemoLoading(role);
    setError(null);
    try {
      const demo = DEMO_ACCOUNTS[role];
      const result = await signIn("credentials", {
        email: demo.email,
        password: demo.password,
        redirect: false,
      });

      if (result?.error) {
        setError(`ডেমো অ্যাকাউন্টে প্রবেশ করা সম্ভব হয়নি: ${result.error}`);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("ডেমো লগইনে সংযোগ পাওয়া যায়নি।");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="w-full space-y-5">

      {/* ============================================================
          2. Standard Credentials Form
         ============================================================ */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            ইমেইল ঠিকানা (Email)
          </Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="name@messhub.app"
              autoComplete="email"
              className="h-11 pl-10 pr-3.5 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle size={12} /> {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            পাসওয়ার্ড (Password)
          </Label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 pl-10 pr-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
              <AlertCircle size={12} /> {errors.password.message}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl text-sm font-semibold tracking-wide bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.99] cursor-pointer"
          disabled={isSubmitting || demoLoading !== null}
        >
          {isSubmitting ? (
            <>
              <ReactBitsButtonLoader />
              <span>প্রবেশ করা হচ্ছে (Signing in)...</span>
            </>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>সাইন ইন করুন (Sign In)</span>
              <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      {/* ============================================================
          3. Divider with ReactBits Shimmer Touch
         ============================================================ */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 rounded-full border border-slate-200/60 dark:border-slate-800">
            ⚡ Quick 1-Click Demo Login
          </span>
        </div>
      </div>

      {/* ============================================================
          4. 1-Click Instant Demo Login Cards
         ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Demo Super Admin Button */}
        <button
          type="button"
          onClick={() => handleInstantDemoLogin("SUPER_ADMIN")}
          disabled={demoLoading !== null || isSubmitting}
          className="group relative p-3.5 rounded-xl text-left border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent hover:from-amber-500/15 hover:border-amber-500/50 transition-all duration-200 active:scale-[0.98] shadow-2xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              👑 Super Admin
            </span>
            {demoLoading === "SUPER_ADMIN" ? (
              <ReactBitsSpinner size="sm" showCore={false} />
            ) : (
              <Zap size={14} className="text-amber-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            )}
          </div>
          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            মেস এডমিন ডেমো
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
            admin@messhub.app
          </div>
        </button>

        {/* Demo Member Button */}
        <button
          type="button"
          onClick={() => handleInstantDemoLogin("MEMBER")}
          disabled={demoLoading !== null || isSubmitting}
          className="group relative p-3.5 rounded-xl text-left border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent hover:from-indigo-500/15 hover:border-indigo-500/50 transition-all duration-200 active:scale-[0.98] shadow-2xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              👤 Member (Tanvir)
            </span>
            {demoLoading === "MEMBER" ? (
              <ReactBitsSpinner size="sm" showCore={false} />
            ) : (
              <Zap size={14} className="text-indigo-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            )}
          </div>
          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            সাধারণ সদস্য ডেমো
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
            tanvir@example.com
          </div>
        </button>
      </div>

      {/* Bottom helper info */}
      <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        💡 আপনি সরাসরি উপরের বাটনে ১-ক্লিক করে পূর্ণ ফিচার টেস্ট করতে পারেন।
      </p>
    </div>
  );
}
