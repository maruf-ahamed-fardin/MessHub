"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BedDouble, Plus, DoorOpen, Phone,
  Mail, Shield, UserCheck, CheckCircle2,
} from "lucide-react";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { AddRoomDialog } from "@/components/members/AddRoomDialog";
import { RoomGrid } from "@/components/members/RoomGrid";
import { MemberList } from "@/components/members/MemberList";

interface RoomsAndMembersHubProps {
  members: any[];
  rooms: any[];
  availableSeats: any[];
  isAdmin: boolean;
}

export function RoomsAndMembersHub({
  members,
  rooms,
  availableSeats,
  isAdmin,
}: RoomsAndMembersHubProps) {
  const [activeTab, setActiveTab] = useState<"rooms" | "members">("rooms");

  const totalMembers = members.filter((m) => m.isActive).length;
  const totalRooms = rooms.length;
  let totalSeats = 0;
  let occupiedSeats = 0;

  for (const r of rooms) {
    if (r.seats) {
      totalSeats += r.seats.length;
      occupiedSeats += r.seats.filter((s: any) => s.isOccupied).length;
    }
  }
  const freeSeats = Math.max(0, totalSeats - occupiedSeats);

  return (
    <div className="space-y-5">
      {/* 1. Minimal KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">মোট মেম্বার</p>
            <p className="text-lg font-bold text-gray-900">{totalMembers} জন</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <DoorOpen size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">রুম সংখ্যা</p>
            <p className="text-lg font-bold text-gray-900">{totalRooms} টি</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <BedDouble size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">মোট সিট</p>
            <p className="text-lg font-bold text-gray-900">{totalSeats} টি</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">খালি সিট</p>
            <p className="text-lg font-bold text-emerald-700">{freeSeats} টি</p>
          </div>
        </div>
      </div>

      {/* 2. Unified Navigation Bar & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "rooms" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <BedDouble size={13} />
            <span>রুম ও সিট বিন্যাস ({rooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "members" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Users size={13} />
            <span>মেম্বারদের তালিকা ({totalMembers})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <AddRoomDialog />
              <AddMemberDialog rooms={rooms} />
            </>
          )}
        </div>
      </div>

      {/* 3. Tab 1: Rooms & Seats Grid */}
      {activeTab === "rooms" && (
        <div className="space-y-3">
          <RoomGrid rooms={rooms} isAdmin={isAdmin} />
        </div>
      )}

      {/* 4. Tab 2: Members Directory List */}
      {activeTab === "members" && (
        <div className="space-y-3">
          <MemberList
            members={members}
            isAdmin={isAdmin}
            availableSeats={availableSeats}
          />
        </div>
      )}
    </div>
  );
}
