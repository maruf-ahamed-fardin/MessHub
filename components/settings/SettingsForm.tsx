"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsAction } from "@/app/actions/app.actions";
import {
  Loader2, Moon, Sun, Globe, Check, Sliders, CheckCircle2,
  Building2, MapPin, DollarSign, BookOpen, Sparkles, Plus,
  ShieldCheck, ArrowRight, Save, Utensils,
} from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useT } from "@/lib/i18n/useT";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { cn } from "@/lib/utils/cn";

export function SettingsForm({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "finance" | "rules">("general");

  const [messName, setMessName] = useState(settings?.messName ?? "MessHub Flat 4B");
  const [address, setAddress] = useState(settings?.address ?? "House 12, Road 4, Dhanmondi, Dhaka");
  const [currency, setCurrency] = useState(settings?.currency ?? "৳");
  const [defaultSeatRent, setDefaultSeatRent] = useState(settings?.defaultSeatRent ?? 3500);
  const [guestMealPricing, setGuestMealPricing] = useState(settings?.guestMealPricing ?? "DYNAMIC");
  const [guestMealFixedPrice, setGuestMealFixedPrice] = useState(settings?.guestMealFixedPrice ?? 80);
  const [messRules, setMessRules] = useState<string>(
    settings?.messRules ??
      "1. Lock the main door when leaving.\n2. Turn off lights/AC/fans after use.\n3. Keep dining area and kitchen clean after meals."
  );

  const router = useRouter();
  const T = useT();
  const { theme, setTheme, language, setLanguage } = usePreferences();

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
    <div className="max-w-3xl space-y-5 pb-20">
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

      {/* 2. MESS CONFIGURATION HUB */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Navigation Category Tabs — 100% Mobile & Desktop Responsive */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/90 dark:bg-slate-900/90 rounded-2xl border border-gray-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap",
              activeTab === "general"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-gray-200/60 dark:border-slate-700"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <Building2 size={14} className="shrink-0" />
            <span className="truncate">{language === "bn" ? "মেস পরিচিতি" : "Mess Identity"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={cn(
              "flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap",
              activeTab === "finance"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-gray-200/60 dark:border-slate-700"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <DollarSign size={14} className="shrink-0" />
            <span className="truncate">{language === "bn" ? "ভাড়া ও প্রাইসিং" : "Rent & Pricing"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={cn(
              "flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap",
              activeTab === "rules"
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-gray-200/60 dark:border-slate-700"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <BookOpen size={14} className="shrink-0" />
            <span className="truncate">{language === "bn" ? "নীতিমালা ও রুলস" : "Rules & Notice"}</span>
          </button>
        </div>

        {/* Tab 1: General Mess Identity */}
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
                <span>{language === "bn" ? "মেসের নাম *" : "Mess Name *"}</span>
              </Label>
              <Input
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                placeholder="e.g. MessHub Flat 4B"
                required
                className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-500" />
                <span>{language === "bn" ? "মেসের ঠিকানা (ঠিকানা ও রোড)" : "Full Address"}</span>
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House 12, Road 4, Dhanmondi, Dhaka"
                className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Finance, Seat Rent & Guest Meal Pricing */}
        {activeTab === "finance" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 animate-in fade-in-0 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Default Seat Rent */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40">
                <Label className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{language === "bn" ? "ডিফল্ট সিট ভাড়া" : "Default Seat Rent"}</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={defaultSeatRent}
                    onChange={(e) => setDefaultSeatRent(Number(e.target.value))}
                    className="h-10 text-xs font-black rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 pl-8"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-black text-gray-400 dark:text-slate-400">
                    {currency}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">{language === "bn" ? "নতুন মেম্বার যুক্ত করার সময় এটি ব্যবহার হবে" : "Used as default when adding members"}</p>
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700">
                <Label className="text-xs font-black text-gray-800 dark:text-slate-200">
                  {language === "bn" ? "কারেন্সি প্রতীক" : "Currency Symbol"}
                </Label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {["৳", "$", "₹", "€"].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setCurrency(sym)}
                      className={cn(
                        "flex-1 h-9 rounded-xl font-black text-xs transition-all cursor-pointer select-none",
                        currency === sym
                          ? "bg-indigo-600 text-white shadow-xs scale-102"
                          : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-400">{language === "bn" ? "ওয়েবসাইটের সকল হিসাব এই প্রতীকে দেখাবে" : "Used across all site monetary displays"}</p>
              </div>
            </div>

            {/* Guest Meal Pricing Rules */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 space-y-2.5">
              <Label className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Utensils size={14} className="text-amber-500" />
                <span>{language === "bn" ? "গেস্ট মিল প্রাইসিং নিয়ম" : "Guest Meal Pricing Mode"}</span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGuestMealPricing("DYNAMIC")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    guestMealPricing === "DYNAMIC"
                      ? "bg-white dark:bg-slate-800 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-white/60 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                  )}
                >
                  <p className="font-black text-xs">{language === "bn" ? "📊 ডাইনামিক রেট" : "📊 Dynamic Rate"}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">{language === "bn" ? "মাসের মিল রেট অনুযায়ী হিসাব" : "Calculated from live month meal rate"}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGuestMealPricing("FIXED")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    guestMealPricing === "FIXED"
                      ? "bg-white dark:bg-slate-800 border-primary text-primary shadow-xs ring-1 ring-primary/20"
                      : "bg-white/60 dark:bg-slate-800/40 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                  )}
                >
                  <p className="font-black text-xs">{language === "bn" ? "🔒 ফিক্সড রেট" : "🔒 Fixed Rate"}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">{language === "bn" ? "প্রতি মিল নির্দিষ্ট টাকা" : "Fixed price per guest meal"}</p>
                </button>
              </div>

              {guestMealPricing === "FIXED" && (
                <div className="pt-2 animate-in fade-in-0 duration-150">
                  <Label className="text-[11px] font-black text-gray-700 dark:text-slate-300">
                    {language === "bn" ? `ফিক্সড গেস্ট মিল রেট (${currency})` : `Fixed Guest Meal Rate (${currency})`}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={guestMealFixedPrice}
                    onChange={(e) => setGuestMealFixedPrice(Number(e.target.value))}
                    className="h-9 text-xs rounded-xl mt-1 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Mess Rules & Regulations */}
        {activeTab === "rules" && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3.5 animate-in fade-in-0 duration-150">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                <span>{language === "bn" ? "মেস নীতিমালা ও নোটিস বোর্ড রুলস" : "Mess Rules & Regulations"}</span>
              </Label>
              <span className="text-[10px] text-gray-400 dark:text-slate-400">{language === "bn" ? "মেম্বারদের ড্যাশবোর্ডে প্রদর্শিত হবে" : "Visible to all members"}</span>
            </div>

            {/* Quick Rule Templates */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">💡 {language === "bn" ? "কুইক টেমপ্লেট:" : "Quick Templates:"}</span>
              <button
                type="button"
                onClick={() => addRuleTemplate(language === "bn" ? "লাইট ও ফ্যান অপ্রয়োজনে বন্ধ রাখুন" : "Turn off lights & fans after use")}
                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg text-[10px] font-bold border border-amber-200/80 dark:border-amber-800/50 transition-colors cursor-pointer"
              >
                + {language === "bn" ? "বিদ্যুৎ সাশ্রয়" : "Power Saving"}
              </button>
              <button
                type="button"
                onClick={() => addRuleTemplate(language === "bn" ? "রাত ১১:৩০ টার পর মেইন গেট বন্ধ থাকবে" : "Main gate locked after 11:30 PM")}
                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-[10px] font-bold border border-indigo-200/80 dark:border-indigo-800/50 transition-colors cursor-pointer"
              >
                + {language === "bn" ? "মেইন গেট নিয়ম" : "Main Gate Rule"}
              </button>
              <button
                type="button"
                onClick={() => addRuleTemplate(language === "bn" ? "খাবার পর প্লেট ধুয়ে ডাইনিং পরিষ্কার রাখুন" : "Wash plates and keep dining table clean")}
                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-[10px] font-bold border border-emerald-200/80 dark:border-emerald-800/50 transition-colors cursor-pointer"
              >
                + {language === "bn" ? "ডাইনিং পরিচ্ছন্নতা" : "Dining Cleanliness"}
              </button>
            </div>

            <Textarea
              value={messRules}
              onChange={(e) => setMessRules(e.target.value)}
              rows={6}
              placeholder={language === "bn" ? "1. মেসের নিয়ম লিখুন..." : "1. Enter mess rules..."}
              className="text-xs rounded-2xl leading-relaxed p-3.5 resize-none bg-gray-50/50 dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
        )}

        {/* Success Alert Feedback */}
        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in-0 duration-150">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{language === "bn" ? "মেস সেটিংস সফলভাবে আপডেট করা হয়েছে!" : "Settings saved successfully!"}</span>
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
          <span>{T.common.save}</span>
        </Button>
      </form>
    </div>
  );
}
