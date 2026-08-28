"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { UserX, BedDouble } from "lucide-react";
import Link from "next/link";

interface MemberListProps {
  members: any[];
  isAdmin: boolean;
  availableSeats: any[];
}

export function MemberList({ members, isAdmin }: MemberListProps) {
  const active = members.filter((m) => m.isActive);
  const inactive = members.filter((m) => !m.isActive);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl divide-y divide-gray-100 dark:divide-slate-800 shadow-2xs overflow-hidden">
        {members.length === 0 && (
          <p className="text-center py-10 text-sm text-gray-400 dark:text-slate-500">No members found.</p>
        )}
        {members.map((member) => {
          const initials = (member.user.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div
              key={member.id}
              className={cn("flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors", !member.isActive && "opacity-60")}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={member.user.image ?? member.avatar ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{member.user.name}</p>
                  {!member.isActive && <Badge variant="outline" className="text-xs px-1.5 py-0">Inactive</Badge>}
                  {member.user.role === "ADMIN" && <Badge className="text-xs px-1.5 py-0 bg-primary text-primary-foreground font-bold">Admin</Badge>}
                  {member.securityDeposit > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      জামানত: {formatCurrency(member.securityDeposit)}
                    </Badge>
                  )}
                  {member.advanceFund > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800">
                      অগ্রিম: {formatCurrency(member.advanceFund)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{member.user.email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                <BedDouble size={13} />
                {member.seat ? `${member.seat.room?.name} - ${member.seat.label}` : "No seat"}
              </div>
              <div className="hidden md:block text-sm font-bold text-gray-900 dark:text-slate-100">
                {formatCurrency(Number(member.seatRent))}/mo
              </div>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800" asChild>
                  <Link href={`/members/${member.id}`}>Manage</Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
