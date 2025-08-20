import { serial, text, pgTable, timestamp, integer, date, time, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const membershipTypeEnum = pgEnum('membership_type', ['basic', 'premium', 'vip']);
export const memberStatusEnum = pgEnum('member_status', ['active', 'inactive', 'suspended']);
export const classStatusEnum = pgEnum('class_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);
export const bookingStatusEnum = pgEnum('booking_status', ['booked', 'attended', 'no_show', 'cancelled']);

// Members table
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'), // Nullable by default
  membership_type: membershipTypeEnum('membership_type').notNull().default('basic'),
  status: memberStatusEnum('status').notNull().default('active'),
  joined_at: timestamp('joined_at').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  instructor_name: text('instructor_name').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  max_capacity: integer('max_capacity').notNull(),
  current_bookings: integer('current_bookings').notNull().default(0),
  class_date: date('class_date').notNull(),
  start_time: time('start_time').notNull(),
  status: classStatusEnum('status').notNull().default('scheduled'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull(),
  class_id: integer('class_id').notNull(),
  status: bookingStatusEnum('status').notNull().default('booked'),
  booked_at: timestamp('booked_at').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Define relations
export const membersRelations = relations(membersTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [bookingsTable.member_id],
    references: [membersTable.id],
  }),
  class: one(classesTable, {
    fields: [bookingsTable.class_id],
    references: [classesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;
export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  members: membersTable, 
  classes: classesTable, 
  bookings: bookingsTable 
};

export const relations_exports = { 
  membersRelations, 
  classesRelations, 
  bookingsRelations 
};
