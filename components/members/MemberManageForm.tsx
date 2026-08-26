"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateMemberDetailsAction } from "@/app/actions/app.actions";
import { Loader2 } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MemberManageFormProps {
  member: any;
  rooms: any[];
  availableSeats: any[];
}

export function MemberManageForm({ member, availableSeats }: MemberManageFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = usePreferences();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    try {
      await updateMemberDetailsAction(member.id, {
        seatRent: Number(fd.get("seatRent")),
        phone: (fd.get("phone") as string) || undefined,
        isActive: fd.get("isActive") === "true",
        seatId: (fd.get("seatId") as string) || undefined,
      });
      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // Include the current seat in the options
  const seatOptions = [...availableSeats];
  if (member.seat && !seatOptions.some((s) => s.id === member.seat.id)) {
    seatOptions.unshift(member.seat);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t("মেম্বার সেটিংস এডিট করুন", "Edit Member Settings")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="phone">{t("ফোন নম্বর", "Phone Number")}</Label>
          <Input id="phone" name="phone" defaultValue={member.phone ?? ""} placeholder="01XXXXXXXXX" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="seatRent">{t("সিট ভাড়া (৳)", "Seat Rent (৳)")}</Label>
          <Input id="seatRent" name="seatRent" type="number" min="0" defaultValue={member.seatRent ?? 3500} required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>{t("বরাদ্দকৃত সিট", "Assigned Seat")}</Label>
          <Select name="seatId" defaultValue={member.seat?.id ?? ""}>
            <SelectTrigger><SelectValue placeholder={t("সিট বেছে নিন", "Select seat")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("সিট ছাড়া", "No Seat")}</SelectItem>
              {seatOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.room?.name ?? "Room"} - {t("সিট", "Seat")} {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{t("স্ট্যাটাস", "Status")}</Label>
          <Select name="isActive" defaultValue={member.isActive ? "true" : "false"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t("সক্রিয়", "Active")}</SelectItem>
              <SelectItem value="false">{t("নিষ্ক্রিয়", "Inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {success && <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ {t("সফলভাবে সংরক্ষিত হয়েছে", "Changes saved successfully")}</p>}

      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        {t("মেম্বার তথ্য আপডেট করুন", "Update Member")}
      </Button>
    </form>
  );
}
