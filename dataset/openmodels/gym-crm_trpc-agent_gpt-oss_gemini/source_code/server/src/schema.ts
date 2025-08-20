import { z } from 'zod';

// Enum for booking status
export const bookingStatusEnum = ['booked', 'attended', 'canceled'] as const;
export const bookingStatusSchema = z.enum(bookingStatusEnum);

// Class (Gym class) schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // nullable field
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  capacity: z.number().int(),
  created_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Input schema for creating a class
export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  capacity: z.number().int().positive()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

// Input schema for updating a class
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  start_time: z.coerce.date().optional(),
  end_time: z.coerce.date().optional(),
  capacity: z.number().int().positive().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Member (Gym member) schema
export const memberSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Input schema for creating a member
export const createMemberInputSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable()
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

// Booking (class attendance) schema
export const bookingSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  member_id: z.number(),
  status: bookingStatusSchema,
  created_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

// Input schema for creating a booking (member books a class)
export const createBookingInputSchema = z.object({
  class_id: z.number(),
  member_id: z.number()
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
