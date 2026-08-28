"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createCleaningTaskAction } from "@/app/actions/app.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function AddCleaningTaskDialog({ members }: { members: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedMemberId, setAssignedMemberId] = useState<string>(members[0]?.id ?? "");
  const [recurrence, setRecurrence] = useState<string>("");
  const router = useRouter();
  const { t } = usePreferences();

  const recurrenceOptions = [
    { value: "", label: t("একবার (পুনরাবৃত্তি ছাড়া)", "No recurrence") },
    { value: "DAILY", label: t("প্রতিদিন", "Daily") },
    { value: "EVERY_2_DAYS", label: t("প্রতি ২ দিন পর পর", "Every 2 days") },
    { value: "EVERY_3_DAYS", label: t("প্রতি ৩ দিন পর পর", "Every 3 days") },
    { value: "WEEKLY", label: t("সাপ্তাহিক", "Weekly") },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const resolvedMemberId = assignedMemberId || members[0]?.id || "";
    if (!resolvedMemberId) {
      setError(t("অনুগ্রহ করে মেম্বার নির্বাচন করুন", "Please select an assigned member"));
      setLoading(false);
      return;
    }

    try {
      const res = await createCleaningTaskAction({
        title: fd.get("title"),
        location: fd.get("location"),
        assignedMemberId: resolvedMemberId,
        dueDate: new Date(fd.get("dueDate") as string),
        recurrence: recurrence || undefined,
        note: (fd.get("note") as string) || undefined,
      });

      if (res && !res.success) {
        setError(res.error || t("টাস্ক তৈরি করা যায়নি", "Failed to create task"));
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t("টাস্ক তৈরি করতে সমস্যা হয়েছে", "Failed to create task"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (val) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs font-bold rounded-xl">
          <Plus size={14} /> {t("টাস্ক যুক্ত করুন", "Add Task")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ক্লিনিং টাস্ক যুক্ত করুন", "Add Cleaning Task")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {error && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="title">{t("কাজের শিরোনাম *", "Task Title *")}</Label>
            <Input id="title" name="title" placeholder={t("যেমন: বাথরুম পরিষ্কার, ডাইনিং মোছা...", "e.g. Bathroom cleaning, mop floor...")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="location">{t("স্থান *", "Location *")}</Label>
              <Input id="location" name="location" placeholder={t("যেমন: বাথরুম ১, কিচেন...", "e.g. Bathroom 1, Kitchen...")} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueDate">{t("তারিখ *", "Due Date *")}</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("দায়িত্বে *", "Assigned To *")}</Label>
              <Select value={assignedMemberId || members[0]?.id || ""} onValueChange={(val) => { if (val) setAssignedMemberId(val); }}>
                <SelectTrigger><SelectValue placeholder={t("মেম্বার নির্বাচন করুন", "Select member")} /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.user?.name ?? m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("রোটেশন", "Recurrence")}</Label>
              <Select value={recurrence} onValueChange={(val) => setRecurrence(val ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {t("টাস্ক তৈরি করুন", "Create Task")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
