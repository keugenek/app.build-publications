// Zod schemas for the gym CRM
import { z } from 'zod';

// ---------- Class Schemas ----------
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  trainer: z.string(),
  capacity: z.number().int().nonnegative(),
  date: z.coerce.date(), // DATE only, stored as date in DB
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:mm 24h format
});
export type Class = z.infer<typeof classSchema>;

// Input schema for creating a class (no id)
export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  trainer: z.string(),
  capacity: z.number().int().positive(),
  date: z.coerce.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});
export type CreateClassInput = z.infer<typeof createClassInputSchema>;

// Input schema for deleting a class
export const deleteClassInputSchema = z.object({
  id: z.number(),
});
export type DeleteClassInput = z.infer<typeof deleteClassInputSchema>;

// Input schema for fetching by class id (e.g., reservations)
export const classIdInputSchema = z.object({
  class_id: z.number(),
});
export type ClassIdInput = z.infer<typeof classIdInputSchema>;

// Input schema for updating a class (id required, others optional)
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  trainer: z.string().optional(),
  capacity: z.number().int().nonnegative().optional(),
  date: z.coerce.date().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});
export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// ---------- Member Schemas ----------
export const memberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
});
export type Member = z.infer<typeof memberSchema>;

export const createMemberInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
});
export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const updateMemberInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberInputSchema>;

// ---------- Reservation Schemas ----------
export const reservationSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  member_id: z.number(),
  attended: z.boolean().nullable(), // Nullable – not set until attendance is marked
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

export const markAttendanceInputSchema = z.object({
  id: z.number(), // reservation id
  attended: z.boolean(),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceInputSchema>;
