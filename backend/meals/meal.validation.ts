import { z } from "zod";

export const upsertMealSchema = z.object({
  memberId: z.string().cuid(),
  date: z.coerce.date(),
  breakfast: z.boolean().optional(),
  lunch: z.boolean().optional(),
  dinner: z.boolean().optional(),
  note: z.string().max(500).optional(),
});

export const createGuestMealSchema = z.object({
  memberId: z.string().cuid(),
  guestName: z.string().min(1, "Guest name is required").max(100),
  date: z.coerce.date(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  quantity: z.number().int().positive("Quantity must be at least 1").max(20),
  note: z.string().max(500).optional(),
});

export type UpsertMealInput = z.infer<typeof upsertMealSchema>;
export type CreateGuestMealInput = z.infer<typeof createGuestMealSchema>;
