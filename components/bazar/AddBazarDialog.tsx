"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { createBazarAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function AddBazarDialog({ products, members, currentMemberId }: { products: any[]; members: any[]; currentMemberId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = usePreferences();

  const addItem = () => setItems([...items, { productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const total = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createBazarAction({
        date: fd.get("date"),
        buyerId: fd.get("buyerId"),
        note: fd.get("note") || undefined,
        items: items.map((item) => ({
          productName: item.productName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          unit: item.unit,
        })).filter(i => i.productName && i.quantity > 0 && i.unitPrice >= 0),
      });
      setOpen(false);
      setItems([{ productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? t("বাজার যোগ করতে ব্যর্থ হয়েছে", "Failed to add bazar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <Plus size={14} /> {t("বাজার যোগ করুন", "Add Bazar")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("বাজারের নতুন এন্ট্রি", "Add Bazar Entry")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date">{t("তারিখ *", "Date *")}</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="space-y-1">
              <Label>{t("বাজার করেছে *", "Buyer *")}</Label>
              <Select name="buyerId" defaultValue={currentMemberId}>
                <SelectTrigger><SelectValue placeholder={t("মেম্বার বেছে নিন", "Select buyer")} /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t("বাজারের আইটেমসমূহ *", "Items *")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                <Plus size={12} /> {t("আইটেম যোগ করুন", "Add Item")}
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_80px_28px] gap-1.5 items-start">
                  <div>
                    <Input
                      placeholder={t("পণ্যের নাম", "Product name")}
                      value={item.productName}
                      onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, productName: e.target.value } : it))}
                      list="product-list"
                      className="h-8 text-sm"
                    />
                    <datalist id="product-list">
                      {products.map((p: any) => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <Input
                    placeholder={t("পরিমাণ", "Qty")}
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, quantity: e.target.value } : it))}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder={t("৳ মূল্য", "৳ Price")}
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, unitPrice: e.target.value } : it))}
                    className="h-8 text-sm"
                  />
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="text-[hsl(var(--muted-foreground))] hover:text-destructive disabled:opacity-30 h-8 flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[hsl(var(--border))]">
            <span className="text-sm font-medium">{t("মোট", "Total")}</span>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="note">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</Label>
            <Input id="note" name="note" placeholder={t("কোনো বিশেষ নোট...", "Any notes...")} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin mr-1" />{t("সেভ হচ্ছে...", "Saving...")}</> : t("বাজার সংরক্ষণ করুন", "Add Bazar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
