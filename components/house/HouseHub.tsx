"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Brush, Wrench, ShoppingCart, CheckCircle2, Plus,
  Trash2, Check, Loader2, Coins,
} from "lucide-react";
import {
  completeCleaningTaskAction,
  createCleaningTaskAction,
  createMaintenanceAction,
  updateMaintenanceStatusAction,
  addShoppingItemAction,
  purchaseShoppingItemAction,
  deleteShoppingItemAction,
} from "@/app/actions/app.actions";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";

interface HouseHubProps {
  cleaningTasks: any[];
  maintenanceReports: any[];
  shoppingItems: any[];
  members: any[];
  isAdmin: boolean;
  currentMemberId: string | null;
  monthlyHouseCost: {
    totalHouseCost: number;
    maintenanceCost: number;
    shoppingCost: number;
  };
}

type TabType = "all" | "cleaning" | "maintenance" | "shopping";

export function HouseHub({
  cleaningTasks: initialCleaning,
  maintenanceReports: initialMaintenance,
  shoppingItems: initialShopping,
  members,
  isAdmin,
  currentMemberId,
  monthlyHouseCost,
}: HouseHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "all";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [cleaningList, setCleaningList] = useState(initialCleaning);
  const [maintenanceList, setMaintenanceList] = useState(initialMaintenance);
  const [shoppingList, setShoppingList] = useState(initialShopping);

  // Modals state
  const [cleanDialogOpen, setCleanDialogOpen] = useState(false);
  const [maintDialogOpen, setMaintDialogOpen] = useState(false);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<any>(null);

  // Loading states
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inline shopping item input
  const [quickItemName, setQuickItemName] = useState("");
  const [quickItemCost, setQuickItemCost] = useState("");

  // Counts
  const pendingCleaningCount = cleaningList.filter((c) => c.status === "PENDING").length;
  const pendingMaintCount = maintenanceList.filter((m) => m.status !== "RESOLVED").length;
  const pendingShopCount = shoppingList.filter((s) => s.status === "PENDING").length;

  // Live total house expenses
  const totalHouseSpent =
    shoppingList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0) +
    maintenanceList.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  // 1. Complete Cleaning Task
  const handleCompleteCleaning = async (id: string) => {
    setLoadingId(id);
    setCleaningList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "DONE", completedAt: new Date() } : item))
    );
    try {
      await completeCleaningTaskAction(id);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  // 2. Add Cleaning Task
  const handleAddCleaning = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createCleaningTaskAction({
        title: fd.get("title") as string,
        location: fd.get("location") as string,
        assignedMemberId: fd.get("assignedMemberId") as string,
        dueDate: new Date(fd.get("dueDate") as string),
        recurrence: (fd.get("recurrence") as string) || undefined,
        recurrenceInterval: Number(fd.get("recurrenceInterval")) || 1,
        note: (fd.get("note") as string) || undefined,
      });
      setCleanDialogOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Add Maintenance Report
  const handleAddMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createMaintenanceAction({
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
        location: (fd.get("location") as string) || undefined,
        priority: (fd.get("priority") as string) || "MEDIUM",
        cost: Number(fd.get("cost")) || 0,
      });
      setMaintDialogOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Update Maintenance Status with Cost
  const handleUpdateMaintStatus = async (id: string, status: string, cost?: number) => {
    setLoadingId(id);
    setMaintenanceList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, cost: cost !== undefined ? cost : item.cost, resolvedAt: status === "RESOLVED" ? new Date() : null }
          : item
      )
    );
    try {
      await updateMaintenanceStatusAction(id, status, cost);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  // 5. Add Shopping Item
  const handleAddShopping = async (name: string, quantity = "1", unit = "piece", cost = 0, note?: string) => {
    if (!name.trim()) return;
    const tempId = `shop-${Date.now()}`;
    const newItem = {
      id: tempId,
      name,
      quantity,
      unit,
      cost,
      note,
      status: "PENDING",
      addedBy: members.find((m) => m.id === currentMemberId),
    };
    setShoppingList((prev) => [newItem, ...prev]);
    setQuickItemName("");
    setQuickItemCost("");
    setShopDialogOpen(false);

    try {
      await addShoppingItemAction({ name, quantity, unit, cost, note });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Purchase Shopping Item with Cost
  const handleConfirmPurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedShopItem) return;
    const fd = new FormData(e.currentTarget);
    const cost = Number(fd.get("cost")) || 0;

    setShoppingList((prev) =>
      prev.map((item) => (item.id === selectedShopItem.id ? { ...item, status: "PURCHASED", cost, purchasedAt: new Date() } : item))
    );
    setPurchaseDialogOpen(false);

    try {
      await purchaseShoppingItemAction(selectedShopItem.id, cost);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Delete Shopping Item
  const handleDeleteShopping = async (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteShoppingItemAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick KPI Cards + Live Cost Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("cleaning")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-white flex items-center justify-between",
            activeTab === "cleaning" ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Brush size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">ক্লিনিং ডিউটি</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{pendingCleaningCount} <span className="text-xs font-normal text-gray-400">বাকি</span></p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maintenance")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-white flex items-center justify-between",
            activeTab === "maintenance" ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Wrench size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">মেরামত ও সমস্যা</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{pendingMaintCount} <span className="text-xs font-normal text-gray-400">ওপেন</span></p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shopping")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-white flex items-center justify-between",
            activeTab === "shopping" ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <ShoppingCart size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">শপিং লিস্ট</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{pendingShopCount} <span className="text-xs font-normal text-gray-400">আইটেম</span></p>
            </div>
          </div>
        </button>

        {/* 💰 Real Expense Card (Flows to Dashboard & Settlement) */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Coins size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 truncate">হাউজ খরচ (Dashboard)</p>
            <p className="text-base font-bold text-emerald-950 dark:text-emerald-100 truncate">
              {formatCurrency(totalHouseSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            সব একত্রে (All)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cleaning")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "cleaning" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Brush size={13} />
            ক্লিনিং ({pendingCleaningCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "maintenance" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Wrench size={13} />
            মেরামত ({pendingMaintCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shopping")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "shopping" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ShoppingCart size={13} />
            শপিং লিস্ট ({pendingShopCount})
          </button>
        </div>

        {/* Action Buttons based on active tab */}
        <div className="flex items-center gap-2 shrink-0">
          {(activeTab === "all" || activeTab === "cleaning") && isAdmin && (
            <Dialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus size={14} />
                  + Add Cleaning
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>নতুন ক্লিনিং ডিউটি যুক্ত করুন</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCleaning} className="space-y-3.5 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="c-title">ক্লিনিং টাস্কের নাম *</Label>
                    <Input id="c-title" name="title" placeholder="যেমন: বাথরুম ডিপ ক্লিন, ডাইনিং মুছা..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="c-loc">লোকেশন *</Label>
                      <Input id="c-loc" name="location" placeholder="১ম তলা বাথরুম..." required />
                    </div>
                    <div className="space-y-1">
                      <Label>দায়িত্বপ্রাপ্ত মেম্বার *</Label>
                      <Select name="assignedMemberId" defaultValue={members[0]?.id ?? ""}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.user?.name ?? m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="c-due">সম্পন্নের তারিখ *</Label>
                      <Input id="c-due" name="dueDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                    </div>
                    <div className="space-y-1">
                      <Label>পুনরাবৃত্তি (Recurrence)</Label>
                      <Select name="recurrence" defaultValue="WEEKLY">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">প্রতিদিন</SelectItem>
                          <SelectItem value="WEEKLY">সাপ্তাহিক</SelectItem>
                          <SelectItem value="MONTHLY">মাসিক</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCleanDialogOpen(false)} className="flex-1">বাতিল</Button>
                    <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting}>
                      {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}সেভ করুন
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {(activeTab === "all" || activeTab === "maintenance") && (
            <Dialog open={maintDialogOpen} onOpenChange={setMaintDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus size={14} />
                  + Report Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>সমস্যা বা মেরামত রিপোর্ট করুন</DialogTitle></DialogHeader>
                <form onSubmit={handleAddMaintenance} className="space-y-3.5 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="m-title">সমস্যার শিরোনাম *</Label>
                    <Input id="m-title" name="title" placeholder="যেমন: ফ্যান মেরামত, পানির ট্যাপ লিক..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="m-loc">স্থান / রুম</Label>
                      <Input id="m-loc" name="location" placeholder="রুম ১০১, কিচেন..." />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="m-cost">আনুমানিক / মেরামত খরচ (৳)</Label>
                      <Input id="m-cost" name="cost" type="number" min="0" defaultValue="0" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>জরুরিতা (Priority)</Label>
                      <Select name="priority" defaultValue="MEDIUM">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">কম (Low)</SelectItem>
                          <SelectItem value="MEDIUM">মাঝারি (Medium)</SelectItem>
                          <SelectItem value="HIGH">জরুরি (High)</SelectItem>
                          <SelectItem value="URGENT">অতি জরুরি (Urgent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="m-desc">বিবরণ</Label>
                      <Input id="m-desc" name="description" placeholder="বিস্তারিত..." />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setMaintDialogOpen(false)} className="flex-1">বাতিল</Button>
                    <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={submitting}>
                      {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}সাবমিট করুন
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {(activeTab === "all" || activeTab === "shopping") && (
            <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus size={14} />
                  + Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>শপিং লিস্টে আইটেম যোগ করুন</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    handleAddShopping(
                      fd.get("name") as string,
                      fd.get("quantity") as string,
                      fd.get("unit") as string,
                      Number(fd.get("cost")) || 0,
                      (fd.get("note") as string) || undefined
                    );
                  }}
                  className="space-y-3.5 mt-2"
                >
                  <div className="space-y-1">
                    <Label htmlFor="s-name">আইটেমের নাম *</Label>
                    <Input id="s-name" name="name" placeholder="যেমন: হারপিক, ভিম লিকুইড, লাইট বাল্ব..." required />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="s-qty">পরিমাণ</Label>
                      <Input id="s-qty" name="quantity" defaultValue="1" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="s-unit">একক</Label>
                      <Input id="s-unit" name="unit" defaultValue="piece" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="s-cost">দাম (৳)</Label>
                      <Input id="s-cost" name="cost" type="number" min="0" defaultValue="0" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShopDialogOpen(false)} className="flex-1">বাতিল</Button>
                    <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">যোগ করুন</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 3. Section 1: Cleaning Schedule */}
      {(activeTab === "all" || activeTab === "cleaning") && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Brush size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">ক্লিনিং শিডিউল ও দায়িত্ব (Cleaning Tasks)</h3>
                <p className="text-xs text-gray-400">মেম্বারদের ক্লিনিং দায়িত্ব সম্পন্ন হলে Done চাপুন</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
              {pendingCleaningCount} টি বাকি
            </span>
          </div>

          {cleaningList.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-400">কোনো ক্লিনিং টাস্ক নির্ধারিত নেই।</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cleaningList.map((task) => {
                const isDone = task.status === "DONE";
                const memberName = task.assignedMember?.user?.name ?? "Unassigned";
                const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3",
                      isDone ? "bg-gray-50/70 border-gray-200 opacity-60" : "bg-white border-teal-100 hover:border-teal-200 shadow-xs"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-teal-50 text-teal-800">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold text-gray-900 truncate", isDone && "line-through")}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {task.location} • {memberName} {task.recurrence ? `(${task.recurrence})` : ""}
                        </p>
                      </div>
                    </div>

                    {!isDone ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCompleteCleaning(task.id)}
                        disabled={loadingId === task.id}
                        className="h-7 px-3 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-full shrink-0 gap-1"
                      >
                        {loadingId === task.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Done
                      </Button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={14} /> সম্পন্ন
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Section 2: Maintenance Issues with Repair Cost */}
      {(activeTab === "all" || activeTab === "maintenance") && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wrench size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">মেরামত ও রক্ষণাবেক্ষণ (Maintenance Issues)</h3>
                <p className="text-xs text-gray-400">বাসার যেকোনো মেরামত খরচ সরাসরি ড্যাশবোর্ডে যুক্ত হবে</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
              {pendingMaintCount} টি ওপেন
            </span>
          </div>

          {maintenanceList.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-400">কোনো সমস্যা রিপোর্ট করা নেই।</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {maintenanceList.map((item) => {
                const isResolved = item.status === "RESOLVED";
                const reportedName = item.reportedBy?.user?.name ?? "Member";
                const cost = Number(item.cost) || 0;

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-xs font-semibold text-gray-900", isResolved && "line-through text-gray-400")}>
                          {item.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 px-2 rounded-full font-bold",
                            item.priority === "URGENT" || item.priority === "HIGH"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {item.priority}
                        </Badge>
                        {cost > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
                            খরচ: {formatCurrency(cost)}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 px-2 rounded-full",
                            isResolved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.location ? `${item.location} • ` : ""}রিপোর্টকারী: {reportedName}
                        {item.description ? ` — ${item.description}` : ""}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="shrink-0 flex items-center gap-1.5">
                        {item.status !== "RESOLVED" ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const costStr = prompt("মেরামত খরচ কত টাকা হয়েছে? (৳):", String(cost || 0));
                              const finalCost = costStr ? Number(costStr) : cost;
                              handleUpdateMaintStatus(item.id, "RESOLVED", finalCost);
                            }}
                            disabled={loadingId === item.id}
                            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                          >
                            Resolve ✓
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateMaintStatus(item.id, "IN_PROGRESS")}
                            className="h-7 px-2.5 text-xs text-gray-500 rounded-full"
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Section 3: Shared Shopping List with Purchase Cost */}
      {(activeTab === "all" || activeTab === "shopping") && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShoppingCart size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">শেয়ার্ড শপিং লিস্ট (Household Shopping List)</h3>
                <p className="text-xs text-gray-400">মালামাল কেনা হলে টিক চিহ্ন দিয়ে দাম লিখুন, ড্যাশবোর্ডে খরচ যুক্ত হবে</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              {pendingShopCount} টি দরকার
            </span>
          </div>

          {/* Inline Quick Add Input with Cost */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddShopping(quickItemName, "1", "piece", Number(quickItemCost) || 0);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={quickItemName}
              onChange={(e) => setQuickItemName(e.target.value)}
              placeholder="+ নতুন মালামালের নাম (যেমন: হারপিক, ডিশওয়াশ, বাল্ব)..."
              className="h-9 text-xs flex-1 rounded-xl"
            />
            <Input
              value={quickItemCost}
              onChange={(e) => setQuickItemCost(e.target.value)}
              placeholder="দাম ৳"
              type="number"
              min="0"
              className="h-9 text-xs w-20 rounded-xl"
            />
            <Button type="submit" size="sm" className="h-9 px-3.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              যোগ করুন
            </Button>
          </form>

          {/* Shopping Items List */}
          {shoppingList.length === 0 ? (
            <p className="text-center py-6 text-xs text-gray-400">শপিং লিস্টে কোনো আইটেম নেই।</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {shoppingList.map((item) => {
                const isPurchased = item.status === "PURCHASED";
                const addedName = item.addedBy?.user?.name ?? "Member";
                const cost = Number(item.cost) || 0;

                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShopItem(item);
                          setPurchaseDialogOpen(true);
                        }}
                        className={cn(
                          "w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0",
                          isPurchased
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-gray-300 hover:border-indigo-500 bg-white text-transparent"
                        )}
                        title={isPurchased ? "Marked as purchased" : "Click to mark as purchased with price"}
                      >
                        <Check size={14} />
                      </button>

                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold text-gray-900 truncate", isPurchased && "line-through text-gray-400")}>
                          {item.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {item.quantity ? `${item.quantity} ${item.unit ?? ""} • ` : ""}যুক্ত করেছে: {addedName}
                          {item.note ? ` (${item.note})` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cost > 0 && (
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          {formatCurrency(cost)}
                        </span>
                      )}
                      {isPurchased && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          কেনা হয়েছে ✓
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteShopping(item.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Purchase Item Cost Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>মালামাল কেনার খরচ লিখুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmPurchase} className="space-y-3 mt-2">
            <p className="text-xs text-gray-500">
              আইটেম: <strong className="text-gray-900">{selectedShopItem?.name}</strong>
            </p>
            <div className="space-y-1">
              <Label htmlFor="pur-cost">কেনার দাম / খরচ (৳) *</Label>
              <Input id="pur-cost" name="cost" type="number" min="0" defaultValue={selectedShopItem?.cost || "0"} required autoFocus />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)} className="flex-1">
                বাতিল
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                সেভ করুন ✓
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
