import { z } from 'zod';

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  instructor: z.string(),
  date: z.coerce.date(),
  time: z.string(),
  capacity: z.number().int(),
  created_at: z.coerce.date(),
});

export type Class = z.infer<typeof classSchema>;

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
});

export type Member = z.infer<typeof memberSchema>;

// Reservation schema
export const reservationSchema = z.object({
  id: z.number(),
  memberId: z.number(),
  classId: z.number(),
  reservedAt: z.coerce.date(),
});

export type Reservation = z.infer<typeof reservationSchema>;

// Input schemas for creating entities
export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  instructor: z.string(),
  date: z.coerce.date(),
  time: z.string(),
  capacity: z.number().int().positive(),
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const createMemberInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const createReservationInputSchema = z.object({
  memberId: z.number(),
  classId: z.number(),
});

export type CreateReservationInput = z.infer<typeof createReservationInputSchema>;

// Input schemas for updating entities
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  instructor: z.string().optional(),
  date: z.coerce.date().optional(),
  time: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

export const updateMemberInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberInputSchema>;
