"use client";

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { updateMealAction, saveBulkDailyMealsAction, createGuestMealAction, deleteGuestMealAction } from "@/app/actions/meal.actions";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Utensils, Sun, Moon, Flame, UserPlus, Trash2, Plus, Loader2, Save, Check, Bell, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface DailyMealGridProps {
  date: Date;
  members: any[];
  meals: any[];
  guestMeals: any[];
  currentMemberId: string | null;
  isAdmin: boolean;
  month: number;
  year: number;
}

const MEAL_KEYS = ["breakfast", "lunch", "dinner"] as const;

export function DailyMealGrid({ date, members, meals, guestMeals, currentMemberId, isAdmin }: DailyMealGridProps) {
  const router = useRouter();
  const { t, language } = usePreferences();
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const isPastDate = checkDate.getTime() < today.getTime();

  const maxFutureDate = new Date(today);
  maxFutureDate.setDate(maxFutureDate.getDate() + 7);
  const isBeyond7Days = checkDate.getTime() > maxFutureDate.getTime();

  const dateStr = new Date(date).toISOString().split("T")[0];

  // 1. Build initial mapping from DB props
  const buildInitialMap = () => {
    const map: Record<string, { breakfast: boolean; lunch: boolean; dinner: boolean }> = {};
    for (const member of members) {
      const existing = meals.find((m) => m.memberId === member.id);
      map[member.id] = {
        breakfast: existing ? Boolean(existing.breakfast) : !isPastDate,
        lunch: existing ? Boolean(existing.lunch) : !isPastDate,
        dinner: existing ? Boolean(existing.dinner) : !isPastDate,
      };
    }
    return map;
  };

  const [savedMealState, setSavedMealState] = useState(buildInitialMap);
  const [mealState, setMealState] = useState(buildInitialMap);
  const [guestList, setGuestList] = useState<any[]>(guestMeals ?? []);

  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [justSavedIds, setJustSavedIds] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);

  // Restore unsaved draft from localStorage on mount or date change
  useEffect(() => {
    try {
      const draftKey = `messhub_meal_draft_${dateStr}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          setMealState((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // Non-blocking
    }
  }, [dateStr]);

  // Sync state if date prop changes
  const [prevDateStr, setPrevDateStr] = useState(date.toISOString());
  const currentDateStr = date.toISOString();
  if (prevDateStr !== currentDateStr) {
    setPrevDateStr(currentDateStr);
    const newMap = buildInitialMap();
    setSavedMealState(newMap);
    setMealState(newMap);
    setGuestList(guestMeals ?? []);
    setJustSavedIds(new Set());
    setNotificationMsg(null);
  }

  // Permission helper:
  // - Admin can edit everyone
  // - Regular member can ONLY edit their own row (memberId === currentMemberId)
  // - Non-admin cannot edit past dates or >7 days future
  const canEditMemberMeal = (memberId: string) => {
    if (isAdmin) return true;
    if (isPastDate) return false;
    if (isBeyond7Days) return false;
    return memberId === currentMemberId;
  };

  const canAddGuestMeal = isAdmin || (!isPastDate && !isBeyond7Days);

  // Check if a member has unsaved changes
  const isMemberDirty = (memberId: string) => {
    const current = mealState[memberId];
    const saved = savedMealState[memberId];
    if (!current || !saved) return false;
    return (
      current.breakfast !== saved.breakfast ||
      current.lunch !== saved.lunch ||
      current.dinner !== saved.dinner
    );
  };

  // List of all member IDs with unsaved changes
  const dirtyMemberIds = members.filter((m) => canEditMemberMeal(m.id) && isMemberDirty(m.id)).map((m) => m.id);

  // 1. Member meal totals
  const memberBreakfast = Object.values(mealState).filter((m) => m.breakfast).length;
  const memberLunch = Object.values(mealState).filter((m) => m.lunch).length;
  const memberDinner = Object.values(mealState).filter((m) => m.dinner).length;

  // 2. Guest meal totals
  const guestBreakfast = guestList
    .filter((g) => g.mealType === "BREAKFAST")
    .reduce((sum, g) => sum + (Number(g.quantity) || 1), 0);
  const guestLunch = guestList
    .filter((g) => g.mealType === "LUNCH")
    .reduce((sum, g) => sum + (Number(g.quantity) || 1), 0);
  const guestDinner = guestList
    .filter((g) => g.mealType === "DINNER")
    .reduce((sum, g) => sum + (Number(g.quantity) || 1), 0);

  // 3. Combined live totals
  const totalBreakfast = memberBreakfast + guestBreakfast;
  const totalLunch = memberLunch + guestLunch;
  const totalDinner = memberDinner + guestDinner;
  const grandTotal = totalBreakfast + totalLunch + totalDinner;

  // Sync draft to localStorage when dirty
  useEffect(() => {
    try {
      const draftKey = `messhub_meal_draft_${dateStr}`;
      const hasUnsaved = members.some((m) => isMemberDirty(m.id));
      if (hasUnsaved) {
        localStorage.setItem(draftKey, JSON.stringify(mealState));
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch {
      // Non-blocking
    }
  }, [mealState, savedMealState, dateStr, members]);

  // Toggle meal locally in state
  const handleToggle = (memberId: string, field: typeof MEAL_KEYS[number]) => {
    if (!canEditMemberMeal(memberId)) return;

    setMealState((prev) => {
      const current = prev[memberId] ?? { breakfast: true, lunch: true, dinner: true };
      return {
        ...prev,
        [memberId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  // Save a single member's meals
  const handleSaveMember = async (memberId: string) => {
    if (!canEditMemberMeal(memberId)) return;

    const current = mealState[memberId] ?? { breakfast: true, lunch: true, dinner: true };
    setSavingMemberId(memberId);
    setNotificationMsg(null);

    try {
      const res = await updateMealAction({
        memberId,
        date: dateStr,
        breakfast: current.breakfast,
        lunch: current.lunch,
        dinner: current.dinner,
      });

      if (res && !res.success && res.error) {
        console.error("Failed to save meal:", res.error);
        setNotificationMsg(`✕ ${res.error}`);
        return;
      }

      // Update baseline saved state
      setSavedMealState((prev) => ({
        ...prev,
        [memberId]: { ...current },
      }));

      try {
        localStorage.removeItem(`messhub_meal_draft_${dateStr}`);
      } catch {
        // Non-blocking
      }

      // Flash success
      setJustSavedIds((prev) => new Set([...prev, memberId]));
      setTimeout(() => {
        setJustSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      }, 3000);

      const targetMember = members.find((m) => m.id === memberId);
      const name = targetMember?.user?.name ?? targetMember?.name ?? "মেম্বার";
      setNotificationMsg(
        t(
          `✓ ${name}-এর মিল সেভ হয়েছে এবং সকল মেম্বারদের নোটিফিকেশন পাঠানো হয়েছে!`,
          `✓ Meals for ${name} saved and broadcast notification sent to all members!`
        )
      );

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      console.error("Failed to save meal:", err);
      setNotificationMsg(t("✕ মিল সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "✕ Failed to save meal. Please try again."));
    } finally {
      setSavingMemberId(null);
    }
  };

  // Save all dirty members at once (Admin or multiple self)
  const handleSaveAllDirty = async () => {
    if (dirtyMemberIds.length === 0) return;

    setSavingAll(true);
    setNotificationMsg(null);

    const updates = dirtyMemberIds.map((id) => ({
      memberId: id,
      breakfast: mealState[id].breakfast,
      lunch: mealState[id].lunch,
      dinner: mealState[id].dinner,
    }));

    try {
      const res = await saveBulkDailyMealsAction({
        date: dateStr,
        updates,
      });

      if (res && !res.success && res.error) {
        console.error("Failed to save all meals:", res.error);
        setNotificationMsg(`✕ ${res.error}`);
        return;
      }

      // Update saved state for all
      setSavedMealState((prev) => {
        const next = { ...prev };
        for (const u of updates) {
          next[u.memberId] = { breakfast: u.breakfast, lunch: u.lunch, dinner: u.dinner };
        }
        return next;
      });

      try {
        localStorage.removeItem(`messhub_meal_draft_${dateStr}`);
      } catch {
        // Non-blocking
      }

      // Flash success for all saved
      setJustSavedIds(new Set(dirtyMemberIds));
      setTimeout(() => {
        setJustSavedIds(new Set());
      }, 3000);

      setNotificationMsg(
        t(
          `✓ ${dirtyMemberIds.length} জন মেম্বারের মিল সেভ হয়েছে এবং সবাইকে নোটিফিকেশন পাঠানো হয়েছে!`,
          `✓ Meals for ${dirtyMemberIds.length} members saved and broadcasted to everyone!`
        )
      );

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      console.error("Failed to save all meals:", err);
      setNotificationMsg(t("✕ মিলগুলো সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "✕ Failed to save meals. Please try again."));
    } finally {
      setSavingAll(false);
    }
  };

  // Quick helper for Admin: Set all ON or all OFF
  const handleAdminSetAll = (value: boolean) => {
    if (!isAdmin) return;
    setMealState((prev) => {
      const next = { ...prev };
      for (const m of members) {
        next[m.id] = { breakfast: value, lunch: value, dinner: value };
      }
      return next;
    });
  };

  // Add guest meal
  const handleAddGuestMeal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddingGuest(true);
    const fd = new FormData(e.currentTarget);
    const memberId = fd.get("memberId") as string;
    const guestName = (fd.get("guestName") as string) || "Guest";
    const mealType = fd.get("mealType") as "BREAKFAST" | "LUNCH" | "DINNER";
    const quantity = Number(fd.get("quantity")) || 1;
    const note = (fd.get("note") as string) || undefined;

    const hostMember = members.find((m) => m.id === memberId);
    const tempId = `temp-${Date.now()}`;

    const newGuestEntry = {
      id: tempId,
      memberId,
      guestName,
      mealType,
      quantity,
      note,
      member: hostMember,
    };

    setGuestList((prev) => [newGuestEntry, ...prev]);
    setGuestDialogOpen(false);

    try {
      await createGuestMealAction({
        memberId,
        guestName,
        date: dateStr,
        mealType,
        quantity,
        note,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("Failed to create guest meal:", err);
    } finally {
      setAddingGuest(false);
    }
  };

  // Delete guest meal
  const handleDeleteGuestMeal = async (id: string) => {
    setGuestList((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteGuestMealAction(id);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("Failed to delete guest meal:", err);
    }
  };

  const formattedDate = new Date(date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isOwnDirty = currentMemberId ? isMemberDirty(currentMemberId) : false;

  return (
    <div className="space-y-4">
      {/* 1. Past Date Notice Banner */}
      {isPastDate && (
        <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🕰️</span>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {t(
                `পূর্ববর্তী দিন (${formattedDate}) এর মিল হিস্ট্রি দেখা হচ্ছে (শুধুমাত্র Admin পরিবর্তন করতে পারবেন)`,
                `Viewing meal history for past date (${formattedDate}) (Admin only edit)`
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/meals")}
            className="text-xs font-bold text-primary hover:underline cursor-pointer shrink-0"
          >
            {t("আজকের দিনে ফিরুন ➔", "Back to Today ➔")}
          </button>
        </div>
      )}

      {/* 2. Future Beyond 7 Days Notice Banner */}
      {isBeyond7Days && (
        <div className="bg-blue-500/10 border border-blue-300 dark:border-blue-700/60 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🗓️</span>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
              {t(
                `ভবিষ্যতের ৭ দিনের বেশি পরের তারিখ (${formattedDate})। সাধারণ মেম্বাররা সর্বোচ্চ ৭ দিন পর্যন্ত মিল অন/অফ করতে পারবেন।`,
                `Date is beyond 7 days in future (${formattedDate}). Members can edit up to 7 days ahead.`
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/meals")}
            className="text-xs font-bold text-primary hover:underline cursor-pointer shrink-0"
          >
            {t("আজকের দিনে ফিরুন ➔", "Back to Today ➔")}
          </button>
        </div>
      )}

      {/* 3. Broadcast Success / Info Notification Banner */}
      {notificationMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check size={16} strokeWidth={3} />
            </div>
            <p className="text-xs sm:text-sm font-black">{notificationMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:opacity-75 cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Live Meal Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
            <Sun size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200">{t("সকালের মিল", "Breakfast")}</p>
            <p className="text-xl font-bold text-amber-950 dark:text-amber-100">
              {totalBreakfast}{" "}
              <span className="text-xs font-normal text-amber-700 dark:text-amber-300">
                ({memberBreakfast} + {guestBreakfast} {t("গেস্ট", "Guest")})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
            <Utensils size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">{t("দুপুরের মিল", "Lunch")}</p>
            <p className="text-xl font-bold text-blue-950 dark:text-blue-100">
              {totalLunch}{" "}
              <span className="text-xs font-normal text-blue-700 dark:text-blue-300">
                ({memberLunch} + {guestLunch} {t("গেস্ট", "Guest")})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
            <Moon size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200">{t("রাতের মিল", "Dinner")}</p>
            <p className="text-xl font-bold text-indigo-950 dark:text-indigo-100">
              {totalDinner}{" "}
              <span className="text-xs font-normal text-indigo-700 dark:text-indigo-300">
                ({memberDinner} + {guestDinner} {t("গেস্ট", "Guest")})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">{t("মোট মিল", "Total Meals")}</p>
            <p className="text-xl font-bold text-emerald-950 dark:text-emerald-100">
              {grandTotal}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Main Member Meal Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                {t(`মেম্বারদের মিল তালিকা (${formattedDate})`, `Member Meal List (${formattedDate})`)}
              </p>
              <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {t(`${members.length} জন মেম্বার`, `${members.length} Members`)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Bell size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                {t(
                  "মিল সেট করে 'সেভ করুন' চাপুন। প্রতিটি সেভে সবার কাছে নোটিফিকেশন পৌঁছে যাবে।",
                  "Set meals and click 'Save'. Every save broadcasts a notification to all members."
                )}
              </span>
            </p>
          </div>

          {/* Action buttons (Admin bulk save or member quick save) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 px-1">
                  {t("Admin কুইক:", "Admin Quick:")}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdminSetAll(true)}
                  className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  title={t("সব মেম্বারের সব মিল চালু করুন", "Set All Meals ON for everyone")}
                >
                  {t("সবাই চালু", "All ON")}
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminSetAll(false)}
                  className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 cursor-pointer"
                  title={t("সব মেম্বারের সব মিল বন্ধ করুন", "Set All Meals OFF for everyone")}
                >
                  {t("সবাই বন্ধ", "All OFF")}
                </button>
              </div>
            )}

            {dirtyMemberIds.length > 0 && (
              <Button
                size="sm"
                onClick={handleSaveAllDirty}
                disabled={savingAll || isPending}
                className="gap-1.5 h-8 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer"
              >
                {savingAll ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{t("সেভ হচ্ছে…", "Saving…")}</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>
                      {t(
                        `সকল পরিবর্তন সেভ করুন (${dirtyMemberIds.length})`,
                        `Save All Changes (${dirtyMemberIds.length})`
                      )}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Member Unsaved Changes Banner for Logged-in User */}
        {isOwnDirty && currentMemberId && (
          <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-300/80 dark:border-amber-700/60 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {t(
                  "আপনার আজকের মিল সেটিং পরিবর্তন করা হয়েছে কিন্তু সেভ করা হয়নি!",
                  "You have unsaved changes to your daily meal setting!"
                )}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => handleSaveMember(currentMemberId)}
              disabled={savingMemberId === currentMemberId || isPending}
              className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1 shrink-0 cursor-pointer shadow-xs"
            >
              {savingMemberId === currentMemberId ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              <span>{t("আমার মিল সেভ করুন", "Save My Meal")}</span>
            </Button>
          </div>
        )}

        {/* Table Column Headers */}
        <div className="grid grid-cols-[1fr_repeat(3,65px)_85px] sm:grid-cols-[1fr_repeat(3,95px)_110px] border-b border-gray-100 dark:border-slate-800 px-4 py-2.5 bg-gray-50/40 dark:bg-slate-800/30 text-xs font-bold text-gray-500 dark:text-slate-400">
          <span>{t("মেম্বার", "Member")}</span>
          <span className="text-center">{t("☀️ সকাল", "☀️ Breakfast")}</span>
          <span className="text-center">{t("🍽️ দুপুর", "🍽️ Lunch")}</span>
          <span className="text-center">{t("🌙 রাত", "🌙 Dinner")}</span>
          <span className="text-center">{t("সেভ / অবস্থা", "Save / Status")}</span>
        </div>

        {/* Members List Rows */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {members.map((member) => {
            const state = mealState[member.id] ?? { breakfast: true, lunch: true, dinner: true };
            const initials = (member.user?.name ?? member.name ?? "?")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            
            const isSelf = member.id === currentMemberId;
            const canEditThisMember = canEditMemberMeal(member.id);
            const isDirty = isMemberDirty(member.id);
            const isSaving = savingMemberId === member.id;
            const wasJustSaved = justSavedIds.has(member.id);

            return (
              <div
                key={member.id}
                className={cn(
                  "grid grid-cols-[1fr_repeat(3,65px)_85px] sm:grid-cols-[1fr_repeat(3,95px)_110px] items-center px-4 py-3 transition-colors",
                  isSelf
                    ? "bg-primary/5 dark:bg-primary/10"
                    : isDirty
                    ? "bg-amber-50/30 dark:bg-amber-950/20"
                    : "hover:bg-gray-50/50 dark:hover:bg-slate-800/40"
                )}
              >
                {/* 1. Member Profile Cell */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-1 sm:pr-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-bold",
                        isSelf
                          ? "bg-primary text-white shadow-xs"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                      <span>{member.user?.name ?? member.name}</span>
                      {isSelf && (
                        <span className="text-[9px] font-black bg-primary/20 text-primary px-1.5 py-0.2 rounded-md shrink-0">
                          {t("আপনি", "You")}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 truncate">
                      {member.seat ? `${member.seat.room?.name ?? "Room"} (${member.seat.label})` : t("সক্রিয় মেম্বার", "Active Member")}
                    </p>
                  </div>
                </div>

                {/* 2. Meal Toggles (Breakfast, Lunch, Dinner) */}
                {MEAL_KEYS.map((field) => {
                  const on = state[field];

                  return (
                    <div key={field} className="flex justify-center px-0.5 sm:px-1">
                      <button
                        type="button"
                        disabled={!canEditThisMember || isSaving || savingAll}
                        onClick={() => handleToggle(member.id, field)}
                        className={cn(
                          "w-14 sm:w-20 h-7 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-0.5 sm:gap-1 select-none shadow-2xs",
                          canEditThisMember
                            ? "active:scale-95 cursor-pointer"
                            : "opacity-40 cursor-not-allowed",
                          on
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                        )}
                        title={
                          !canEditThisMember
                            ? isPastDate
                              ? t("অতীতের মিল শুধুমাত্র Admin পরিবর্তন করতে পারবেন", "Past meals can only be edited by Admin")
                              : isBeyond7Days
                              ? t("ভবিষ্যতের সর্বোচ্চ ৭ দিন পর্যন্ত মিল পরিবর্তন করা যাবে", "Meals can only be edited up to 7 days ahead")
                              : !isSelf
                              ? t("অন্য সদস্যের মিল শুধুমাত্র Admin পরিবর্তন করতে পারবেন", "Only Admin can edit another member's meal")
                              : t("অনুমতি নেই", "No permission")
                            : on
                            ? t("মিল বন্ধ করতে চাপুন (সেভ করতে ভুলবেন না)", "Click to turn OFF (remember to save)")
                            : t("মিল চালু করতে চাপুন (সেভ করতে ভুলবেন না)", "Click to turn ON (remember to save)")
                        }
                      >
                        <span>{on ? t("চালু", "ON") : t("বন্ধ", "OFF")}</span>
                        <span className="text-[10px]">{on ? "✓" : "✕"}</span>
                      </button>
                    </div>
                  );
                })}

                {/* 3. Dedicated Save / Status Button */}
                <div className="flex justify-center pl-1 sm:pl-2">
                  {canEditThisMember ? (
                    <button
                      type="button"
                      disabled={isSaving || savingAll || (!isDirty && !wasJustSaved)}
                      onClick={() => handleSaveMember(member.id)}
                      className={cn(
                        "w-full max-w-[95px] h-7 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 select-none shadow-2xs",
                        isSaving
                          ? "bg-indigo-600 text-white opacity-80 cursor-wait"
                          : wasJustSaved
                          ? "bg-emerald-600 text-white cursor-default"
                          : isDirty
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white active:scale-95 cursor-pointer shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/50 hover:scale-[1.02] transition-all"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 opacity-70 hover:opacity-100 cursor-pointer"
                      )}
                      title={
                        isDirty
                          ? t("পরিবর্তন সেভ করুন ও সবাইকে নোটিফিকেশন পাঠান", "Save changes & broadcast notification")
                          : wasJustSaved
                          ? t("সফলভাবে সেভ হয়েছে", "Saved successfully")
                          : t("মিল সেভ করা আছে (পুনরায় সেভ করতে পারেন)", "Saved (click to re-save)")
                      }
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={11} className="animate-spin" />
                          <span className="text-[10px]">{t("সেভ…", "Saving…")}</span>
                        </>
                      ) : wasJustSaved ? (
                        <>
                          <Check size={12} strokeWidth={3} />
                          <span className="text-[10px]">{t("সেভ্ড ✓", "Saved ✓")}</span>
                        </>
                      ) : isDirty ? (
                        <>
                          <Save size={12} />
                          <span className="text-[10px]">{t("সেভ করুন", "Save")}</span>
                        </>
                      ) : (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-[10px]">{t("সেভ করা", "Saved")}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div
                      className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-slate-600 bg-gray-50 dark:bg-slate-800/40 border border-gray-200/60 dark:border-slate-800 px-2 py-1 rounded-lg select-none"
                      title={t("শুধুমাত্র মেম্বার নিজে অথবা Admin পরিবর্তন ও সেভ করতে পারেন", "Only member themselves or Admin can change & save")}
                    >
                      <Lock size={10} className="shrink-0" />
                      <span>{t("লকড", "Locked")}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Integrated Guest Meals Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                {t("আজকের গেস্ট মিল", "Today's Guest Meals")}
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                {t("মেহমানের মিল যুক্ত করুন, মোট মিলের সাথে যোগ হবে", "Add guest meals to include in total meal count")}
              </p>
            </div>
          </div>

          <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={!canAddGuestMeal}
                className="gap-1.5 h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                <Plus size={14} />
                <span>{t("+ গেস্ট মিল যোগ করুন", "+ Add Guest Meal")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("গেস্ট মিল যুক্ত করুন", "Add Guest Meal")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGuestMeal} className="space-y-3.5 mt-2">
                <div className="space-y-1">
                  <Label>{t("মেম্বার (কার গেস্ট) *", "Host Member *")}</Label>
                  <Select name="memberId" defaultValue={currentMemberId ?? members[0]?.id ?? ""}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => isAdmin || m.id === currentMemberId)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.user?.name ?? m.name} {m.id === currentMemberId ? `(${t("আপনি", "You")})` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="guestName">{t("গেস্টের নাম / পরিচয়", "Guest Name / Identifier")}</Label>
                    <Input id="guestName" name="guestName" placeholder={t("যেমন: বন্ধু, ভাই...", "e.g. Friend, Brother...")} defaultValue="Guest" required />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("মিলের সময় *", "Meal Time *")}</Label>
                    <Select name="mealType" defaultValue="LUNCH">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BREAKFAST">{t("☀️ সকাল", "☀️ Breakfast")}</SelectItem>
                        <SelectItem value="LUNCH">{t("🍽️ দুপুর", "🍽️ Lunch")}</SelectItem>
                        <SelectItem value="DINNER">{t("🌙 রাত", "🌙 Dinner")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="quantity">{t("মিল সংখ্যা *", "Quantity *")}</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" max="10" defaultValue="1" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="note">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</Label>
                    <Input id="note" name="note" placeholder={t("নোট...", "Notes...")} />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setGuestDialogOpen(false)} className="flex-1">
                    {t("বাতিল", "Cancel")}
                  </Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={addingGuest}>
                    {addingGuest ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    {t("গেস্ট মিল যোগ করুন", "Save Guest Meal")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Guest Meal List */}
        {guestList.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
            {t("আজকের জন্য কোনো গেস্ট মিল যোগ করা হয়নি।", "No guest meals recorded for today.")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {guestList.map((g) => {
              const hostName = g.member?.user?.name ?? g.member?.name ?? "Member";
              const mealLabel =
                g.mealType === "BREAKFAST" ? t("☀️ সকাল", "☀️ Breakfast") : g.mealType === "LUNCH" ? t("🍽️ দুপুর", "🍽️ Lunch") : t("🌙 রাত", "🌙 Dinner");

              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                      G
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{g.guestName}</p>
                        <span className="text-[11px] font-medium bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                          {mealLabel}
                        </span>
                        <span className="text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          {t(`${g.quantity} টি মিল`, `${g.quantity} Meals`)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">
                        {t(`মেম্বার: ${hostName}`, `Host: ${hostName}`)} {g.note ? `• ${g.note}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGuestMeal(g.id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title={t("গেস্ট মিল মুছুন", "Delete Guest Meal")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
