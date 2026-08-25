import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { calculateBalance } from "../balance.service";
import { generateNextCleaningDate } from "../cleaning.service";
import { canModify, canModifyMember, isAdmin } from "../../permissions/permission.service";

describe("Balance & Ledger Calculations", () => {
  it("calculateBalance returns positive for credits and negative for dues", () => {
    // Paid 5000, Total cost 4200 => +800 credit
    expect(calculateBalance(5000, 4200)).toBe(800);

    // Paid 3000, Total cost 4500 => -1500 due
    expect(calculateBalance(3000, 4500)).toBe(-1500);

    // Paid 4000, Total cost 4000 => 0 settled
    expect(calculateBalance(4000, 4000)).toBe(0);
  });

  it("handles decimal precision in money calculation correctly", () => {
    expect(calculateBalance(5000.75, 4123.33)).toBe(877.42);
  });
});

describe("Cleaning Task Recurrence Logic", () => {
  it("generates correct next dates for DAILY, EVERY_2_DAYS, EVERY_3_DAYS, and WEEKLY", () => {
    const baseDate = new Date("2026-08-01T10:00:00Z");

    const daily = generateNextCleaningDate(baseDate, "DAILY");
    expect(daily.getDate()).toBe(2);

    const every2 = generateNextCleaningDate(baseDate, "EVERY_2_DAYS");
    expect(every2.getDate()).toBe(3);

    const every3 = generateNextCleaningDate(baseDate, "EVERY_3_DAYS");
    expect(every3.getDate()).toBe(4);

    const weekly = generateNextCleaningDate(baseDate, "WEEKLY");
    expect(weekly.getDate()).toBe(8);

    const custom = generateNextCleaningDate(baseDate, "CUSTOM", 5);
    expect(custom.getDate()).toBe(6);
  });
});

describe("Authorization & RBAC Safeguards", () => {
  const adminSession = {
    user: { id: "u-admin", role: "ADMIN", memberId: "m-admin" },
  };

  const member1Session = {
    user: { id: "u-1", role: "MEMBER", memberId: "m-1" },
  };

  const member2Session = {
    user: { id: "u-2", role: "MEMBER", memberId: "m-2" },
  };

  it("isAdmin correctly checks admin role", () => {
    expect(isAdmin(adminSession)).toBe(true);
    expect(isAdmin(member1Session)).toBe(false);
  });

  it("canModify allows admin to modify any resource, and members only their own", () => {
    // Admin can modify anything
    expect(canModify(adminSession, "u-1")).toBe(true);
    expect(canModify(adminSession, "u-2")).toBe(true);

    // Member 1 can modify own resource
    expect(canModify(member1Session, "u-1")).toBe(true);

    // Member 1 CANNOT modify Member 2's resource (IDOR protection)
    expect(canModify(member1Session, "u-2")).toBe(false);
  });

  it("canModifyMember allows member to modify only their own memberId unless admin", () => {
    // Admin can modify any member
    expect(canModifyMember(adminSession, "m-1")).toBe(true);
    expect(canModifyMember(adminSession, "m-2")).toBe(true);

    // Member 1 can modify member 1
    expect(canModifyMember(member1Session, "m-1")).toBe(true);

    // Member 1 CANNOT modify member 2 (IDOR protection)
    expect(canModifyMember(member1Session, "m-2")).toBe(false);
  });
});
