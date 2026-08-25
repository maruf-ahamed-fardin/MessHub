"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createGuestMealAction } from "@/app/actions/meal.actions";
import { useRouter } from "next/navigation";

export function AddGuestMealDialog({ members, currentMemberId, addedById }: { members: any[]; currentMemberId: string; addedById: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createGuestMealAction({
        memberId: fd.get("memberId") as string,
        guestName: fd.get("guestName") as string,
        date: fd.get("date") as string,
        mealType: fd.get("mealType") as "BREAKFAST" | "LUNCH" | "DINNER",
        quantity: Number(fd.get("quantity")),
        note: (fd.get("note") as string) || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to add guest meal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs"><Plus size={14} /> Add Guest Meal</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Guest Meal</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input id="guestName" name="guestName" placeholder="Guest's name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>For Member *</Label>
              <Select name="memberId" defaultValue={currentMemberId}>
                <SelectTrigger><SelectValue placeholder="Member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.user.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Meal Type *</Label>
              <Select name="mealType" defaultValue="LUNCH">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">☀️ Breakfast</SelectItem>
                  <SelectItem value="LUNCH">🍽️ Lunch</SelectItem>
                  <SelectItem value="DINNER">🌙 Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" min="1" max="20" defaultValue="1" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" placeholder="Any notes..." />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin mr-1" />Saving...</> : "Add Guest Meal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
