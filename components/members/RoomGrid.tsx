"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DoorOpen, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RoomGridProps {
  rooms: any[];
  isAdmin: boolean;
}

export function RoomGrid({ rooms }: RoomGridProps) {
  if (rooms.length === 0) {
    return <p className="text-center py-10 text-xs text-gray-400">কোনো রুম যুক্ত করা নেই।</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => {
        const totalSeats = room.seats?.length || 0;
        const occupiedSeats = room.seats?.filter((s: any) => s.isOccupied).length || 0;
        const isFull = occupiedSeats === totalSeats && totalSeats > 0;
        const totalRoomRent = totalSeats * 3500;

        return (
          <div
            key={room.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between gap-3.5"
          >
            {/* Room Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <DoorOpen size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">{room.name}</h3>
                  <p className="text-[11px] text-gray-400">
                    {totalSeats === 3 ? "৩ সিট (ট্রিপল বেড)" : "২ সিট (ডাবল বেড)"} • {room.floor ?? "1st Floor"}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full",
                  isFull ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                )}
              >
                {occupiedSeats}/{totalSeats} সিট পূর্ণ
              </span>
            </div>

            {/* Seat List with Prominent Seat Rent */}
            <div className="space-y-2">
              {room.seats?.map((seat: any) => {
                const member = seat.currentMember;
                const memberName = member?.user?.name ?? "Available";
                const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                const rent = member?.seatRent || 3500;

                return (
                  <div
                    key={seat.id}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border flex items-center justify-between gap-3 transition-colors",
                      seat.isOccupied ? "bg-gray-50/70 border-gray-100" : "bg-white border-dashed border-gray-300"
                    )}
                  >
                    {/* Left: Seat Label & Member Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[11px] font-extrabold text-gray-800 shrink-0 shadow-2xs">
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
                            <p className="text-xs font-bold text-gray-900 truncate leading-tight">{memberName}</p>
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> সিট বুকড
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">খালি সিট</span>
                      )}
                    </div>

                    {/* Right: CLEAR & PROMINENT SEAT RENT BADGE */}
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg block">
                        {formatCurrency(rent)} <span className="text-[10px] font-normal text-indigo-600">/মাস</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Room Footer Summary */}
            <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">রুমের মোট ভাড়া:</span>
              <span className="font-extrabold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md">
                {formatCurrency(totalRoomRent)} / মাস
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
