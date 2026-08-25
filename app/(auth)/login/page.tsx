import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your MessHub account",
};

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Left panel — branding */}
      <div className="hidden md:flex flex-col justify-between w-96 shrink-0 bg-[hsl(var(--sidebar))] p-8 text-[hsl(var(--sidebar-foreground))]">
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-xl font-semibold tracking-tight">MessHub</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3 leading-tight">Your mess,<br />digitally managed.</h2>
          <p className="text-sm text-[hsl(var(--sidebar-muted))] leading-relaxed">
            Track meals, bazar, expenses, utilities, payments, and community — all in one place.
          </p>
        </div>

        <div className="space-y-4">
          {["Track every meal automatically", "Split expenses fairly", "Monthly settlement made simple", "Community feed & notices"].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 text-sm text-[hsl(var(--sidebar-muted))]">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--sidebar-primary))] shrink-0" />
              {feat}
            </div>
          ))}
        </div>

        <p className="text-xs text-[hsl(var(--sidebar-muted))]">
          MessHub © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 md:hidden">
          <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center text-white font-bold">
            M
          </div>
          <span className="text-xl font-semibold tracking-tight">MessHub</span>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Sign in or enter directly to preview the app
            </p>
          </div>

          <Link href="/dashboard" className="w-full block">
            <Button variant="default" className="w-full h-11 text-sm font-semibold gap-2 shadow-sm bg-[hsl(var(--primary))]">
              Enter App Directly (Demo Mode) <ArrowRight size={16} />
            </Button>
          </Link>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[hsl(var(--border))]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[hsl(var(--background))] px-2 text-muted-foreground">
                Or sign in with account
              </span>
            </div>
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
