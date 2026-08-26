"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createMaintenanceAction } from "@/app/actions/app.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function AddMaintenanceDialog({ reportedById }: { reportedById: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = usePreferences();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createMaintenanceAction({
        title: fd.get("title"),
        description: fd.get("description") || undefined,
        location: fd.get("location") || undefined,
        priority: fd.get("priority"),
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <Plus size={14} /> {t("সমস্যা রিপোর্ট করুন", "Report Problem")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("মেরামত ও সমস্যা রিপোর্ট করুন", "Report Maintenance Issue")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="title">{t("সমস্যার শিরোনাম *", "Issue Title *")}</Label>
            <Input id="title" name="title" placeholder={t("যেমন: পানির কল নষ্ট, লাইট ফিউজ...", "e.g. Broken tap, power issue...")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="location">{t("স্থান", "Location")}</Label>
              <Input id="location" name="location" placeholder={t("যেমন: রুম ১, কিচেন...", "e.g. Room 1, Kitchen...")} />
            </div>
            <div className="space-y-1">
              <Label>{t("জরুরিতা *", "Priority *")}</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 {t("সাধারণ", "Low")}</SelectItem>
                  <SelectItem value="MEDIUM">🟡 {t("মাঝারি", "Medium")}</SelectItem>
                  <SelectItem value="HIGH">🟠 {t("জরুরি", "High")}</SelectItem>
                  <SelectItem value="URGENT">🔴 {t("অত্যন্ত জরুরি", "Urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">{t("বিবরণ", "Description")}</Label>
            <Textarea id="description" name="description" placeholder={t("সমস্যাটি বিস্তারিত লিখুন...", "Describe the problem in detail...")} className="resize-none" rows={3} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {t("রিপোর্ট জমা দিন", "Submit Report")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
