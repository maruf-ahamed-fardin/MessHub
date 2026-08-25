import { formatCurrency } from "@/lib/utils/currency";
import { Users, BedDouble, UtensilsCrossed, ShoppingBasket, Home, Receipt } from "lucide-react";

interface MessSummaryProps {
  totalMembers: number;
  occupiedSeats: number;
  availableSeats: number;
  todayTotalMeals: number;
  monthBazarExpense: number;
  monthHouseExpense?: number;
}

export function MessSummary({
  totalMembers,
  occupiedSeats,
  availableSeats,
  todayTotalMeals,
  monthBazarExpense,
  monthHouseExpense = 0,
}: MessSummaryProps) {
  const stats = [
    { label: "Members", value: totalMembers, icon: Users, color: "text-indigo-600" },
    { label: "Occupied Seats", value: occupiedSeats, icon: BedDouble, color: "text-amber-600" },
    { label: "Available Seats", value: availableSeats, icon: BedDouble, color: "text-emerald-600" },
    { label: "Today's Meals", value: todayTotalMeals, icon: UtensilsCrossed, color: "text-blue-600" },
    { label: "Month Bazar", value: formatCurrency(monthBazarExpense), icon: ShoppingBasket, color: "text-indigo-700", isString: true },
    { label: "House & Tasks", value: formatCurrency(monthHouseExpense), icon: Home, color: "text-emerald-700", isString: true },
  ];

  return (
    <div>
      <p className="section-heading">Mess Overview & Expenses</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card text-center p-3">
            <s.icon size={18} className={`mx-auto mb-1.5 ${s.color}`} />
            <p className="text-base font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] font-medium text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
