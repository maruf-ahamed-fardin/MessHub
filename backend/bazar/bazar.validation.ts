import { z } from "zod";

export const bazarItemSchema = z.object({
  productId: z.string().cuid().optional(),
  productName: z.string().min(1, "Product name is required").max(100),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required").max(20),
  unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
  note: z.string().max(200).optional(),
});

export const createBazarSchema = z.object({
  date: z.coerce.date(),
  buyerId: z.string().cuid(),
  note: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  items: z.array(bazarItemSchema).min(1, "At least one item is required"),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
});

export type CreateBazarInput = z.infer<typeof createBazarSchema>;
export type BazarItemInput = z.infer<typeof bazarItemSchema>;
