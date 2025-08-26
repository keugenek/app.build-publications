import { z } from 'zod';

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  membership_type: z.enum(['basic', 'premium', 'vip']),
  status: z.enum(['active', 'inactive', 'suspended']),
  joined_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Input schema for creating members
export const createMemberInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable(),
  membership_type: z.enum(['basic', 'premium', 'vip']),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

// Input schema for updating members
export const updateMemberInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  membership_type: z.enum(['basic', 'premium', 'vip']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

export type UpdateMemberInput = z.infer<typeof updateMemberInputSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  instructor_name: z.string(),
  duration_minutes: z.number().int(),
  max_capacity: z.number().int(),
  current_bookings: z.number().int(),
  class_date: z.coerce.date(),
  start_time: z.string(), // Time stored as string in HH:MM format
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Input schema for creating classes
export const createClassInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  instructor_name: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  max_capacity: z.number().int().positive(),
  class_date: z.coerce.date(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled')
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

// Input schema for updating classes
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  instructor_name: z.string().min(1).optional(),
  duration_minutes: z.number().int().positive().optional(),
  max_capacity: z.number().int().positive().optional(),
  class_date: z.coerce.date().optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format").optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  class_id: z.number(),
  status: z.enum(['booked', 'attended', 'no_show', 'cancelled']),
  booked_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

// Input schema for creating bookings
export const createBookingInputSchema = z.object({
  member_id: z.number(),
  class_id: z.number(),
  status: z.enum(['booked', 'attended', 'no_show', 'cancelled']).default('booked')
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Input schema for updating bookings
export const updateBookingInputSchema = z.object({
  id: z.number(),
  status: z.enum(['booked', 'attended', 'no_show', 'cancelled'])
});

export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;

// Schedule view schema (for calendar display)
export const scheduleViewSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  instructor_name: z.string(),
  duration_minutes: z.number().int(),
  max_capacity: z.number().int(),
  current_bookings: z.number().int(),
  available_spots: z.number().int(),
  class_date: z.coerce.date(),
  start_time: z.string(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
});

export type ScheduleView = z.infer<typeof scheduleViewSchema>;

// Input schema for getting schedule
export const getScheduleInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type GetScheduleInput = z.infer<typeof getScheduleInputSchema>;

// Member booking view schema (with class details)
export const memberBookingViewSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  class_name: z.string(),
  instructor_name: z.string(),
  class_date: z.coerce.date(),
  start_time: z.string(),
  duration_minutes: z.number().int(),
  status: z.enum(['booked', 'attended', 'no_show', 'cancelled']),
  booked_at: z.coerce.date()
});

export type MemberBookingView = z.infer<typeof memberBookingViewSchema>;

// Attendance tracking schema
export const attendanceSchema = z.object({
  booking_id: z.number(),
  member_id: z.number(),
  member_name: z.string(),
  class_id: z.number(),
  class_name: z.string(),
  class_date: z.coerce.date(),
  start_time: z.string(),
  status: z.enum(['booked', 'attended', 'no_show', 'cancelled'])
});

export type Attendance = z.infer<typeof attendanceSchema>;
