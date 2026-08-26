import { z } from "zod";

export const bazarItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required").max(100),
  quantity: z.coerce.number().min(0).optional().default(1),
  unit: z.string().optional().default("kg"),
  unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
  note: z.string().max(200).optional(),
});

export const createBazarSchema = z.object({
  date: z.coerce.date(),
  buyerId: z.string().min(1, "Buyer ID is required"),
  note: z.string().max(500).optional(),
  receiptUrl: z.string().optional(),
  items: z.array(bazarItemSchema).min(1, "At least one item is required"),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
});

export const updateBazarSchema = z.object({
  id: z.string().min(1),
  date: z.coerce.date().optional(),
  buyerId: z.string().min(1).optional(),
  note: z.string().max(500).optional(),
  receiptUrl: z.string().optional(),
  items: z.array(bazarItemSchema).min(1).optional(),
});

export type CreateBazarInput = z.infer<typeof createBazarSchema>;
export type UpdateBazarInput = z.infer<typeof updateBazarSchema>;
export type BazarItemInput = z.infer<typeof bazarItemSchema>;
