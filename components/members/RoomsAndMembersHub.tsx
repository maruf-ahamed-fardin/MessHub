"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Users, BedDouble, DoorOpen, CheckCircle2,
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
    <div className="space-y-4">
      {/* 1. Cool Minimalist KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">মোট মেম্বার</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{totalMembers} জন</p>
          <p className="text-[10px] text-gray-400">মেসে সক্রিয়</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">রুম সংখ্যা</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <DoorOpen size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{totalRooms} টি</p>
          <p className="text-[10px] text-gray-400">২, ২, ৩ সিটের রুম</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">মোট সিট</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <BedDouble size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{totalSeats} টি</p>
          <p className="text-[10px] text-gray-400">{occupiedSeats} টি পূর্ণ</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">খালি সিট</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-700 mt-1">{freeSeats} টি</p>
          <p className="text-[10px] text-gray-400">{freeSeats === 0 ? "সব সিট বুকড" : "খালি আছে"}</p>
        </div>
      </div>

      {/* 2. Navigation Bar & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 border border-gray-200/60 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
              activeTab === "rooms"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <BedDouble size={13} />
            <span>৩টি রুম ও সিট বিন্যাস (২, ২, ৩)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
              activeTab === "members"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Users size={13} />
            <span>৭ জন মেম্বারের তালিকা</span>
          </button>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <AddRoomDialog />
            <AddMemberDialog rooms={rooms} />
          </div>
        )}
      </div>

      {/* 3. Tab 1: Rooms & Seats Grid */}
      {activeTab === "rooms" && (
        <div className="space-y-3 pt-1">
          <RoomGrid rooms={rooms} isAdmin={isAdmin} />
        </div>
      )}

      {/* 4. Tab 2: Members Directory List */}
      {activeTab === "members" && (
        <div className="space-y-3 pt-1">
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
