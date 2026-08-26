"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { addShoppingItemAction, purchaseShoppingItemAction, deleteShoppingItemAction } from "@/app/actions/app.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface ShoppingListViewProps {
  items: any[];
  addedById: string;
  isAdmin: boolean;
}

export function ShoppingListView({ items, isAdmin }: ShoppingListViewProps) {
  const [newItem, setNewItem] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = usePreferences();

  const pending_items = items.filter((i) => i.status === "PENDING");
  const purchased_items = items.filter((i) => i.status === "PURCHASED");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const name = newItem.trim();
    setNewItem("");
    startTransition(async () => {
      await addShoppingItemAction({ name });
      router.refresh();
    });
  };

  const handlePurchase = (id: string) => {
    startTransition(async () => {
      await purchaseShoppingItemAction(id);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteShoppingItemAction(id);
      router.refresh();
    });
  };

  return (
    <div className="max-w-lg space-y-4">
      {/* Add new item */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={t("শপিং লিস্টে আইটেম লিখুন...", "Add to shopping list...")}
          className="flex-1"
          disabled={pending}
        />
        <Button type="submit" size="sm" className="h-10 gap-1.5" disabled={!newItem.trim() || pending}>
          <Plus size={14} /> {t("যোগ করুন", "Add")}
        </Button>
      </form>

      {/* Pending items */}
      {pending_items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t(`কিনতে হবে (${pending_items.length})`, `To Buy (${pending_items.length})`)}
          </p>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl divide-y divide-gray-100 dark:divide-slate-800">
            {pending_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  id={`item-${item.id}`}
                  onCheckedChange={() => handlePurchase(item.id)}
                  disabled={pending}
                  className="shrink-0"
                />
                <label htmlFor={`item-${item.id}`} className="flex-1 text-sm text-gray-900 dark:text-slate-100 cursor-pointer">
                  {item.name}
                  {item.quantity && <span className="text-gray-400 dark:text-slate-500 ml-1">· {item.quantity} {item.unit}</span>}
                </label>
                <span className="text-xs text-gray-400 dark:text-slate-500">{item.addedBy?.user?.name}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={pending}
                    className="text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchased items */}
      {purchased_items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {t(`কেনা সম্পন্ন (${purchased_items.length})`, `Purchased (${purchased_items.length})`)}
          </p>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl divide-y divide-gray-100 dark:divide-slate-800 opacity-60">
            {purchased_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox checked disabled className="shrink-0" />
                <span className="flex-1 text-sm line-through text-gray-400 dark:text-slate-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title={t("শপিং লিস্ট খালি", "Shopping list is empty")}
          description={t("উপরের ঘরে নতুন মালামালের নাম লিখে যোগ করুন।", "Add items using the field above.")}
        />
      )}
    </div>
  );
}
