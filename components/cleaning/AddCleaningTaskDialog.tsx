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
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createCleaningTaskAction({
        title: fd.get("title"),
        location: fd.get("location"),
        assignedMemberId: fd.get("assignedMemberId"),
        dueDate: fd.get("dueDate"),
        recurrence: fd.get("recurrence") || undefined,
        note: fd.get("note") || undefined,
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <Plus size={14} /> {t("টাস্ক যুক্ত করুন", "Add Task")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ক্লিনিং টাস্ক যুক্ত করুন", "Add Cleaning Task")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
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
              <Select name="assignedMemberId">
                <SelectTrigger><SelectValue placeholder={t("মেম্বার নির্বাচন করুন", "Select member")} /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.user.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("রোটেশন", "Recurrence")}</Label>
              <Select name="recurrence" defaultValue="">
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
