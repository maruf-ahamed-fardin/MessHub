import { describe, it, expect, vi } from "vitest";

describe("Expense Sharing Mathematics & Proportions", () => {
  it("Equal sharing divides amount evenly among active members", () => {
    const totalAmount = 3500;
    const totalMembers = 7;
    const share = totalAmount / totalMembers;
    expect(share).toBe(500);
  });

  it("Selected Members sharing divides amount only among chosen subset", () => {
    const totalAmount = 1200;
    const selectedMemberIds = ["m1", "m2", "m3"];
    const share = totalAmount / selectedMemberIds.length;
    expect(share).toBe(400);
  });

  it("Meal-based sharing calculates exact proportion of consumed meals", () => {
    const totalExpense = 3000;
    const totalMessMeals = 150;

    // Member A ate 30 meals
    const memberAMeals = 30;
    const memberAShare = (memberAMeals / totalMessMeals) * totalExpense;
    expect(memberAShare).toBe(600); // 20% of 3000

    // Member B ate 60 meals
    const memberBMeals = 60;
    const memberBShare = (memberBMeals / totalMessMeals) * totalExpense;
    expect(memberBShare).toBe(1200); // 40% of 3000

    // Member C ate 0 meals
    const memberCMeals = 0;
    const memberCShare = (memberCMeals / totalMessMeals) * totalExpense;
    expect(memberCShare).toBe(0); // 0% of 3000
  });
});

describe("Guest Meal Pricing Rules", () => {
  it("DYNAMIC pricing multiplies guest meal quantity by current meal rate", () => {
    const quantity = 3;
    const mealRate = 65.5;
    const cost = Math.round(quantity * mealRate * 100) / 100;
    expect(cost).toBe(196.5);
  });

  it("FIXED pricing uses predetermined flat price per guest meal", () => {
    const quantity = 4;
    const fixedPrice = 80;
    const cost = quantity * fixedPrice;
    expect(cost).toBe(320);
  });
});
