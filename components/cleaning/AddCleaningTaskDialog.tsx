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

const RECURRENCE_OPTIONS = [
  { value: "", label: "No recurrence" },
  { value: "DAILY", label: "Daily" },
  { value: "EVERY_2_DAYS", label: "Every 2 days" },
  { value: "EVERY_3_DAYS", label: "Every 3 days" },
  { value: "WEEKLY", label: "Weekly" },
];

export function AddCleaningTaskDialog({ members }: { members: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        <Button size="sm" className="gap-1.5 h-8 text-xs"><Plus size={14} /> Add Task</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Cleaning Task</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="title">Task Title *</Label>
            <Input id="title" name="title" placeholder="Bathroom cleaning, mop floor..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" name="location" placeholder="Bathroom 1, Kitchen..." required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Assigned To *</Label>
              <Select name="assignedMemberId">
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.user.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Recurrence</Label>
              <Select name="recurrence" defaultValue="">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
