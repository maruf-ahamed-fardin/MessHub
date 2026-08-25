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
      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
        {members.length === 0 && (
          <p className="text-center py-10 text-sm text-[hsl(var(--muted-foreground))]">No members found.</p>
        )}
        {members.map((member) => {
          const initials = (member.user.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div
              key={member.id}
              className={cn("flex items-center gap-3 px-4 py-3", !member.isActive && "opacity-60")}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={member.user.image ?? member.avatar ?? undefined} />
                <AvatarFallback className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.user.name}</p>
                  {!member.isActive && <Badge variant="outline" className="text-xs px-1.5 py-0">Inactive</Badge>}
                  {member.user.role === "ADMIN" && <Badge className="text-xs px-1.5 py-0 bg-[hsl(var(--primary))]">Admin</Badge>}
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{member.user.email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                <BedDouble size={13} />
                {member.seat ? `${member.seat.room?.name} - ${member.seat.label}` : "No seat"}
              </div>
              <div className="hidden md:block text-sm font-medium">
                {formatCurrency(Number(member.seatRent))}/mo
              </div>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
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
