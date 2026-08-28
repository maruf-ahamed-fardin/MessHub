"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsAction } from "@/app/actions/app.actions";
import { testGeminiApiKeyAction } from "@/app/actions/ai-assistant.actions";
import {
  Loader2, Moon, Sun, Globe, Check, Sliders, CheckCircle2,
  Building2, MapPin, DollarSign, BookOpen, Sparkles, Plus,
  ShieldCheck, ArrowRight, Save, Utensils, Bot, Key, Eye, EyeOff,
  Flame, Clock, QrCode, Phone, ChefHat, AlertTriangle, Cpu, TestTube,
} from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useT } from "@/lib/i18n/useT";
import { DataBackupSection } from "./DataBackupSection";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { cn } from "@/lib/utils/cn";

export function SettingsForm({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "meals" | "finance" | "cook" | "general" | "rules">("ai");

  // AI Assistant States
  const [geminiApiKey, setGeminiApiKey] = useState<string>(settings?.geminiApiKey ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>(settings?.aiEnabled ?? true);
  const [aiModel, setAiModel] = useState<string>(settings?.aiModel ?? "gemini-2.0-flash");
  const [aiSystemInstruction, setAiSystemInstruction] = useState<string>(
    settings?.aiSystemInstruction ?? "সব সময় পরিষ্কার ও মার্জিত বাংলায় বন্ধুসুলভ মেস ম্যানেজমেন্ট অ্যাসিস্ট্যান্ট হিসেবে উত্তর দাও।"
  );
  const [aiTemperature, setAiTemperature] = useState<number>(settings?.aiTemperature ?? 0.7);
  const [aiAutoAction, setAiAutoAction] = useState<boolean>(settings?.aiAutoAction ?? false);

  // Testing Key State
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // General & Mess Identity
  const [messName, setMessName] = useState(settings?.messName ?? "MessHub Flat 4B");
  const [address, setAddress] = useState(settings?.address ?? "House 12, Road 4, Dhanmondi, Dhaka");
  const [currency, setCurrency] = useState(settings?.currency ?? "৳");

  // Financial & MFS
  const [defaultSeatRent, setDefaultSeatRent] = useState(settings?.defaultSeatRent ?? 3500);
  const [defaultFixedUtility, setDefaultFixedUtility] = useState(settings?.defaultFixedUtility ?? 500);
  const [guestMealPricing, setGuestMealPricing] = useState(settings?.guestMealPricing ?? "DYNAMIC");
  const [guestMealFixedPrice, setGuestMealFixedPrice] = useState(settings?.guestMealFixedPrice ?? 80);
  const [adminBkashNumber, setAdminBkashNumber] = useState(settings?.adminBkashNumber ?? "");
  const [adminNagadNumber, setAdminNagadNumber] = useState(settings?.adminNagadNumber ?? "");
  const [adminRocketNumber, setAdminRocketNumber] = useState(settings?.adminRocketNumber ?? "");

  // Meal & Automation
  const [breakfastCutoffTime, setBreakfastCutoffTime] = useState(settings?.breakfastCutoffTime ?? "07:00");
  const [lunchCutoffTime, setLunchCutoffTime] = useState(settings?.lunchCutoffTime ?? "09:00");
  const [dinnerCutoffTime, setDinnerCutoffTime] = useState(settings?.dinnerCutoffTime ?? "16:00");
  const [mealAutoLock, setMealAutoLock] = useState<boolean>(settings?.mealAutoLock ?? true);
  const [allowGuestMealForMembers, setAllowGuestMealForMembers] = useState<boolean>(settings?.allowGuestMealForMembers ?? true);
  const [maxBookingDaysAhead, setMaxBookingDaysAhead] = useState<number>(settings?.maxBookingDaysAhead ?? 7);

  // Cook & House
  const [cookMonthlySalary, setCookMonthlySalary] = useState<number>(settings?.cookMonthlySalary ?? 2500);
  const [cookDailyDeduction, setCookDailyDeduction] = useState<number>(settings?.cookDailyDeduction ?? 100);

  // House Rules
  const [messRules, setMessRules] = useState<string>(
    settings?.messRules ??
      "1. Lock the main door when leaving.\n2. Turn off lights/AC/fans after use.\n3. Keep dining area and kitchen clean after meals."
  );

  const router = useRouter();
  const T = useT();
  const { theme, setTheme, language, setLanguage, t } = usePreferences();

  // Test Gemini Connection live
  const handleTestGeminiKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKeyAction(geminiApiKey, aiModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || "Connection failed" });
    } finally {
      setTestingKey(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await updateSettingsAction({
        messName,
        address: address || undefined,
        currency,
        guestMealPricing,
        guestMealFixedPrice: guestMealPricing === "FIXED" ? Number(guestMealFixedPrice) : undefined,
        guestMealResponsibility: "MEMBER",
        defaultSeatRent: Number(defaultSeatRent),
        defaultFixedUtility: Number(defaultFixedUtility),
        adminBkashNumber: adminBkashNumber || undefined,
        adminNagadNumber: adminNagadNumber || undefined,
        adminRocketNumber: adminRocketNumber || undefined,
        breakfastCutoffTime: breakfastCutoffTime || "07:00",
        lunchCutoffTime: lunchCutoffTime || "09:00",
        dinnerCutoffTime: dinnerCutoffTime || "16:00",
        mealAutoLock,
        allowGuestMealForMembers,
        maxBookingDaysAhead: Number(maxBookingDaysAhead),
        cookMonthlySalary: Number(cookMonthlySalary),
        cookDailyDeduction: Number(cookDailyDeduction),
        geminiApiKey: geminiApiKey || undefined,
        aiEnabled,
        aiModel,
        aiSystemInstruction: aiSystemInstruction || undefined,
        aiTemperature: Number(aiTemperature),
        aiAutoAction,
        messRules: messRules || undefined,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setLoading(false);
    }
  }

  const addRuleTemplate = (template: string) => {
    setMessRules((prev: string) => (prev ? `${prev}\n• ${template}` : `• ${template}`));
  };

  return (
    <div className="w-full space-y-5 pb-20 max-w-5xl mx-auto">
      {/* 1. TOP APP PREFERENCES (Language & Theme Switches + PWA Banner) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Language Switcher */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-slate-200">
              <Globe size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{T.settings.language}</span>
            </div>
            <div className="flex items-center p-1 bg-gray-200/80 dark:bg-slate-800 rounded-xl gap-1 border border-gray-300/40 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLanguage("bn")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none",
                  language === "bn"
                    ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/50"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <span>🇧🇩 {T.settings.bengali}</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none",
                  language === "en"
                    ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/50"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <span>🇬🇧 {T.settings.english}</span>
              </button>
            </div>
          </div>

          {/* Night Mode & Light Mode Switcher */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-slate-200">
              {theme === "dark" ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
              <span>{T.settings.theme}</span>
            </div>
            <div className="flex items-center p-1 bg-gray-200/80 dark:bg-slate-800 rounded-xl gap-1 border border-gray-300/40 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none",
                  theme === "light"
                    ? "bg-amber-500 text-white shadow-xs ring-1 ring-amber-400/50"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Sun size={13} className="text-white" />
                <span>{T.settings.light}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none",
                  theme === "dark"
                    ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/50"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Moon size={13} className="text-indigo-200" />
                <span>{T.settings.dark}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PWA App Download Option */}
        <PwaInstallButton variant="card" />
      </div>

      {/* 2. MAIN CONFIGURATION FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Navigation Category Tabs (Clean responsive grid on mobile, flex bar on desktop) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1.5 bg-gray-100 dark:bg-slate-900/90 rounded-2xl border border-gray-200/80 dark:border-slate-800">
          {[
            {
              id: "ai" as const,
              labelBn: "AI অ্যাসিস্ট্যান্ট",
              labelEn: "AI & Gemini",
              icon: Bot,
              activeClass: "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/60 shadow-xs ring-1 ring-purple-500/20",
              iconColor: "text-purple-500",
            },
            {
              id: "meals" as const,
              labelBn: "মিল রুলস",
              labelEn: "Meal Rules",
              icon: Clock,
              activeClass: "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 shadow-xs ring-1 ring-amber-500/20",
              iconColor: "text-amber-500",
            },
            {
              id: "finance" as const,
              labelBn: "পেমেন্ট ও MFS",
              labelEn: "Payments & MFS",
              icon: DollarSign,
              activeClass: "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 shadow-xs ring-1 ring-emerald-500/20",
              iconColor: "text-emerald-500",
            },
            {
              id: "cook" as const,
              labelBn: "খালা ও স্টাফ",
              labelEn: "Cook & House",
              icon: ChefHat,
              activeClass: "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/60 shadow-xs ring-1 ring-teal-500/20",
              iconColor: "text-teal-500",
            },
            {
              id: "general" as const,
              labelBn: "মেস প্রোফাইল",
              labelEn: "Mess Info",
              icon: Building2,
              activeClass: "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 shadow-xs ring-1 ring-indigo-500/20",
              iconColor: "text-indigo-500",
            },
            {
              id: "rules" as const,
              labelBn: "মেস নীতিমালা",
              labelEn: "House Rules",
              icon: BookOpen,
              activeClass: "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60 shadow-xs ring-1 ring-orange-500/20",
              iconColor: "text-orange-500",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2 sm:py-2.5 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer select-none text-center border border-transparent active:scale-95",
                  isActive
                    ? tab.activeClass
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon size={15} className={cn("shrink-0", isActive ? tab.iconColor : "opacity-70")} />
                <span className="truncate leading-tight">{t(tab.labelBn, tab.labelEn)}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: AI ASSISTANT & GEMINI CONFIGURATION */}
        {activeTab === "ai" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 animate-in fade-in-0 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-900 dark:text-slate-100">
                    {t("Google Gemini AI ইঞ্জিন কনফিগারেশন", "Google Gemini AI Engine Configuration")}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t("লাইভ সাইটে AI সহকারী ও বাজার মেমো স্ক্যানার সক্রিয় করতে আপনার Gemini API Key বসান", "Set your Gemini API key to activate AI assistant & OCR memo scanner")}
                  </p>
                </div>
              </div>

              {/* Master AI Toggle */}
              <button
                type="button"
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  aiEnabled
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                }`}
              >
                <Sparkles size={13} />
                <span>{aiEnabled ? t("AI সক্রিয় ✓", "AI Enabled ✓") : t("AI বন্ধ ✕", "AI Disabled ✕")}</span>
              </button>
            </div>

            {/* Gemini API Key Input with Show/Hide & Test Button */}
            <div className="space-y-2 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <Key size={14} className="text-purple-600 dark:text-purple-400" />
                  <span>{t("Google Gemini API Key", "Google Gemini API Key")}</span>
                </Label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {t("ফ্রি API Key নিন ↗", "Get Free API Key ↗")}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="h-10 text-xs font-mono pr-10 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestGeminiKey}
                  disabled={testingKey}
                  className="h-10 px-3.5 text-xs font-bold gap-1.5 rounded-xl border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 cursor-pointer shrink-0"
                >
                  {testingKey ? <Loader2 size={14} className="animate-spin text-purple-600" /> : <TestTube size={14} />}
                  <span>{testingKey ? t("টেস্ট হচ্ছে...", "Testing...") : t("🧪 Test Connection", "🧪 Test Connection")}</span>
                </Button>
              </div>

              {/* Test Connection Output Alert */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={16} className="text-rose-600 shrink-0" />}
                    <span>{testResult.message || testResult.error}</span>
                  </div>
                  <button type="button" onClick={() => setTestResult(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                </div>
              )}
            </div>

            {/* Model & AI Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* AI Model Selector */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Cpu size={14} className="text-primary" />
                  <span>{t("AI মডেল নির্বাচন", "AI Model Selection")}</span>
                </Label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-3 font-semibold text-foreground focus:outline-none"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended & Fast)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (High quota)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning)</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Lightweight)</option>
                </select>
                <p className="text-[10px] text-muted-foreground">{t("গুগলের সর্বাধুনিক মাল্টিমোডাল মডেল", "Google's state-of-the-art vision and text model")}</p>
              </div>

              {/* Creativity / Temperature Slider */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-500" />
                    <span>{t("ক্রিয়েটিভিটি / Temperature", "Creativity / Temperature")}</span>
                  </Label>
                  <span className="text-xs font-mono font-bold text-primary">{aiTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={aiTemperature}
                  onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary h-2 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{t("সঠিক ও সুনির্দিষ্ট (0.1)", "Precise (0.1)")}</span>
                  <span>{t("সৃজনশীল ও প্রাণবন্ত (1.0)", "Creative (1.0)")}</span>
                </div>
              </div>
            </div>

            {/* Custom AI Persona / Instructions */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t("AI কাস্টম পার্সোনা ও নির্দেশিকা", "Custom System Persona & Instructions")}</span>
              </Label>
              <Textarea
                value={aiSystemInstruction}
                onChange={(e) => setAiSystemInstruction(e.target.value)}
                rows={3}
                placeholder={t("AI অ্যাসিস্ট্যান্ট কীভাবে কথা বলবে ও আচরণ করবে...", "How the AI assistant should speak and behave...")}
                className="text-xs rounded-xl bg-gray-50/50 dark:bg-slate-800/70 dark:border-slate-700"
              />
            </div>
          </div>
        )}

        {/* TAB 2: MEAL CUT-OFF & AUTOMATION */}
        {activeTab === "meals" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 animate-in fade-in-0 duration-150">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
              <Clock size={18} className="text-amber-500" />
              <div>
                <h4 className="font-black text-sm text-gray-900 dark:text-slate-100">
                  {t("মিল অন/অফ কাট-অফ সময় ও অটোমেশন রুলস", "Meal Cut-off Times & Automation Rules")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t("নির্দিষ্ট সময়ের পর সাধারণ মেম্বাররা আর নিজে থেকে সেদিনের মিল অন/অফ করতে পারবে না", "Lock daily meal changes after specific hours")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {t("☕ সকালের নাস্তা কাট-অফ", "☕ Breakfast Cut-off")}
                </Label>
                <Input
                  type="time"
                  value={breakfastCutoffTime}
                  onChange={(e) => setBreakfastCutoffTime(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {t("☀️ দুপুরের মিল কাট-অফ", "☀️ Lunch Cut-off")}
                </Label>
                <Input
                  type="time"
                  value={lunchCutoffTime}
                  onChange={(e) => setLunchCutoffTime(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  {t("🌙 রাতের মিল কাট-অফ", "🌙 Dinner Cut-off")}
                </Label>
                <Input
                  type="time"
                  value={dinnerCutoffTime}
                  onChange={(e) => setDinnerCutoffTime(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Automation Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-foreground">{t("কাট-অফ পার হলে অটো-লক", "Auto-lock past cutoff")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("মেম্বারদের জন্য সুইচ নিষ্ক্রিয় হবে (এডমিন ওভাররাইড চালু থাকবে)", "Members cannot edit; Admin can override")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMealAutoLock(!mealAutoLock)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    mealAutoLock ? "bg-primary justify-end" : "bg-gray-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-foreground">{t("মেম্বারদের গেস্ট মিল বুকিং অনুমোদন", "Allow member guest meals")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("সাধারণ মেম্বাররা নিজেদের আইডিতে গেস্ট মিল যোগ করতে পারবে", "Allow regular members to book guest meals")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowGuestMealForMembers(!allowGuestMealForMembers)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    allowGuestMealForMembers ? "bg-primary justify-end" : "bg-gray-300 dark:bg-slate-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Advance Window */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700">
              <Label className="text-xs font-bold">{t("মেম্বারদের সর্বোচ্চ কত দিন অগ্রিম মিল বুকিং অনুমোদন?", "Maximum advance booking window (Days)")}</Label>
              <div className="flex items-center gap-2">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setMaxBookingDaysAhead(days)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      maxBookingDaysAhead === days
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-foreground"
                    }`}
                  >
                    {days} {t("দিন", "Days")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE & MFS PAYMENT HUB */}
        {activeTab === "finance" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 animate-in fade-in-0 duration-150">
            {/* MFS Payment Details (bKash / Nagad / Rocket) */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                <QrCode size={16} className="text-indigo-600 dark:text-indigo-400" />
                <Label className="text-xs font-black">
                  {t("মোবাইল ব্যাংকিং ও পেমেন্ট নম্বর (bKash / Nagad / Rocket)", "Mobile Banking & Payment Numbers")}
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("মেম্বাররা যখন বকেয়া পরিশোধ করতে যাবে, তখন তাদের এই নম্বর ও ডায়নামিক কিউআর কোড দেখানো হবে।", "Members will see these numbers and dynamic QR codes when paying dues.")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
                    🌸 bKash No.
                  </Label>
                  <Input
                    value={adminBkashNumber}
                    onChange={(e) => setAdminBkashNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    🔥 Nagad No.
                  </Label>
                  <Input
                    value={adminNagadNumber}
                    onChange={(e) => setAdminNagadNumber(e.target.value)}
                    placeholder="018XXXXXXXX"
                    className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    🚀 Rocket No.
                  </Label>
                  <Input
                    value={adminRocketNumber}
                    onChange={(e) => setAdminRocketNumber(e.target.value)}
                    placeholder="019XXXXXXXX"
                    className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Default Seat Rent */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40">
                <Label className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t("ডিফল্ট সিট ভাড়া", "Default Seat Rent")}</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={defaultSeatRent}
                    onChange={(e) => setDefaultSeatRent(Number(e.target.value))}
                    className="h-10 text-xs font-black rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 pl-8"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-black text-gray-400">{currency}</span>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700">
                <Label className="text-xs font-black">
                  {t("কারেন্সি প্রতীক", "Currency Symbol")}
                </Label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {["৳", "$", "₹", "€", "£"].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setCurrency(sym)}
                      className={cn(
                        "flex-1 h-9 rounded-xl font-black text-xs transition-all cursor-pointer select-none",
                        currency === sym
                          ? "bg-indigo-600 text-white shadow-xs scale-102"
                          : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100"
                      )}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Guest Meal Pricing Rules */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 space-y-2.5">
              <Label className="text-xs font-black flex items-center gap-1.5">
                <Utensils size={14} className="text-amber-500" />
                <span>{t("গেস্ট মিল প্রাইসিং নিয়ম", "Guest Meal Pricing Mode")}</span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGuestMealPricing("DYNAMIC")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    guestMealPricing === "DYNAMIC"
                      ? "bg-white dark:bg-slate-800 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-white/60 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                  )}
                >
                  <p className="font-black text-xs">{t("📊 ডাইনামিক রেট", "📊 Dynamic Rate")}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t("মাসের মিল রেট অনুযায়ী হিসাব", "Calculated from live month meal rate")}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGuestMealPricing("FIXED")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    guestMealPricing === "FIXED"
                      ? "bg-white dark:bg-slate-800 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-white/60 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
                  )}
                >
                  <p className="font-black text-xs">{t("🔒 ফিক্সড রেট", "🔒 Fixed Rate")}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t("প্রতি মিল নির্দিষ্ট টাকা", "Fixed price per guest meal")}</p>
                </button>
              </div>

              {guestMealPricing === "FIXED" && (
                <div className="pt-2 animate-in fade-in-0 duration-150">
                  <Label className="text-[11px] font-black">
                    {t(`ফিক্সড গেস্ট মিল রেট (${currency})`, `Fixed Guest Meal Rate (${currency})`)}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={guestMealFixedPrice}
                    onChange={(e) => setGuestMealFixedPrice(Number(e.target.value))}
                    className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COOK & HOUSE POLICIES */}
        {activeTab === "cook" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 animate-in fade-in-0 duration-150">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
              <ChefHat size={18} className="text-teal-600" />
              <div>
                <h4 className="font-black text-sm text-gray-900 dark:text-slate-100">
                  {t("বুয়া / খালার বেতন ও হাউজ নীতিমালা", "Cook / Maid Salary & House Policies")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t("হাজিরা ট্র্যাকিং এবং বেতন কর্তনের নিয়মাবলি", "Manage cook attendance deduction rates and utility shares")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/40">
                <Label className="text-xs font-bold text-teal-900 dark:text-teal-300">
                  {t("বুয়া / খালার মাসিক মূল বেতন (৳)", "Cook's Monthly Base Salary (৳)")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={cookMonthlySalary}
                  onChange={(e) => setCookMonthlySalary(Number(e.target.value))}
                  className="h-9 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1.5 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/40">
                <Label className="text-xs font-bold text-rose-900 dark:text-rose-300">
                  {t("প্রতিদিন অনুপস্থিতির কর্তন হার (৳)", "Daily Absence Deduction Rate (৳)")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={cookDailyDeduction}
                  onChange={(e) => setCookDailyDeduction(Number(e.target.value))}
                  className="h-9 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700">
              <Label className="text-xs font-bold">
                {t("ডিফল্ট ফিক্সড ইউটিলিটি চার্জ (৳)", "Default Fixed Utility Charge (৳)")}
              </Label>
              <Input
                type="number"
                min="0"
                value={defaultFixedUtility}
                onChange={(e) => setDefaultFixedUtility(Number(e.target.value))}
                className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <p className="text-[10px] text-muted-foreground">{t("ওয়াইফাই, ময়লা বা ফিক্সড সার্ভিস বিল শেয়ারিং", "Wifi, waste or maintenance share")}</p>
            </div>
          </div>
        )}

        {/* TAB 5: MESS IDENTITY */}
        {activeTab === "general" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 animate-in fade-in-0 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                {messName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm sm:text-base text-gray-900 dark:text-slate-100 leading-tight truncate">
                  {messName || "My Mess"}
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-400 truncate mt-0.5">{address || "Location not set"}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t("মেসের নাম *", "Mess Name *")}</span>
              </Label>
              <Input
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                placeholder="e.g. MessHub Flat 4B"
                required
                className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-500" />
                <span>{t("মেসের ঠিকানা (ঠিকানা ও রোড)", "Full Address")}</span>
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House 12, Road 4, Dhanmondi, Dhaka"
                className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>
        )}

        {/* TAB 6: MESS RULES */}
        {activeTab === "rules" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                <span>{t("মেস নীতিমালা ও নোটিস বোর্ড রুলস", "Mess Rules & Regulations")}</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">{t("মেম্বারদের ড্যাশবোর্ডে প্রদর্শিত হবে", "Visible to all members")}</span>
            </div>

            {/* Quick Rule Templates */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-muted-foreground">💡 {t("কুইক টেমপ্লেট:", "Quick Templates:")}</span>
              <button
                type="button"
                onClick={() => addRuleTemplate(language === "bn" ? "লাইট ও ফ্যান অপ্রয়োজনে বন্ধ রাখুন" : "Turn off lights & fans after use")}
                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer"
              >
                + {t("বিদ্যুৎ সাশ্রয়", "Power Saving")}
              </button>
              <button
                type="button"
                onClick={() => addRuleTemplate(language === "bn" ? "রাত ১১:৩০ টার পর মেইন গেট বন্ধ থাকবে" : "Main gate locked after 11:30 PM")}
                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors cursor-pointer"
              >
                + {t("মেইন গেট নিয়ম", "Main Gate Rule")}
              </button>
              <button
                type="button"
                onClick={() => addRuleTemplate(language === "bn" ? "খাবার পর প্লেট ধুয়ে ডাইনিং পরিষ্কার রাখুন" : "Wash plates and keep dining table clean")}
                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                + {t("ডাইনিং পরিচ্ছন্নতা", "Dining Cleanliness")}
              </button>
            </div>

            <Textarea
              value={messRules}
              onChange={(e) => setMessRules(e.target.value)}
              rows={6}
              placeholder="1. মেসের নিয়ম লিখুন..."
              className="text-xs rounded-2xl leading-relaxed p-3.5 resize-none bg-gray-50/50 dark:bg-slate-800/70 dark:border-slate-700"
            />
          </div>
        )}

        {/* Success Alert Feedback */}
        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in-0 duration-150">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{t("মেস সেটিংস সফলভাবে আপডেট করা হয়েছে!", "Settings saved successfully!")}</span>
          </div>
        )}

        {/* Modern Save Action Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white font-black h-11 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer text-xs gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>{t("সকল সেটিংস সংরক্ষণ করুন (Save All Settings)", "Save All Settings")}</span>
        </Button>
      </form>

      {/* 3. DATABASE BACKUP & SAFETY SECTION */}
      <DataBackupSection />
    </div>
  );
}
