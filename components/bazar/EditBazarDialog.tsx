"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Trash2, Edit2, ShoppingBasket, UserCheck } from "lucide-react";
import { updateBazarAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface BazarFormItem {
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

interface EditBazarDialogProps {
  bazar: any;
  products: any[];
  members: any[];
  isAdmin?: boolean;
}

export function EditBazarDialog({
  bazar,
  products,
  members,
  isAdmin = false,
}: EditBazarDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = usePreferences();

  const initialItems: BazarFormItem[] = bazar.items && bazar.items.length > 0
    ? bazar.items.map((i: any) => ({
        productName: i.productName || "",
        quantity: i.quantity ? String(i.quantity) : "",
        unit: i.unit || "kg",
        unitPrice: String(i.unitPrice ?? ""),
      }))
    : [{ productName: "", quantity: "", unitPrice: "", unit: "kg" }];

  const [items, setItems] = useState<BazarFormItem[]>(initialItems);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(bazar.buyerId || "");

  const initialDateStr = bazar.date
    ? new Date(bazar.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const addItem = () => setItems([...items, { productName: "", quantity: "", unitPrice: "", unit: "kg" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx: number) => idx !== i));

  const total = items.reduce((sum: number, item: BazarFormItem) => {
    const q = parseFloat(item.quantity) || 1;
    const p = parseFloat(item.unitPrice) || 0;
    return sum + (item.unitPrice ? q * p : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const dateStr = (fd.get("date") as string) || initialDateStr;

    const validItems = items
      .map((item: BazarFormItem) => ({
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        unit: item.unit || "kg",
      }))
      .filter((i: { productName: string; unitPrice: number }) => i.productName && i.unitPrice >= 0);

    if (validItems.length === 0) {
      setError(t("কমপক্ষে একটি পণ্যের নাম ও মূল্য দিন", "Please enter at least one product with name and price"));
      setLoading(false);
      return;
    }

    try {
      const result = await updateBazarAction({
        id: bazar.id,
        date: new Date(dateStr),
        buyerId: isAdmin ? selectedBuyerId : undefined,
        note: (fd.get("note") as string) || undefined,
        items: validItems,
      });

      if (result && result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result?.error || t("বাজার আপডেট করা সম্ভব হয়নি", "Could not update bazar record"));
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? t("বাজার এডিট করতে ব্যর্থ হয়েছে", "Failed to edit bazar"));
    } finally {
      setLoading(false);
    }
  }

  const currentBuyer = members.find((m) => m.id === bazar.buyerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
          title={t("বাজার এডিট করুন", "Edit bazar")}
        >
          <Edit2 size={13} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-black flex items-center gap-2">
            <ShoppingBasket size={18} className="text-amber-600" />
            <span>{t("বাজার পরিবর্তন", "Edit Bazar")}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs font-bold">{t("তারিখ *", "Date *")}</Label>
              <Input id="date" name="date" type="date" defaultValue={initialDateStr} className="h-9 text-xs" required />
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
                  <span>{currentBuyer?.user?.name ?? currentBuyer?.name ?? bazar.buyerMember?.user?.name ?? t("আপনি", "You")}</span>
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
              {items.map((item: BazarFormItem, i: number) => (
                <div key={i} className="grid grid-cols-[1.5fr_70px_70px_70px_28px] gap-1.5 items-center bg-gray-50/70 dark:bg-slate-800/40 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div>
                    <Input
                      placeholder={t("পণ্যের নাম", "Product")}
                      value={item.productName}
                      onChange={(e) => setItems(items.map((it: BazarFormItem, idx: number) => idx === i ? { ...it, productName: e.target.value } : it))}
                      list="edit-product-list"
                      className="h-8 text-xs bg-white dark:bg-slate-900"
                      required
                    />
                    <datalist id="edit-product-list">
                      {products.map((p: any) => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <Input
                    placeholder={t("পরিমাণ", "Qty")}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => setItems(items.map((it: BazarFormItem, idx: number) => idx === i ? { ...it, quantity: e.target.value } : it))}
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                  />
                  <Select
                    value={item.unit}
                    onValueChange={(val) => setItems(items.map((it: BazarFormItem, idx: number) => idx === i ? { ...it, unit: val ?? "kg" } : it))}
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
                    onChange={(e) => setItems(items.map((it: BazarFormItem, idx: number) => idx === i ? { ...it, unitPrice: e.target.value } : it))}
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
            <Input id="note" name="note" defaultValue={bazar.note || ""} placeholder={t("কোনো বিশেষ নোট বা বাজারের বিবরণ...", "Any note...")} className="h-9 text-xs" />
          </div>

          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 text-xs" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold" disabled={loading}>
              {loading ? <><Loader2 size={13} className="animate-spin mr-1" />{t("আপডেট হচ্ছে...", "Updating...")}</> : t("আপডেট করুন", "Save Changes")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
