"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { updateMealAction, createGuestMealAction, deleteGuestMealAction } from "@/app/actions/meal.actions";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Utensils, Sun, Moon, Flame, UserPlus, Trash2, Plus, Loader2 } from "lucide-react";
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const isPastDate = checkDate.getTime() < today.getTime();

  // Initial member meal state
  const initialMap: Record<string, { breakfast: boolean; lunch: boolean; dinner: boolean }> = {};
  for (const member of members) {
    const existing = meals.find((m) => m.memberId === member.id);
    initialMap[member.id] = {
      breakfast: existing ? Boolean(existing.breakfast) : true,
      lunch: existing ? Boolean(existing.lunch) : true,
      dinner: existing ? Boolean(existing.dinner) : true,
    };
  }

  const [mealState, setMealState] = useState(initialMap);
  const [guestList, setGuestList] = useState<any[]>(guestMeals ?? []);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);

  // 1. Calculate member meal counts
  const memberBreakfast = Object.values(mealState).filter((m) => m.breakfast).length;
  const memberLunch = Object.values(mealState).filter((m) => m.lunch).length;
  const memberDinner = Object.values(mealState).filter((m) => m.dinner).length;

  // 2. Calculate guest meal counts
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

  const dateStr = new Date(date).toISOString().split("T")[0];

  // Toggle member meal
  const handleToggle = async (memberId: string, field: typeof MEAL_KEYS[number]) => {
    const current = mealState[memberId] ?? { breakfast: true, lunch: true, dinner: true };
    const nextVal = {
      ...current,
      [field]: !current[field],
    };

    setMealState((prev) => ({
      ...prev,
      [memberId]: nextVal,
    }));

    setLoadingKey(`${memberId}-${field}`);

    try {
      await updateMealAction({
        memberId,
        date: dateStr,
        breakfast: nextVal.breakfast,
        lunch: nextVal.lunch,
        dinner: nextVal.dinner,
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update meal:", err);
      setMealState((prev) => ({
        ...prev,
        [memberId]: current,
      }));
    } finally {
      setLoadingKey(null);
    }
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

    // Optimistic update
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
      router.refresh();
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
      router.refresh();
    } catch (err) {
      console.error("Failed to delete guest meal:", err);
    }
  };

  const formattedDate = new Date(date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* 1. Live Meal Summary Cards */}
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

      {/* 2. Main Member Meal Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {t(`মেম্বারদের মিল তালিকা (${formattedDate})`, `Member Meal List (${formattedDate})`)}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {t("মিল অন বা অফ করতে বাটনে চাপুন", "Click button to toggle meal")}
            </p>
          </div>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {t(`${members.length} জন মেম্বার`, `${members.length} Members`)}
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_repeat(3,75px)] sm:grid-cols-[1fr_repeat(3,105px)] border-b border-gray-100 dark:border-slate-800 px-4 py-2.5 bg-gray-50/30 dark:bg-slate-800/20 text-xs font-semibold text-gray-500 dark:text-slate-400">
          <span>{t("মেম্বারের নাম", "Member Name")}</span>
          <span className="text-center">{t("সকাল", "Breakfast")}</span>
          <span className="text-center">{t("দুপুর", "Lunch")}</span>
          <span className="text-center">{t("রাত", "Dinner")}</span>
        </div>

        {/* Members List */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {members.map((member) => {
            const state = mealState[member.id] ?? { breakfast: true, lunch: true, dinner: true };
            const initials = (member.user?.name ?? member.name ?? "?")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_repeat(3,75px)] sm:grid-cols-[1fr_repeat(3,105px)] items-center px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                      {member.user?.name ?? member.name}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                      {member.seat ? `${member.seat.room?.name ?? "Room"} (${member.seat.label})` : t("সক্রিয় মেম্বার", "Active Member")}
                    </p>
                  </div>
                </div>

                {MEAL_KEYS.map((field) => {
                  const on = state[field];
                  const isLoading = loadingKey === `${member.id}-${field}`;
                  const canEditThisMeal = isAdmin || (!isPastDate && member.id === currentMemberId);

                  return (
                    <div key={field} className="flex justify-center">
                      <button
                        type="button"
                        disabled={!canEditThisMeal || isLoading}
                        onClick={() => handleToggle(member.id, field)}
                        className={cn(
                          "w-16 sm:w-20 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 select-none shadow-xs",
                          canEditThisMeal ? "active:scale-95 cursor-pointer" : "opacity-60 cursor-not-allowed",
                          on
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300",
                          isLoading && "opacity-60"
                        )}
                        title={
                          !canEditThisMeal
                            ? isPastDate
                              ? t("অতীতের মিল শুধুমাত্র Admin পরিবর্তন করতে পারবেন", "Past meals can only be edited by Admin")
                              : t("অন্য মেম্বারের মিল পরিবর্তন করা যাবে না", "Cannot edit another member's meal")
                            : on
                            ? t("বন্ধ করতে চাপুন", "Click to turn OFF")
                            : t("চালু করতে চাপুন", "Click to turn ON")
                        }
                      >
                        <span>{on ? t("চালু", "ON") : t("বন্ধ", "OFF")}</span>
                        <span className="text-[10px]">{on ? "✓" : "✕"}</span>
                        {!canEditThisMeal && isPastDate && <span className="text-[9px]">🔒</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Integrated Guest Meals Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {t("আজকের গেস্ট মিল", "Today's Guest Meals")}
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                {t("মেহমানের মিল যুক্ত করুন, মোট মিলের সাথে যোগ হবে", "Add guest meals to include in total meal count")}
              </p>
            </div>
          </div>

          <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
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
                  <Select name="memberId" defaultValue={members[0]?.id ?? ""}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.user?.name ?? m.name}
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
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{g.guestName}</p>
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
