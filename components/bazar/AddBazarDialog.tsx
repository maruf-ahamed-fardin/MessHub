"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, ShoppingBasket, UserCheck } from "lucide-react";
import { createBazarAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface AddBazarDialogProps {
  products: any[];
  members: any[];
  currentMemberId: string;
  defaultMonth?: number;
  defaultYear?: number;
  isAdmin?: boolean;
}

export function AddBazarDialog({
  products,
  members,
  currentMemberId,
  defaultMonth,
  defaultYear,
  isAdmin = false,
}: AddBazarDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = usePreferences();

  const currentMember = members.find((m) => m.id === currentMemberId) || members[0];
  const initialBuyerId = currentMember?.id || "";
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(initialBuyerId);

  useEffect(() => {
    if (!isAdmin && initialBuyerId) {
      setSelectedBuyerId(initialBuyerId);
    } else if (isAdmin && !selectedBuyerId && initialBuyerId) {
      setSelectedBuyerId(initialBuyerId);
    }
  }, [isAdmin, initialBuyerId, selectedBuyerId]);

  // Compute default date based on selected month/year
  const getInitialDateStr = () => {
    const today = new Date();
    if (defaultMonth && defaultYear) {
      if (today.getMonth() + 1 === defaultMonth && today.getFullYear() === defaultYear) {
        return today.toISOString().split("T")[0];
      }
      const d = new Date(defaultYear, defaultMonth - 1, 1);
      return d.toISOString().split("T")[0];
    }
    return today.toISOString().split("T")[0];
  };

  const addItem = () => setItems([...items, { productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const total = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 1;
    const p = parseFloat(item.unitPrice) || 0;
    return sum + (item.unitPrice ? q * p : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const dateStr = (fd.get("date") as string) || getInitialDateStr();
    const buyerId = isAdmin
      ? (selectedBuyerId || (fd.get("buyerId") as string) || initialBuyerId)
      : initialBuyerId;

    if (!buyerId) {
      setError(t("অনুগ্রহ করে ক্রেতার নাম বেছে নিন", "Please select a buyer"));
      setLoading(false);
      return;
    }

    const validItems = items
      .map((item) => ({
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        unit: item.unit || "kg",
      }))
      .filter((i) => i.productName && i.unitPrice >= 0);

    if (validItems.length === 0) {
      setError(t("কমপক্ষে একটি পণ্যের নাম ও মূল্য দিন", "Please enter at least one product with name and price"));
      setLoading(false);
      return;
    }

    try {
      const result = await createBazarAction({
        date: new Date(dateStr),
        buyerId,
        note: (fd.get("note") as string) || undefined,
        items: validItems,
      });

      if (result && result.success) {
        setOpen(false);
        setItems([{ productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
        router.refresh();
      } else {
        setError(t("বাজার সংরক্ষণ করা সম্ভব হয়নি", "Could not save bazar record"));
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? t("বাজার যোগ করতে ব্যর্থ হয়েছে", "Failed to add bazar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8.5 px-3 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer">
          <Plus size={14} /> {t("বাজার যোগ করুন", "Add Bazar")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-black flex items-center gap-2">
            <ShoppingBasket size={18} className="text-amber-600" />
            <span>{t("বাজারের নতুন এন্ট্রি", "Add Bazar Entry")}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs font-bold">{t("তারিখ *", "Date *")}</Label>
              <Input id="date" name="date" type="date" defaultValue={getInitialDateStr()} className="h-9 text-xs" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">{t("বাজার করেছে *", "Buyer *")}</Label>
              {isAdmin ? (
                <Select value={selectedBuyerId} onValueChange={(val) => { if (val) setSelectedBuyerId(val); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t("মেম্বার বেছে নিন", "Select buyer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.user?.name ?? m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 px-3 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-between text-xs font-bold text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 select-none">
                  <span>{currentMember?.user?.name ?? currentMember?.name ?? t("আপনি", "You")}</span>
                  <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">{t("বাজারের আইটেমসমূহ *", "Items *")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs font-bold gap-1 rounded-lg">
                <Plus size={12} /> {t("আইটেম যোগ করুন", "Add Item")}
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1.5fr_70px_70px_70px_28px] gap-1.5 items-center bg-gray-50/70 dark:bg-slate-800/40 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div>
                    <Input
                      placeholder={t("পণ্যের নাম", "Product")}
                      value={item.productName}
                      onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, productName: e.target.value } : it))}
                      list="product-list"
                      className="h-8 text-xs bg-white dark:bg-slate-900"
                      required
                    />
                    <datalist id="product-list">
                      {products.map((p: any) => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <Input
                    placeholder={t("পরিমাণ", "Qty")}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, quantity: e.target.value } : it))}
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                  <Select
                    value={item.unit}
                    onValueChange={(val) => setItems(items.map((it, idx) => idx === i ? { ...it, unit: val ?? "kg" } : it))}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 px-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="gm">gm</SelectItem>
                      <SelectItem value="liter">liter</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="dozen">dozen</SelectItem>
                      <SelectItem value="packet">packet</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t("৳ মূল্য", "৳ Price")}
                    type="number"
                    min="0"
                    step="0.5"
                    value={item.unitPrice}
                    onChange={(e) => setItems(items.map((it, idx) => idx === i ? { ...it, unitPrice: e.target.value } : it))}
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="text-gray-400 hover:text-rose-600 disabled:opacity-20 h-8 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{t("মোট বাজার খরচ", "Total Bazar Cost")}</span>
            <span className="text-sm font-black text-amber-700 dark:text-amber-300">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="note" className="text-xs font-bold">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</Label>
            <Input id="note" name="note" placeholder={t("কোনো বিশেষ নোট বা বাজারের বিবরণ...", "Any note...")} className="h-9 text-xs" />
          </div>

          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 text-xs" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold" disabled={loading}>
              {loading ? <><Loader2 size={13} className="animate-spin mr-1" />{t("সেভ হচ্ছে...", "Saving...")}</> : t("বাজার সংরক্ষণ করুন", "Add Bazar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
