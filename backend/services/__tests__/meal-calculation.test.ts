import { describe, it, expect } from "vitest";
import { toNumber, roundMoney } from "../meal-calculation.service";
import { getMonthRange } from "@/lib/utils/date";

describe("Financial Precision & Formatting Helpers", () => {
  it("toNumber safely converts strings, numbers, decimals, null, and undefined", () => {
    expect(toNumber(123.45)).toBe(123.45);
    expect(toNumber("450.50")).toBe(450.5);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber({ toString: () => "78.9" })).toBe(78.9);
  });

  it("roundMoney rounds accurately to 2 decimal places (eliminating JS floating point error)", () => {
    expect(roundMoney(100 / 3)).toBe(33.33);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1250.555)).toBe(1250.56);
    expect(roundMoney(0)).toBe(0);
  });
});

describe("Month-End Date Boundaries", () => {
  it("getMonthRange creates exact start of day and end of day (23:59:59.999)", () => {
    const { startDate, endDate } = getMonthRange(8, 2026); // August 2026

    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(7); // 0-indexed August
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);

    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(7); // 0-indexed August
    expect(endDate.getDate()).toBe(31); // 31 days in August
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
    expect(endDate.getMilliseconds()).toBe(999);
  });

  it("getMonthRange correctly calculates February in leap and non-leap years", () => {
    const leapFeb = getMonthRange(2, 2024);
    expect(leapFeb.endDate.getDate()).toBe(29);

    const regularFeb = getMonthRange(2, 2025);
    expect(regularFeb.endDate.getDate()).toBe(28);

    const april30 = getMonthRange(4, 2026);
    expect(april30.endDate.getDate()).toBe(30);
  });
});
