"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Calendar, User, Check, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createBazarAction } from "@/app/actions/finance.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";
import { GeminiAiIcon } from "./GeminiAiIcon";

interface BazarItem {
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface AIBazarActionCardProps {
  data: {
    date: string;
    buyerId: string;
    buyerName: string;
    totalAmount: number;
    items: BazarItem[];
    members?: Array<{ id: string; name: string }>;
  };
  onComplete?: () => void;
}

export function AIBazarActionCard({ data, onComplete }: AIBazarActionCardProps) {
  const { t } = usePreferences();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(data.date);
  const [buyerId, setBuyerId] = useState(data.buyerId);
  const [items, setItems] = useState<BazarItem[]>(data.items);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalCalculated = items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);

  const handleUpdateItem = (index: number, field: keyof BazarItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productName: "অন্যান্য বাজার", quantity: 1, unit: "kg", unitPrice: 100 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSave = async () => {
    if (items.length === 0 || totalCalculated <= 0) {
      setErrorMsg("দয়া করে সঠিক বাজারের পরিমাণ ও মূল্য দিন।");
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      try {
        const payload = {
          date: new Date(date),
          buyerId,
          note: `Auto-recorded via MessMate AI`,
          items: items.map((it) => ({
            productName: it.productName.trim() || "বাজার",
            quantity: Number(it.quantity) || 1,
            unit: it.unit || "kg",
            unitPrice: Number(it.unitPrice) || 0,
          })),
        };

        const res = await createBazarAction(payload);
        if (res && res.error) {
          setErrorMsg(res.error);
        } else {
          setIsSaved(true);
          router.refresh();
          if (onComplete) onComplete();
        }
      } catch (err: any) {
        console.error("Failed to save bazar from AI card:", err);
        setErrorMsg(err.message || "Failed to save bazar record");
      }
    });
  };

  return (
    <div className="my-2 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-b from-indigo-50/70 to-white dark:from-indigo-950/40 dark:to-slate-900 overflow-hidden shadow-md text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <ShoppingBag size={14} />
          <span>{t("বাজার এন্ট্রি কনফার্মেশন", "Bazar Entry Confirmation")}</span>
        </div>
        <div className="flex items-center gap-1">
          <GeminiAiIcon size={14} className="text-amber-300 animate-pulse" />
          <span className="font-extrabold text-sm">৳{totalCalculated}</span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Date and Buyer controls */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={11} /> {t("তারিখ", "Date")}
            </label>
            <Input
              type="date"
              value={date}
              disabled={isSaved || isPending}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 text-xs bg-white dark:bg-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <User size={11} /> {t("ক্রেতা (Buyer)", "Buyer")}
            </label>
            {data.members && data.members.length > 0 ? (
              <select
                value={buyerId}
                disabled={isSaved || isPending}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full h-7 rounded-md border border-input bg-white dark:bg-slate-800 px-2 py-0 text-xs shadow-xs focus:outline-none"
              >
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={data.buyerName}
                disabled
                className="h-7 text-xs bg-white dark:bg-slate-800"
              />
            )}
          </div>
        </div>

        {/* Itemized List */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-slate-400 px-1">
            <span>{t("আইটেম বিবরণ", "Items & Quantity")}</span>
            <span>{t("মূল্য (টাকা)", "Price (৳)")}</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-2xs">
                <Input
                  value={item.productName}
                  disabled={isSaved || isPending}
                  onChange={(e) => handleUpdateItem(idx, "productName", e.target.value)}
                  placeholder="আইটেমের নাম"
                  className="h-6.5 text-xs flex-1"
                />
                <Input
                  type="number"
                  value={item.unitPrice}
                  disabled={isSaved || isPending}
                  onChange={(e) => handleUpdateItem(idx, "unitPrice", e.target.value)}
                  className="h-6.5 text-xs w-16 text-right font-bold"
                />
                {items.length > 1 && !isSaved && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-gray-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isSaved && (
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
            >
              <Plus size={12} /> {t("+ আরও আইটেম যোগ করুন", "+ Add more item")}
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 text-[11px]">
            {errorMsg}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-1">
          {isSaved ? (
            <div className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm">
              <Check size={14} strokeWidth={3} />
              <span>{t("সফলভাবে বাজার সেভ হয়েছে ✓", "Bazar Saved Successfully ✓")}</span>
            </div>
          ) : (
            <Button
              type="button"
              disabled={isPending}
              onClick={handleConfirmSave}
              className="w-full h-8 text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1" />
                  <span>{t("সেভ হচ্ছে…", "Saving…")}</span>
                </>
              ) : (
                <>
                  <Check size={13} strokeWidth={3} className="mr-1" />
                  <span>{t(`🛒 নিশ্চিত করুন ও বাজার সেভ করুন (৳${totalCalculated})`, `Confirm & Save Bazar (৳${totalCalculated})`)}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
