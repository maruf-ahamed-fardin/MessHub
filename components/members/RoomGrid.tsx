"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface RoomGridProps {
  rooms: any[];
  isAdmin: boolean;
}

const defaultRoomRents: Record<string, number> = {
  "room-1": 4500,
  "room-2": 3500,
  "room-3": 2500,
};

export function RoomGrid({ rooms }: RoomGridProps) {
  const { t } = usePreferences();

  if (rooms.length === 0) {
    return <p className="text-center py-10 text-xs text-gray-400 dark:text-slate-500">{t("কোনো রুম যুক্ত করা নেই।", "No rooms configured.")}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => {
        const totalSeats = room.seats?.length || 0;
        const occupiedSeats = room.seats?.filter((s: any) => s.isOccupied).length || 0;
        const isFull = occupiedSeats === totalSeats && totalSeats > 0;
        const defaultSeatRent = defaultRoomRents[room.id] || (totalSeats === 3 ? 2500 : 3500);
        const totalRoomRent = room.seats?.reduce((sum: number, s: any) => sum + (s.currentMember?.seatRent || defaultSeatRent), 0) || (totalSeats * defaultSeatRent);

        return (
          <div
            key={room.id}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-gray-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3.5"
          >
            {/* Room Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                  <DoorOpen size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 leading-tight">{room.name}</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">
                    {totalSeats === 3 ? t("৩ সিটের রুম", "Triple Bed") : t("২ সিটের রুম", "Double Bed")} • {room.floor ?? "1st Floor"}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full",
                  isFull ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300" : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                )}
              >
                {t(`${occupiedSeats}/${totalSeats} সিট বুকড`, `${occupiedSeats}/${totalSeats} Occupied`)}
              </span>
            </div>

            {/* Seat List */}
            <div className="space-y-2">
              {room.seats?.map((seat: any) => {
                const member = seat.currentMember;
                const memberName = member?.user?.name ?? (seat.isOccupied ? "Member" : t("খালি সিট", "Vacant"));
                const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                const rent = member?.seatRent || defaultSeatRent;

                return (
                  <div
                    key={seat.id}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border flex items-center justify-between gap-3 transition-colors",
                      seat.isOccupied ? "bg-gray-50/70 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800" : "bg-white dark:bg-slate-900 border-dashed border-gray-300 dark:border-slate-700"
                    )}
                  >
                    {/* Left: Seat Label & Member Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-extrabold text-gray-800 dark:text-slate-200 shrink-0 shadow-2xs">
                        {seat.label}
                      </span>

                      {seat.isOccupied ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{memberName}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("সিট বরাদ্দ", "Occupied")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium italic">{t("খালি সিট", "Vacant")}</span>
                      )}
                    </div>

                    {/* Right: Seat Rent Badge */}
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 px-2.5 py-1 rounded-lg block">
                        {formatCurrency(rent)} <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">/{t("মাস", "mo")}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Room Footer Summary */}
            <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-slate-400 font-medium">{t("রুমের মোট ভাড়া:", "Total Room Rent:")}</span>
              <span className="font-extrabold text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                {t(`${formatCurrency(totalRoomRent)} / মাস`, `${formatCurrency(totalRoomRent)} / month`)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
