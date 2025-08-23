// Zod schemas for the Gym CRM application
import { z } from 'zod';

// ---------- Class Schemas ----------
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // nullable description
  capacity: z.number().int(), // integer capacity
  instructor: z.string(),
  scheduled_at: z.coerce.date(), // stored as timestamp in DB
  created_at: z.coerce.date(),
});

export type Class = z.infer<typeof classSchema>;

export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  capacity: z.number().int().positive(),
  instructor: z.string(),
  scheduled_at: z.coerce.date(),
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  capacity: z.number().int().positive().optional(),
  instructor: z.string().optional(),
  scheduled_at: z.coerce.date().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// ---------- Member Schemas ----------
export const memberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
});

export type Member = z.infer<typeof memberSchema>;

export const createMemberInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const updateMemberInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberInputSchema>;

// ---------- Reservation Schemas ----------
export const reservationSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  member_id: z.number(),
  created_at: z.coerce.date(),
});

export type Reservation = z.infer<typeof reservationSchema>;

export const createReservationInputSchema = z.object({
  class_id: z.number(),
  member_id: z.number(),
});

export type CreateReservationInput = z.infer<typeof createReservationInputSchema>;

export const cancelReservationInputSchema = z.object({
  id: z.number(),
});

export type CancelReservationInput = z.infer<typeof cancelReservationInputSchema>;
