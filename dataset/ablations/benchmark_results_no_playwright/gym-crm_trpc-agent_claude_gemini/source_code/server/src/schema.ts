import { z } from 'zod';

// Member schema
export const memberSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  membership_type: z.enum(['basic', 'premium', 'vip']),
  membership_start_date: z.coerce.date(),
  membership_end_date: z.coerce.date(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Member = z.infer<typeof memberSchema>;

// Input schema for creating members
export const createMemberInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  membership_type: z.enum(['basic', 'premium', 'vip']),
  membership_start_date: z.coerce.date(),
  membership_end_date: z.coerce.date()
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

// Input schema for updating members
export const updateMemberInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  membership_type: z.enum(['basic', 'premium', 'vip']).optional(),
  membership_start_date: z.coerce.date().optional(),
  membership_end_date: z.coerce.date().optional(),
  is_active: z.boolean().optional()
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
  class_type: z.enum(['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  is_active: z.boolean(),
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
  class_type: z.enum(['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced'])
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
  class_type: z.enum(['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_active: z.boolean().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Class schedule schema
export const classScheduleSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  scheduled_date: z.coerce.date(),
  start_time: z.string(), // Format: "HH:MM"
  end_time: z.string(), // Format: "HH:MM"
  current_bookings: z.number().int(),
  is_cancelled: z.boolean(),
  cancellation_reason: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ClassSchedule = z.infer<typeof classScheduleSchema>;

// Input schema for creating class schedules
export const createClassScheduleInputSchema = z.object({
  class_id: z.number(),
  scheduled_date: z.coerce.date(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM"),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM")
});

export type CreateClassScheduleInput = z.infer<typeof createClassScheduleInputSchema>;

// Input schema for updating class schedules
export const updateClassScheduleInputSchema = z.object({
  id: z.number(),
  class_id: z.number().optional(),
  scheduled_date: z.coerce.date().optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM").optional(),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM").optional(),
  is_cancelled: z.boolean().optional(),
  cancellation_reason: z.string().nullable().optional()
});

export type UpdateClassScheduleInput = z.infer<typeof updateClassScheduleInputSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  member_id: z.number(),
  class_schedule_id: z.number(),
  booking_status: z.enum(['booked', 'cancelled', 'attended', 'no_show']),
  booking_date: z.coerce.date(),
  cancellation_date: z.coerce.date().nullable(),
  attendance_marked_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

// Input schema for creating bookings
export const createBookingInputSchema = z.object({
  member_id: z.number(),
  class_schedule_id: z.number()
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Input schema for updating bookings
export const updateBookingInputSchema = z.object({
  id: z.number(),
  booking_status: z.enum(['booked', 'cancelled', 'attended', 'no_show']).optional(),
  cancellation_date: z.coerce.date().nullable().optional(),
  attendance_marked_at: z.coerce.date().nullable().optional()
});

export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;

// Calendar view schema for frontend
export const calendarDaySchema = z.object({
  date: z.string(), // ISO date string
  classes: z.array(z.object({
    schedule_id: z.number(),
    class_id: z.number(),
    class_name: z.string(),
    instructor_name: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    duration_minutes: z.number(),
    current_bookings: z.number(),
    max_capacity: z.number(),
    class_type: z.enum(['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']),
    difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
    is_cancelled: z.boolean(),
    cancellation_reason: z.string().nullable()
  }))
});

export type CalendarDay = z.infer<typeof calendarDaySchema>;

// Query schemas for filtering
export const getClassSchedulesInputSchema = z.object({
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  class_id: z.number().optional(),
  class_type: z.enum(['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']).optional()
});

export type GetClassSchedulesInput = z.infer<typeof getClassSchedulesInputSchema>;

export const getMembersInputSchema = z.object({
  is_active: z.boolean().optional(),
  membership_type: z.enum(['basic', 'premium', 'vip']).optional(),
  search: z.string().optional() // For searching by name or email
});

export type GetMembersInput = z.infer<typeof getMembersInputSchema>;

export const getBookingsInputSchema = z.object({
  member_id: z.number().optional(),
  class_schedule_id: z.number().optional(),
  booking_status: z.enum(['booked', 'cancelled', 'attended', 'no_show']).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional()
});

export type GetBookingsInput = z.infer<typeof getBookingsInputSchema>;
