"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Users, BedDouble, DoorOpen, CheckCircle2,
} from "lucide-react";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { RoomGrid } from "@/components/members/RoomGrid";
import { MemberList } from "@/components/members/MemberList";
import { usePreferences } from "@/lib/context/PreferencesContext";

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
  const { t } = usePreferences();

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
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{t("মোট মেম্বার", "Total Members")}</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-1">
            {t(`${totalMembers} জন`, `${totalMembers}`)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{t("মেসে সক্রিয়", "Active in Mess")}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{t("রুম সংখ্যা", "Total Rooms")}</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DoorOpen size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-1">
            {t(`${totalRooms} টি`, `${totalRooms}`)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{t("রুম ও বেড বিন্যাস", "Room Layout")}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{t("মোট সিট", "Total Seats")}</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BedDouble size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-1">
            {t(`${totalSeats} টি`, `${totalSeats}`)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {t(`${occupiedSeats} টি বুকড`, `${occupiedSeats} Occupied`)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{t("খালি সিট", "Available Seats")}</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {t(`${freeSeats} টি`, `${freeSeats}`)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {freeSeats === 0 ? t("সব সিট বুকড", "All Seats Booked") : t("খালি আছে", "Vacant")}
          </p>
        </div>
      </div>

      {/* 2. Navigation Bar & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
              activeTab === "rooms"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <BedDouble size={13} />
            <span>{t("রুম ও সিট বিন্যাস", "Rooms & Seat Layout")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
              activeTab === "members"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <Users size={13} />
            <span>{t(`মেম্বারদের তালিকা (${totalMembers})`, `Members List (${totalMembers})`)}</span>
          </button>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2">
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
