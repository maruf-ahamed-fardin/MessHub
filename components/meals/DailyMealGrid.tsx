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
import { useT } from "@/lib/i18n/useT";

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

export function DailyMealGrid({ date, members, meals, guestMeals }: DailyMealGridProps) {
  const router = useRouter();
  const T = useT();

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

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* 1. Live Meal Summary Cards (Member + Guest combined) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Sun size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-900">{T.meals.breakfast}</p>
            <p className="text-xl font-bold text-amber-950">
              {totalBreakfast}{" "}
              <span className="text-xs font-normal text-amber-700">
                ({memberBreakfast} + {guestBreakfast} {T.meals.guest})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Utensils size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-900">{T.meals.lunch}</p>
            <p className="text-xl font-bold text-blue-950">
              {totalLunch}{" "}
              <span className="text-xs font-normal text-blue-700">
                ({memberLunch} + {guestLunch} {T.meals.guest})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Moon size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-900">{T.meals.dinner}</p>
            <p className="text-xl font-bold text-indigo-950">
              {totalDinner}{" "}
              <span className="text-xs font-normal text-indigo-700">
                ({memberDinner} + {guestDinner} {T.meals.guest})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-900">{T.meals.total}</p>
            <p className="text-xl font-bold text-emerald-950">
              {grandTotal} <span className="text-xs font-normal text-emerald-700">{T.common.total}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Member Meal Table */}
      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between bg-gray-50/50">
          <div>
            <p className="text-sm font-semibold text-gray-900">{T.meals.memberMealList} ({formattedDate})</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{T.meals.clickToToggle}</p>
          </div>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {T.meals.members}
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_repeat(3,75px)] sm:grid-cols-[1fr_repeat(3,105px)] border-b border-[hsl(var(--border))] px-4 py-2.5 bg-gray-50/30 text-xs font-semibold text-gray-500">
          <span>{T.meals.memberName}</span>
          <span className="text-center">{T.meals.breakfast}</span>
          <span className="text-center">{T.meals.lunch}</span>
          <span className="text-center">{T.meals.dinner}</span>
        </div>

        {/* Members List */}
        <div className="divide-y divide-[hsl(var(--border))]">
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
                className="grid grid-cols-[1fr_repeat(3,75px)] sm:grid-cols-[1fr_repeat(3,105px)] items-center px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user?.name ?? member.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {member.seat ? `${member.seat.room?.name ?? "Room"} (${member.seat.label})` : T.meals.activeMember}
                    </p>
                  </div>
                </div>

                {MEAL_KEYS.map((field) => {
                  const on = state[field];
                  const isLoading = loadingKey === `${member.id}-${field}`;

                  return (
                    <div key={field} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(member.id, field)}
                        className={cn(
                          "w-16 sm:w-20 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 select-none active:scale-95 cursor-pointer shadow-xs",
                          on
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200",
                          isLoading && "opacity-60"
                        )}
                        title={on ? "Click to turn OFF" : "Click to turn ON"}
                      >
                        <span>{on ? "ON" : "OFF"}</span>
                        <span className="text-[10px]">{on ? "✓" : "✕"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Integrated Guest Meals Section (Right below Today's Meals) */}
      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between bg-indigo-50/40">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">আজকের গেস্ট মিল (Guest Meals)</p>
              <p className="text-xs text-indigo-700">মেম্বারের মেহমানের মিল যুক্ত করুন ও টোটাল মিলের সাথে কাউন্ট হবে</p>
            </div>
          </div>

          <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus size={14} />
                <span>+ Add Guest Meal</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>গেস্ট মিল যুক্ত করুন</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGuestMeal} className="space-y-3.5 mt-2">
                <div className="space-y-1">
                  <Label>মেম্বার (কার গেস্ট) *</Label>
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
                    <Label htmlFor="guestName">গেস্টের নাম / পরিচয়</Label>
                    <Input id="guestName" name="guestName" placeholder="যেমন: কাজিন, বন্ধু..." defaultValue="Guest" required />
                  </div>
                  <div className="space-y-1">
                    <Label>মিলের সময় *</Label>
                    <Select name="mealType" defaultValue="LUNCH">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BREAKFAST">☀️ সকাল (Breakfast)</SelectItem>
                        <SelectItem value="LUNCH">🍽️ দুপুর (Lunch)</SelectItem>
                        <SelectItem value="DINNER">🌙 রাত (Dinner)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="quantity">মিল সংখ্যা *</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" max="10" defaultValue="1" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="note">নোট (ঐচ্ছিক)</Label>
                    <Input id="note" name="note" placeholder="নোট..." />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setGuestDialogOpen(false)} className="flex-1">
                    বাতিল
                  </Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={addingGuest}>
                    {addingGuest ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    গেস্ট মিল যোগ করুন
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Guest Meal List */}
        {guestList.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            আজকের জন্য কোনো গেস্ট মিল যোগ করা হয়নি। প্রয়োজনে উপরে <span className="font-semibold text-indigo-600">+ Add Guest Meal</span> চাপুন।
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {guestList.map((g) => {
              const hostName = g.member?.user?.name ?? g.member?.name ?? "Member";
              const mealLabel =
                g.mealType === "BREAKFAST" ? "☀️ সকাল" : g.mealType === "LUNCH" ? "🍽️ দুপুর" : "🌙 রাত";

              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      G
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{g.guestName}</p>
                        <span className="text-[11px] font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                          {mealLabel}
                        </span>
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {g.quantity} টি মিল
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">মেম্বার: {hostName} {g.note ? `• ${g.note}` : ""}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGuestMeal(g.id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Guest Meal"
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
