import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['member', 'administrator']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  phone: z.string().nullable(),
  date_of_birth: z.coerce.date().nullable(),
  membership_start_date: z.coerce.date().nullable(),
  membership_end_date: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Class type enum
export const classTypeSchema = z.enum(['yoga', 'pilates', 'crossfit', 'cardio', 'strength', 'zumba', 'spinning', 'hiit']);
export type ClassType = z.infer<typeof classTypeSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  class_type: classTypeSchema,
  instructor_name: z.string(),
  max_capacity: z.number().int().positive(),
  duration_minutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Class schedule schema
export const classScheduleSchema = z.object({
  id: z.number(),
  class_id: z.number(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  room_name: z.string().nullable(),
  is_cancelled: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ClassSchedule = z.infer<typeof classScheduleSchema>;

// Booking status enum
export const bookingStatusSchema = z.enum(['confirmed', 'cancelled', 'no_show', 'attended']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  class_schedule_id: z.number(),
  status: bookingStatusSchema,
  booked_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: userRoleSchema,
  phone: z.string().nullable(),
  date_of_birth: z.coerce.date().nullable(),
  membership_start_date: z.coerce.date().nullable(),
  membership_end_date: z.coerce.date().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createClassInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  class_type: classTypeSchema,
  instructor_name: z.string().min(1),
  max_capacity: z.number().int().positive(),
  duration_minutes: z.number().int().positive(),
  price: z.number().nonnegative()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const createClassScheduleInputSchema = z.object({
  class_id: z.number(),
  start_time: z.coerce.date(),
  room_name: z.string().nullable()
});

export type CreateClassScheduleInput = z.infer<typeof createClassScheduleInputSchema>;

export const createBookingInputSchema = z.object({
  user_id: z.number(),
  class_schedule_id: z.number()
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Input schemas for updating entities
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  date_of_birth: z.coerce.date().nullable().optional(),
  membership_start_date: z.coerce.date().nullable().optional(),
  membership_end_date: z.coerce.date().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  class_type: classTypeSchema.optional(),
  instructor_name: z.string().min(1).optional(),
  max_capacity: z.number().int().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  is_active: z.boolean().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

export const updateClassScheduleInputSchema = z.object({
  id: z.number(),
  start_time: z.coerce.date().optional(),
  room_name: z.string().nullable().optional(),
  is_cancelled: z.boolean().optional()
});

export type UpdateClassScheduleInput = z.infer<typeof updateClassScheduleInputSchema>;

export const updateBookingStatusInputSchema = z.object({
  id: z.number(),
  status: bookingStatusSchema
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusInputSchema>;

// Query schemas
export const getClassSchedulesQuerySchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  class_type: classTypeSchema.optional()
});

export type GetClassSchedulesQuery = z.infer<typeof getClassSchedulesQuerySchema>;

export const getUserBookingsQuerySchema = z.object({
  user_id: z.number(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type GetUserBookingsQuery = z.infer<typeof getUserBookingsQuerySchema>;

export const getClassAttendanceQuerySchema = z.object({
  class_schedule_id: z.number()
});

export type GetClassAttendanceQuery = z.infer<typeof getClassAttendanceQuerySchema>;
