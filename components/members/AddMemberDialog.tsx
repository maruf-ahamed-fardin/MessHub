"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createMemberAction } from "@/app/actions/app.actions";
import { useRouter } from "next/navigation";

export function AddMemberDialog({ rooms }: { rooms: any[] }) {
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
      await createMemberAction({
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        phone: fd.get("phone") as string || undefined,
        seatRent: Number(fd.get("seatRent")),
        roomId: (fd.get("roomId") as string) || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to create member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <Plus size={14} /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" placeholder="Fardin Ahmed" required />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="fardin@example.com" required />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" name="password" type="password" placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="seatRent">Seat Rent (৳)</Label>
              <Input id="seatRent" name="seatRent" type="number" placeholder="3500" defaultValue="3500" min="0" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Room (optional)</Label>
              <Select name="roomId">
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin mr-1" />Creating...</> : "Create Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
