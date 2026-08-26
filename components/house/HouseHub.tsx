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
  Trash2, Check, Loader2, Coins, ListTodo,
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
import { usePreferences } from "@/lib/context/PreferencesContext";

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
}: HouseHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "all";
  const { t } = usePreferences();

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
    const title = fd.get("title") as string;
    const description = (fd.get("description") as string) || undefined;
    const location = (fd.get("location") as string) || undefined;
    const priority = (fd.get("priority") as string) || "MEDIUM";
    const cost = Number(fd.get("cost")) || 0;

    const tempId = `maint-${Date.now()}`;
    const newMaint = {
      id: tempId,
      title,
      description,
      location,
      priority,
      cost,
      status: "REPORTED",
      reportedBy: members.find((m) => m.id === currentMemberId) || { user: { name: "You" } },
      createdAt: new Date(),
    };
    setMaintenanceList((prev) => [newMaint, ...prev]);
    setMaintDialogOpen(false);

    try {
      await createMaintenanceAction({
        title,
        description,
        location,
        priority,
        cost,
      });
      router.refresh();
    } catch (err) {
      console.error("Error creating maintenance issue:", err);
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
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("cleaning")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-white dark:bg-slate-900 flex items-center justify-between",
            activeTab === "cleaning" ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Brush size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">{t("ক্লিনিং ডিউটি", "Cleaning Duties")}</p>
              <p className="text-base font-bold text-gray-900 dark:text-slate-100">
                {pendingCleaningCount} <span className="text-xs font-normal text-gray-400 dark:text-slate-500">{t("বাকি", "pending")}</span>
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maintenance")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-white dark:bg-slate-900 flex items-center justify-between",
            activeTab === "maintenance" ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Wrench size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">{t("মেরামত ও সমস্যা", "Maintenance")}</p>
              <p className="text-base font-bold text-gray-900 dark:text-slate-100">
                {pendingMaintCount} <span className="text-xs font-normal text-gray-400 dark:text-slate-500">{t("ওপেন", "open")}</span>
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shopping")}
          className={cn(
            "p-3.5 rounded-xl border text-left transition-all cursor-pointer bg-white dark:bg-slate-900 flex items-center justify-between",
            activeTab === "shopping" ? "border-primary ring-2 ring-primary/20 shadow-xs" : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <ShoppingCart size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">{t("শপিং লিস্ট", "Shopping List")}</p>
              <p className="text-base font-bold text-gray-900 dark:text-slate-100">
                {pendingShopCount} <span className="text-xs font-normal text-gray-400 dark:text-slate-500">{t("আইটেম", "items")}</span>
              </p>
            </div>
          </div>
        </button>

        {/* Real Expense Card */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Coins size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 truncate">{t("হাউজ খরচ", "House Expenses")}</p>
            <p className="text-base font-bold text-emerald-950 dark:text-emerald-100 truncate">
              {formatCurrency(totalHouseSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Tab Navigation Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-3">
        {/* Scrollable Segmented Tabs Track */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/90 dark:bg-slate-800/90 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
              activeTab === "all"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            {t("সব একত্রে", "All Tasks")}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cleaning")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
              activeTab === "cleaning"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <Brush size={13} className="text-teal-600 dark:text-teal-400" />
            <span>{t("ক্লিনিং", "Cleaning")}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "cleaning" ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            )}>
              {pendingCleaningCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
              activeTab === "maintenance"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <Wrench size={13} className="text-amber-600 dark:text-amber-400" />
            <span>{t("মেরামত", "Maintenance")}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "maintenance" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            )}>
              {pendingMaintCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shopping")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
              activeTab === "shopping"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <ShoppingCart size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t("শপিং লিস্ট", "Shopping")}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeTab === "shopping" ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
            )}>
              {pendingShopCount}
            </span>
          </button>
        </div>

        {/* Action Buttons based on active tab */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 w-full sm:w-auto">
          {(activeTab === "all" || activeTab === "cleaning") && isAdmin && (
            <Dialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={14} />
                  <span>{activeTab === "all" ? t("ক্লিনিং টাস্ক", "Cleaning Task") : t("ক্লিনিং টাস্ক যোগ করুন", "Add Cleaning Task")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{t("নতুন ক্লিনিং ডিউটি যুক্ত করুন", "Add New Cleaning Task")}</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCleaning} className="space-y-3.5 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="c-title">{t("ক্লিনিং টাস্কের নাম *", "Task Title *")}</Label>
                    <Input id="c-title" name="title" placeholder={t("যেমন: বাথরুম ডিপ ক্লিন, ডাইনিং মুছা...", "e.g. Bathroom deep clean, Dining hall sweep...")} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="c-loc">{t("লোকেশন *", "Location *")}</Label>
                      <Input id="c-loc" name="location" placeholder={t("১ম তলা বাথরুম...", "1st Floor Bathroom...")} required />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("দায়িত্বপ্রাপ্ত মেম্বার *", "Assigned Member *")}</Label>
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
                      <Label htmlFor="c-due">{t("সম্পন্নের তারিখ *", "Due Date *")}</Label>
                      <Input id="c-due" name="dueDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("পুনরাবৃত্তি", "Recurrence")}</Label>
                      <Select name="recurrence" defaultValue="WEEKLY">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">{t("প্রতিদিন", "Daily")}</SelectItem>
                          <SelectItem value="WEEKLY">{t("সাপ্তাহিক", "Weekly")}</SelectItem>
                          <SelectItem value="MONTHLY">{t("মাসিক", "Monthly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCleanDialogOpen(false)} className="flex-1">
                      {t("বাতিল", "Cancel")}
                    </Button>
                    <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting}>
                      {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                      {t("সেভ করুন", "Save Task")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {(activeTab === "all" || activeTab === "maintenance") && (
            <Dialog open={maintDialogOpen} onOpenChange={setMaintDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={14} />
                  <span>{activeTab === "all" ? t("সমস্যা রিপোর্ট", "Report Issue") : t("সমস্যা রিপোর্ট করুন", "Report Issue")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{t("সমস্যা বা মেরামত রিপোর্ট করুন", "Report Maintenance Issue")}</DialogTitle></DialogHeader>
                <form onSubmit={handleAddMaintenance} className="space-y-3.5 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="m-title">{t("সমস্যার শিরোনাম *", "Issue Title *")}</Label>
                    <Input id="m-title" name="title" placeholder={t("যেমন: ফ্যান মেরামত, পানির ট্যাপ লিক...", "e.g. Fan repair, Tap leaking...")} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="m-loc">{t("স্থান / রুম", "Location / Room")}</Label>
                      <Input id="m-loc" name="location" placeholder={t("রুম ১০১, কিচেন...", "Room 101, Kitchen...")} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="m-cost">{t("মেরামত খরচ (৳)", "Estimated / Repair Cost (৳)")}</Label>
                      <Input id="m-cost" name="cost" type="number" min="0" defaultValue="0" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t("জরুরিতা", "Priority")}</Label>
                      <Select name="priority" defaultValue="MEDIUM">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">{t("কম", "Low")}</SelectItem>
                          <SelectItem value="MEDIUM">{t("মাঝারি", "Medium")}</SelectItem>
                          <SelectItem value="HIGH">{t("জরুরি", "High")}</SelectItem>
                          <SelectItem value="URGENT">{t("অতি জরুরি", "Urgent")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="m-desc">{t("বিবরণ", "Description")}</Label>
                      <Input id="m-desc" name="description" placeholder={t("বিস্তারিত...", "Details...")} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setMaintDialogOpen(false)} className="flex-1">
                      {t("বাতিল", "Cancel")}
                    </Button>
                    <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={submitting}>
                      {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                      {t("সাবমিট করুন", "Submit Report")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {(activeTab === "all" || activeTab === "shopping") && (
            <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={14} />
                  <span>{activeTab === "all" ? t("শপিং আইটেম", "Shopping Item") : t("মালামাল যোগ করুন", "Add Shopping Item")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{t("শপিং লিস্টে আইটেম যোগ করুন", "Add Item to Shopping List")}</DialogTitle></DialogHeader>
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
                    <Label htmlFor="s-name">{t("আইটেমের নাম *", "Item Name *")}</Label>
                    <Input id="s-name" name="name" placeholder={t("যেমন: হারপিক, ভিম লিকুইড, লাইট বাল্ব...", "e.g. Cleaning liquid, Dishwash, Light bulb...")} required />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="s-qty">{t("পরিমাণ", "Quantity")}</Label>
                      <Input id="s-qty" name="quantity" defaultValue="1" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="s-unit">{t("একক", "Unit")}</Label>
                      <Input id="s-unit" name="unit" defaultValue="piece" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="s-cost">{t("দাম (৳)", "Cost (৳)")}</Label>
                      <Input id="s-cost" name="cost" type="number" min="0" defaultValue="0" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShopDialogOpen(false)} className="flex-1">
                      {t("বাতিল", "Cancel")}
                    </Button>
                    <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                      {t("যোগ করুন", "Add Item")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 3. Unified Single Box for all House Tasks & Items */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        {/* Unified Box Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <ListTodo size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                {activeTab === "all"
                  ? t("বাসার সকল টাস্ক ও সমস্যা", "House Tasks & Issues")
                  : activeTab === "cleaning"
                  ? t("ক্লিনিং শিডিউল ও দায়িত্ব", "Cleaning Tasks & Schedule")
                  : activeTab === "maintenance"
                  ? t("মেরামত ও সমস্যা রিপোর্ট", "Maintenance & Repairs")
                  : t("শেয়ার্ড শপিং লিস্ট", "Shared Shopping List")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {activeTab === "all"
                  ? t("ক্লিনিং (টিল), মেরামত (অরেঞ্জ) ও শপিং (পার্পল) টাস্কের সমন্বিত তালিকা", "Unified stream with distinct category colors")
                  : activeTab === "cleaning"
                  ? t("মেম্বারদের ক্লিনিং দায়িত্ব সম্পন্ন হলে Done চাপুন", "Click Done when a cleaning task is completed")
                  : activeTab === "maintenance"
                  ? t("বাসার মেরামত খরচ সরাসরি মেস হিসাবে যুক্ত হবে", "Repair costs are directly linked to shared mess finances")
                  : t("মালামাল কেনা হলে টিক দিয়ে খরচ লিখুন", "Mark items as purchased with cost to add to mess expenses")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {(activeTab === "all" || activeTab === "cleaning") && (
              <span className="text-[10px] font-bold bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <Brush size={11} /> {t(`${pendingCleaningCount} বাকি`, `${pendingCleaningCount} pending`)}
              </span>
            )}
            {(activeTab === "all" || activeTab === "maintenance") && (
              <span className="text-[10px] font-bold bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Wrench size={11} /> {t(`${pendingMaintCount} ওপেন`, `${pendingMaintCount} open`)}
              </span>
            )}
            {(activeTab === "all" || activeTab === "shopping") && (
              <span className="text-[10px] font-bold bg-purple-100/80 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <ShoppingCart size={11} /> {t(`${pendingShopCount} দরকার`, `${pendingShopCount} needed`)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Shopping Inline Add Bar (if in shopping or all tab) */}
        {(activeTab === "all" || activeTab === "shopping") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddShopping(quickItemName, "1", "piece", Number(quickItemCost) || 0);
            }}
            className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/60"
          >
            <Input
              value={quickItemName}
              onChange={(e) => setQuickItemName(e.target.value)}
              placeholder={t("+ নতুন শপিং মালামাল (যেমন: হারপিক, ডিশওয়াশ, বাল্ব)...", "+ Quick add shopping item (e.g. Dishwash, Bulb)...")}
              className="h-8 text-xs flex-1 bg-white dark:bg-slate-900 rounded-lg border-0 shadow-none focus-visible:ring-1 focus-visible:ring-purple-500"
            />
            <Input
              value={quickItemCost}
              onChange={(e) => setQuickItemCost(e.target.value)}
              placeholder={t("দাম ৳", "Price ৳")}
              type="number"
              min="0"
              className="h-8 text-xs w-16 sm:w-20 bg-white dark:bg-slate-900 rounded-lg border-0 shadow-none focus-visible:ring-1 focus-visible:ring-purple-500"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-2xs shrink-0 cursor-pointer"
            >
              {t("যোগ করুন", "Add")}
            </Button>
          </form>
        )}

        {/* Unified Item Stream */}
        <div className="space-y-2">
          {/* 1. Cleaning Items (Teal / Cyan theme) */}
          {(activeTab === "all" || activeTab === "cleaning") &&
            cleaningList.map((task) => {
              const isDone = task.status === "DONE";
              const memberName = task.assignedMember?.user?.name ?? t("অনির্ধারিত", "Unassigned");
              const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

              return (
                <div
                  key={`clean-${task.id}`}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5",
                    isDone
                      ? "bg-teal-50/20 dark:bg-teal-950/10 border-teal-100/70 dark:border-slate-800 opacity-65"
                      : "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/90 dark:border-teal-900/80 hover:border-teal-400 dark:hover:border-teal-700 shadow-2xs"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7.5 w-7.5 shrink-0 ring-1.5 ring-teal-200/70 dark:ring-teal-900/70">
                      <AvatarFallback className="text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {t("ক্লিনিং", "Cleaning")}
                        </span>
                        <p className={cn("text-xs font-bold text-gray-900 dark:text-slate-100 truncate", isDone && "line-through text-gray-400 dark:text-slate-500")}>
                          {task.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
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
                      className="h-6.5 px-2.5 text-[10px] font-bold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-full shrink-0 gap-1 shadow-2xs cursor-pointer"
                    >
                      {loadingId === task.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                      {t("সম্পন্ন", "Done")}
                    </Button>
                  ) : (
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950/80 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-teal-200 dark:border-teal-800">
                      <CheckCircle2 size={11} /> {t("সম্পন্ন", "Done")}
                    </span>
                  )}
                </div>
              );
            })}

          {/* 2. Maintenance Items (Amber / Orange theme) */}
          {(activeTab === "all" || activeTab === "maintenance") &&
            maintenanceList.map((item) => {
              const isResolved = item.status === "RESOLVED";
              const reportedName = item.reportedBy?.user?.name ?? "Member";
              const cost = Number(item.cost) || 0;

              return (
                <div
                  key={`maint-${item.id}`}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5",
                    isResolved
                      ? "bg-amber-50/20 dark:bg-amber-950/10 border-amber-100/70 dark:border-slate-800 opacity-65"
                      : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-900/80 hover:border-amber-400 dark:hover:border-amber-700 shadow-2xs"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7.5 h-7.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 border border-amber-200 dark:border-amber-800">
                      <Wrench size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {t("মেরামত", "Maintenance")}
                        </span>
                        <p className={cn("text-xs font-bold text-gray-900 dark:text-slate-100 truncate", isResolved && "line-through text-gray-400")}>
                          {item.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] py-0 px-1.5 rounded-full font-bold",
                            item.priority === "URGENT" || item.priority === "HIGH"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          )}
                        >
                          {item.priority}
                        </Badge>
                        {cost > 0 && (
                          <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-0 text-[9px] font-bold">
                            {t(`খরচ: ${formatCurrency(cost)}`, `Cost: ${formatCurrency(cost)}`)}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] py-0 px-1.5 rounded-full font-bold",
                            isResolved ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                        {item.location ? `${item.location} • ` : ""}{t(`রিপোর্টকারী: ${reportedName}`, `Reported by: ${reportedName}`)}
                        {item.description ? ` — ${item.description}` : ""}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="shrink-0 flex items-center gap-1.5">
                      {item.status !== "RESOLVED" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const costStr = prompt(t("মেরামত খরচ কত টাকা হয়েছে? (৳):", "Enter final repair cost (৳):"), String(cost || 0));
                            const finalCost = costStr ? Number(costStr) : cost;
                            handleUpdateMaintStatus(item.id, "RESOLVED", finalCost);
                          }}
                          disabled={loadingId === item.id}
                          className="h-6.5 px-2.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-2xs cursor-pointer"
                        >
                          {t("সমাধান ✓", "Resolve ✓")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateMaintStatus(item.id, "IN_PROGRESS")}
                          className="h-6.5 px-2.5 text-[10px] text-gray-500 rounded-full font-bold"
                        >
                          {t("পুনরায় খুলুন", "Reopen")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* 3. Shopping Items (Purple / Indigo theme) */}
          {(activeTab === "all" || activeTab === "shopping") &&
            shoppingList.map((item) => {
              const isPurchased = item.status === "PURCHASED";
              const addedName = item.addedBy?.user?.name ?? "Member";
              const cost = Number(item.cost) || 0;

              return (
                <div
                  key={`shop-${item.id}`}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5",
                    isPurchased
                      ? "bg-purple-50/20 dark:bg-purple-950/10 border-purple-100/70 dark:border-slate-800 opacity-65"
                      : "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/90 dark:border-purple-900/80 hover:border-purple-400 dark:hover:border-purple-700 shadow-2xs"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShopItem(item);
                        setPurchaseDialogOpen(true);
                      }}
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0",
                        isPurchased
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-600 text-white shadow-xs"
                          : "border-purple-300 dark:border-purple-700 hover:border-purple-500 bg-white dark:bg-slate-900 text-transparent"
                      )}
                      title={isPurchased ? t("কেনা হয়েছে", "Purchased") : t("কেনা হলে টিক দিন", "Mark as purchased")}
                    >
                      <Check size={12} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {t("শপিং", "Shopping")}
                        </span>
                        <p className={cn("text-xs font-bold text-gray-900 dark:text-slate-100 truncate", isPurchased && "line-through text-gray-400 dark:text-slate-500")}>
                          {item.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {item.quantity ? `${item.quantity} ${item.unit ?? ""} • ` : ""}{t(`যুক্ত করেছে: ${addedName}`, `Added by: ${addedName}`)}
                        {item.note ? ` (${item.note})` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {cost > 0 && (
                      <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        {formatCurrency(cost)}
                      </span>
                    )}
                    {isPurchased && (
                      <span className="text-[9px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {t("কেনা হয়েছে ✓", "Purchased ✓")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteShopping(item.id)}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={t("মুছে ফেলুন", "Delete item")}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Empty State */}
          {((activeTab === "all" && cleaningList.length === 0 && maintenanceList.length === 0 && shoppingList.length === 0) ||
            (activeTab === "cleaning" && cleaningList.length === 0) ||
            (activeTab === "maintenance" && maintenanceList.length === 0) ||
            (activeTab === "shopping" && shoppingList.length === 0)) && (
            <p className="text-center py-6 text-xs text-gray-400 dark:text-slate-500">
              {t("কোনো টাস্ক বা অ্যাক্টিভিটি পাওয়া যায়নি।", "No tasks or activities found.")}
            </p>
          )}
        </div>
      </div>

      {/* Purchase Item Cost Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t("মালামাল কেনার খরচ লিখুন", "Record Purchase Cost")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmPurchase} className="space-y-3 mt-2">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("আইটেম:", "Item:")} <strong className="text-gray-900 dark:text-slate-100">{selectedShopItem?.name}</strong>
            </p>
            <div className="space-y-1">
              <Label htmlFor="pur-cost">{t("কেনার দাম / খরচ (৳) *", "Purchase Price (৳) *")}</Label>
              <Input id="pur-cost" name="cost" type="number" min="0" defaultValue={selectedShopItem?.cost || "0"} required autoFocus />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)} className="flex-1">
                {t("বাতিল", "Cancel")}
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {t("সেভ করুন ✓", "Save ✓")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
