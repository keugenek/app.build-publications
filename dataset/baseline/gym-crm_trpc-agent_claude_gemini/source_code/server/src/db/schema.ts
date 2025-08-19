import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['member', 'administrator']);
export const classTypeEnum = pgEnum('class_type', ['yoga', 'pilates', 'crossfit', 'cardio', 'strength', 'zumba', 'spinning', 'hiit']);
export const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'cancelled', 'no_show', 'attended']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: userRoleEnum('role').notNull(),
  phone: text('phone'),
  date_of_birth: timestamp('date_of_birth'),
  membership_start_date: timestamp('membership_start_date'),
  membership_end_date: timestamp('membership_end_date'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  class_type: classTypeEnum('class_type').notNull(),
  instructor_name: text('instructor_name').notNull(),
  max_capacity: integer('max_capacity').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Class schedules table
export const classSchedulesTable = pgTable('class_schedules', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  room_name: text('room_name'),
  is_cancelled: boolean('is_cancelled').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  class_schedule_id: integer('class_schedule_id').notNull().references(() => classSchedulesTable.id),
  status: bookingStatusEnum('status').default('confirmed').notNull(),
  booked_at: timestamp('booked_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  bookings: many(bookingsTable)
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  schedules: many(classSchedulesTable)
}));

export const classSchedulesRelations = relations(classSchedulesTable, ({ one, many }) => ({
  class: one(classesTable, {
    fields: [classSchedulesTable.class_id],
    references: [classesTable.id]
  }),
  bookings: many(bookingsTable)
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [bookingsTable.user_id],
    references: [usersTable.id]
  }),
  classSchedule: one(classSchedulesTable, {
    fields: [bookingsTable.class_schedule_id],
    references: [classSchedulesTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type ClassSchedule = typeof classSchedulesTable.$inferSelect;
export type NewClassSchedule = typeof classSchedulesTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  classes: classesTable,
  classSchedules: classSchedulesTable,
  bookings: bookingsTable
};
