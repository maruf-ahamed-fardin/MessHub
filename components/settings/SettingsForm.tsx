"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsAction } from "@/app/actions/app.actions";
import { Loader2 } from "lucide-react";

export function SettingsForm({ settings }: { settings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    try {
      await updateSettingsAction({
        messName: fd.get("messName"),
        address: fd.get("address") || undefined,
        currency: fd.get("currency"),
        guestMealPricing: fd.get("guestMealPricing"),
        guestMealFixedPrice: fd.get("guestMealFixedPrice") ? Number(fd.get("guestMealFixedPrice")) : undefined,
        guestMealResponsibility: fd.get("guestMealResponsibility"),
        defaultSeatRent: Number(fd.get("defaultSeatRent")),
        messRules: fd.get("messRules") || undefined,
      });
      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-5 space-y-4">
        <p className="text-sm font-semibold">General</p>
        <div className="space-y-1">
          <Label htmlFor="messName">Mess Name</Label>
          <Input id="messName" name="messName" defaultValue={settings?.messName ?? "MessHub"} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" name="address" defaultValue={settings?.address ?? ""} placeholder="House no, Road, Area..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="defaultSeatRent">Default Seat Rent (৳)</Label>
            <Input id="defaultSeatRent" name="defaultSeatRent" type="number" min="0" defaultValue={settings?.defaultSeatRent ?? 3500} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="currency">Currency Symbol</Label>
            <Input id="currency" name="currency" defaultValue={settings?.currency ?? "৳"} maxLength={5} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-5 space-y-4">
        <p className="text-sm font-semibold">Guest Meals</p>
        <div className="space-y-1">
          <Label>Guest Meal Pricing</Label>
          <Select name="guestMealPricing" defaultValue={settings?.guestMealPricing ?? "DYNAMIC"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DYNAMIC">Dynamic (same as meal rate)</SelectItem>
              <SelectItem value="FIXED">Fixed price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="guestMealFixedPrice">Fixed Price (৳) — if above is Fixed</Label>
          <Input id="guestMealFixedPrice" name="guestMealFixedPrice" type="number" min="0" step="0.01"
            defaultValue={settings?.guestMealFixedPrice ?? ""} placeholder="Leave blank for dynamic" />
        </div>
        <div className="space-y-1">
          <Label>Guest Meal Cost Responsibility</Label>
          <Select name="guestMealResponsibility" defaultValue={settings?.guestMealResponsibility ?? "MEMBER"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Charged to Member</SelectItem>
              <SelectItem value="GUEST">Guest pays separately</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-5 space-y-4">
        <p className="text-sm font-semibold">Mess Rules</p>
        <Textarea name="messRules" defaultValue={settings?.messRules ?? ""} placeholder="House rules, guidelines..." rows={5} className="resize-none" />
      </div>

      {success && <p className="text-sm text-[hsl(var(--success))]">✓ Settings saved successfully</p>}

      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Save Settings
      </Button>
    </form>
  );
}
