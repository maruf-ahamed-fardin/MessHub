import { z } from "zod";

// Common reusable Zod schemas
export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateSchema = z.coerce.date();

export const monthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const positiveDecimalSchema = z
  .string()
  .or(z.number())
  .transform((v) => Number(v))
  .refine((v) => v >= 0, "Amount must be non-negative")
  .refine((v) => !isNaN(v), "Must be a valid number");

export const positiveIntSchema = z
  .number()
  .int()
  .positive("Must be a positive integer");
