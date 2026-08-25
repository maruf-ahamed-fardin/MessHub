import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  seatRent: z.coerce.number().min(0).optional(),
  roomId: z.string().optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional().nullable(),
  seatRent: z.coerce.number().min(0).optional(),
  roomId: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export const assignSeatSchema = z.object({
  memberId: z.string().cuid(),
  seatId: z.string().cuid(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AssignSeatInput = z.infer<typeof assignSeatSchema>;
