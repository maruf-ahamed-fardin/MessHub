import { Badge } from "@/components/ui/badge";
import { BedDouble, User } from "lucide-react";

interface RoomGridProps {
  rooms: any[];
  isAdmin: boolean;
}

export function RoomGrid({ rooms, isAdmin }: RoomGridProps) {
  if (rooms.length === 0) {
    return <p className="text-center py-10 text-sm text-[hsl(var(--muted-foreground))]">No rooms configured. Add a room to get started.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <div key={room.id} className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BedDouble size={16} className="text-[hsl(var(--primary))]" />
              <h3 className="font-semibold text-sm">{room.name}</h3>
            </div>
            {room.floor && <Badge variant="outline" className="text-xs">{room.floor}</Badge>}
          </div>
          <div className="space-y-2">
            {room.seats.map((seat: any) => (
              <div key={seat.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-[hsl(var(--muted))]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold w-5 text-center text-[hsl(var(--muted-foreground))]">{seat.label}</span>
                  {seat.currentMember ? (
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-[hsl(var(--primary))]" />
                      <span className="text-xs font-medium">{seat.currentMember.user?.name ?? "Member"}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Available</span>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${seat.isOccupied ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--success))]"}`} />
              </div>
            ))}
            {room.seats.length === 0 && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] py-2 text-center">No seats added</p>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-[hsl(var(--border))] flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span>{room.seats.filter((s: any) => s.isOccupied).length}/{room.seats.length} occupied</span>
            <span>{room.seats.filter((s: any) => !s.isOccupied).length} available</span>
          </div>
        </div>
      ))}
    </div>
  );
}
