import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, date, time } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const membershipTypeEnum = pgEnum('membership_type', ['basic', 'premium', 'vip']);
export const classTypeEnum = pgEnum('class_type', ['cardio', 'strength', 'yoga', 'pilates', 'crossfit', 'dance', 'martial_arts']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced']);
export const bookingStatusEnum = pgEnum('booking_status', ['booked', 'cancelled', 'attended', 'no_show']);

// Members table
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'), // Nullable by default
  membership_type: membershipTypeEnum('membership_type').notNull(),
  membership_start_date: date('membership_start_date').notNull(),
  membership_end_date: date('membership_end_date').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  instructor_name: text('instructor_name').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  max_capacity: integer('max_capacity').notNull(),
  class_type: classTypeEnum('class_type').notNull(),
  difficulty_level: difficultyLevelEnum('difficulty_level').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Class schedules table
export const classSchedulesTable = pgTable('class_schedules', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  scheduled_date: date('scheduled_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  current_bookings: integer('current_bookings').notNull().default(0),
  is_cancelled: boolean('is_cancelled').notNull().default(false),
  cancellation_reason: text('cancellation_reason'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull().references(() => membersTable.id),
  class_schedule_id: integer('class_schedule_id').notNull().references(() => classSchedulesTable.id),
  booking_status: bookingStatusEnum('booking_status').notNull().default('booked'),
  booking_date: timestamp('booking_date').defaultNow().notNull(),
  cancellation_date: timestamp('cancellation_date'), // Nullable by default
  attendance_marked_at: timestamp('attendance_marked_at'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const membersRelations = relations(membersTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  schedules: many(classSchedulesTable),
}));

export const classSchedulesRelations = relations(classSchedulesTable, ({ one, many }) => ({
  class: one(classesTable, {
    fields: [classSchedulesTable.class_id],
    references: [classesTable.id],
  }),
  bookings: many(bookingsTable),
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [bookingsTable.member_id],
    references: [membersTable.id],
  }),
  classSchedule: one(classSchedulesTable, {
    fields: [bookingsTable.class_schedule_id],
    references: [classSchedulesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type ClassSchedule = typeof classSchedulesTable.$inferSelect;
export type NewClassSchedule = typeof classSchedulesTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  members: membersTable,
  classes: classesTable,
  classSchedules: classSchedulesTable,
  bookings: bookingsTable
};
