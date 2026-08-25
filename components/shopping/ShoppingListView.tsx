"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { addShoppingItemAction, purchaseShoppingItemAction, deleteShoppingItemAction } from "@/app/actions/app.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils/cn";

interface ShoppingListViewProps {
  items: any[];
  addedById: string;
  isAdmin: boolean;
}

export function ShoppingListView({ items, addedById, isAdmin }: ShoppingListViewProps) {
  const [newItem, setNewItem] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
          placeholder="Add to shopping list..."
          className="flex-1"
          disabled={pending}
        />
        <Button type="submit" size="sm" className="h-10 gap-1.5" disabled={!newItem.trim() || pending}>
          <Plus size={14} /> Add
        </Button>
      </form>

      {/* Pending items */}
      {pending_items.length > 0 && (
        <div>
          <p className="section-heading">To Buy ({pending_items.length})</p>
          <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
            {pending_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  id={`item-${item.id}`}
                  onCheckedChange={() => handlePurchase(item.id)}
                  disabled={pending}
                  className="shrink-0"
                />
                <label htmlFor={`item-${item.id}`} className="flex-1 text-sm cursor-pointer">
                  {item.name}
                  {item.quantity && <span className="text-[hsl(var(--muted-foreground))] ml-1">· {item.quantity} {item.unit}</span>}
                </label>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{item.addedBy?.user?.name}</span>
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} disabled={pending} className="text-[hsl(var(--muted-foreground))] hover:text-destructive">
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
          <p className="section-heading">Purchased ({purchased_items.length})</p>
          <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))] opacity-60">
            {purchased_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox checked disabled className="shrink-0" />
                <span className="flex-1 text-sm line-through text-[hsl(var(--muted-foreground))]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <EmptyState icon={ShoppingCart} title="Shopping list is empty" description="Add items using the field above." />
      )}
    </div>
  );
}
