import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['member', 'admin', 'instructor']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  created_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Instructor schema
export const instructorSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  specialization: z.string().nullable(),
  bio: z.string().nullable(),
  created_at: z.coerce.date()
});
export type Instructor = z.infer<typeof instructorSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  instructor_id: z.number(),
  max_capacity: z.number().int().positive(),
  created_at: z.coerce.date()
});
export type Class = z.infer<typeof classSchema>;

// Booking schema
export const bookingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  class_id: z.number(),
  booking_status: z.enum(['confirmed', 'cancelled', 'waitlist']),
  booked_at: z.coerce.date(),
  cancelled_at: z.coerce.date().nullable()
});
export type Booking = z.infer<typeof bookingSchema>;

// Attendance schema
export const attendanceSchema = z.object({
  id: z.number(),
  booking_id: z.number(),
  attended: z.boolean(),
  checked_in_at: z.coerce.date().nullable(),
  notes: z.string().nullable()
});
export type Attendance = z.infer<typeof attendanceSchema>;

// Input schemas for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schemas for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: userRoleSchema.optional()
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schemas for creating instructors
export const createInstructorInputSchema = z.object({
  user_id: z.number(),
  specialization: z.string().nullable().optional(),
  bio: z.string().nullable().optional()
});
export type CreateInstructorInput = z.infer<typeof createInstructorInputSchema>;

// Input schemas for updating instructors
export const updateInstructorInputSchema = z.object({
  id: z.number(),
  specialization: z.string().nullable().optional(),
  bio: z.string().nullable().optional()
});
export type UpdateInstructorInput = z.infer<typeof updateInstructorInputSchema>;

// Input schemas for creating classes
export const createClassInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  instructor_id: z.number(),
  max_capacity: z.number().int().positive()
});
export type CreateClassInput = z.infer<typeof createClassInputSchema>;

// Input schemas for updating classes
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  start_time: z.coerce.date().optional(),
  end_time: z.coerce.date().optional(),
  instructor_id: z.number().optional(),
  max_capacity: z.number().int().positive().optional()
});
export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Input schemas for creating bookings
export const createBookingInputSchema = z.object({
  user_id: z.number(),
  class_id: z.number()
});
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Input schemas for updating bookings
export const updateBookingInputSchema = z.object({
  id: z.number(),
  booking_status: z.enum(['confirmed', 'cancelled', 'waitlist']).optional()
});
export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;

// Input schemas for creating attendance records
export const createAttendanceInputSchema = z.object({
  booking_id: z.number(),
  attended: z.boolean(),
  notes: z.string().nullable().optional()
});
export type CreateAttendanceInput = z.infer<typeof createAttendanceInputSchema>;

// Input schemas for updating attendance records
export const updateAttendanceInputSchema = z.object({
  id: z.number(),
  attended: z.boolean().optional(),
  checked_in_at: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceInputSchema>;

// Query schemas
export const getUserByIdInputSchema = z.object({
  id: z.number()
});
export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;

export const getClassByIdInputSchema = z.object({
  id: z.number()
});
export type GetClassByIdInput = z.infer<typeof getClassByIdInputSchema>;

export const getBookingsByUserInputSchema = z.object({
  user_id: z.number()
});
export type GetBookingsByUserInput = z.infer<typeof getBookingsByUserInputSchema>;

export const getBookingsByClassInputSchema = z.object({
  class_id: z.number()
});
export type GetBookingsByClassInput = z.infer<typeof getBookingsByClassInputSchema>;

export const getClassesDateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});
export type GetClassesDateRangeInput = z.infer<typeof getClassesDateRangeInputSchema>;

export const deleteEntityInputSchema = z.object({
  id: z.number()
});
export type DeleteEntityInput = z.infer<typeof deleteEntityInputSchema>;
