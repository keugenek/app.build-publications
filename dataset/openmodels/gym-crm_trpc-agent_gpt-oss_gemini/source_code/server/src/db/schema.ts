import { pgTable, serial, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enum for booking status – matches Zod enum in schema.ts
export const bookingStatusEnum = pgEnum('booking_status', ['booked', 'attended', 'canceled'] as const);

// Classes table – represents a gym class/schedule entry
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // nullable by default
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  capacity: integer('capacity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Members table – gym members information
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookings table – links members to classes and tracks status
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id')
    .notNull()
    .references(() => classesTable.id),
  member_id: integer('member_id')
    .notNull()
    .references(() => membersTable.id),
  status: bookingStatusEnum('status').notNull().default('booked'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT (read) and INSERT (create) operations
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

// Export all tables for relation queries in drizzle initialization
export const tables = {
  classes: classesTable,
  members: membersTable,
  bookings: bookingsTable,
};
