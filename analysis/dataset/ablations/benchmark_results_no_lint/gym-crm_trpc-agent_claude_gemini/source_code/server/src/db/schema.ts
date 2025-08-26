import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['member', 'admin', 'instructor']);
export const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'cancelled', 'waitlist']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Instructors table
export const instructorsTable = pgTable('instructors', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  specialization: text('specialization'),
  bio: text('bio'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  instructor_id: integer('instructor_id').notNull().references(() => instructorsTable.id, { onDelete: 'cascade' }),
  max_capacity: integer('max_capacity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  class_id: integer('class_id').notNull().references(() => classesTable.id, { onDelete: 'cascade' }),
  booking_status: bookingStatusEnum('booking_status').notNull().default('confirmed'),
  booked_at: timestamp('booked_at').defaultNow().notNull(),
  cancelled_at: timestamp('cancelled_at'),
});

// Attendance table
export const attendanceTable = pgTable('attendance', {
  id: serial('id').primaryKey(),
  booking_id: integer('booking_id').notNull().references(() => bookingsTable.id, { onDelete: 'cascade' }),
  attended: boolean('attended').notNull().default(false),
  checked_in_at: timestamp('checked_in_at'),
  notes: text('notes'),
});

// Define relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  instructor: one(instructorsTable, {
    fields: [usersTable.id],
    references: [instructorsTable.user_id],
  }),
  bookings: many(bookingsTable),
}));

export const instructorsRelations = relations(instructorsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [instructorsTable.user_id],
    references: [usersTable.id],
  }),
  classes: many(classesTable),
}));

export const classesRelations = relations(classesTable, ({ one, many }) => ({
  instructor: one(instructorsTable, {
    fields: [classesTable.instructor_id],
    references: [instructorsTable.id],
  }),
  bookings: many(bookingsTable),
}));

export const bookingsRelations = relations(bookingsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [bookingsTable.user_id],
    references: [usersTable.id],
  }),
  class: one(classesTable, {
    fields: [bookingsTable.class_id],
    references: [classesTable.id],
  }),
  attendance: many(attendanceTable),
}));

export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
  booking: one(bookingsTable, {
    fields: [attendanceTable.booking_id],
    references: [bookingsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Instructor = typeof instructorsTable.$inferSelect;
export type NewInstructor = typeof instructorsTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

export type AttendanceRecord = typeof attendanceTable.$inferSelect;
export type NewAttendanceRecord = typeof attendanceTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  instructors: instructorsTable,
  classes: classesTable,
  bookings: bookingsTable,
  attendance: attendanceTable,
};

export const tableRelations = {
  usersRelations,
  instructorsRelations,
  classesRelations,
  bookingsRelations,
  attendanceRelations,
};
