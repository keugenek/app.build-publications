import { z } from 'zod';

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Instructor schema
export const instructorSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type Instructor = z.infer<typeof instructorSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  date: z.coerce.date(),
  duration_minutes: z.number().int().positive(),
  instructor_id: z.number(),
  capacity: z.number().int().positive(),
  created_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Reservation schema
export const reservationSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  member_id: z.number(),
  reserved_at: z.coerce.date(),
  cancelled_at: z.coerce.date().nullable()
});

export type Reservation = z.infer<typeof reservationSchema>;

// Input schemas for creating entities
export const createMemberInputSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const createInstructorInputSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export type CreateInstructorInput = z.infer<typeof createInstructorInputSchema>;

export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  date: z.coerce.date(),
  duration_minutes: z.number().int().positive(),
  instructor_id: z.number(),
  capacity: z.number().int().positive()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const createReservationInputSchema = z.object({
  class_id: z.number(),
  member_id: z.number()
});

export type CreateReservationInput = z.infer<typeof createReservationInputSchema>;

export const cancelReservationInputSchema = z.object({
  reservation_id: z.number()
});

export type CancelReservationInput = z.infer<typeof cancelReservationInputSchema>;

// Input schemas for updating entities
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  duration_minutes: z.number().int().positive().optional(),
  instructor_id: z.number().optional(),
  capacity: z.number().int().positive().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;
