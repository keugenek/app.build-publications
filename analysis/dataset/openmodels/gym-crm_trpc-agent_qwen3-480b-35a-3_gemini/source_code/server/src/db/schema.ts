import { serial, text, pgTable, timestamp, integer, numeric, foreignKey } from 'drizzle-orm/pg-core';

export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const instructorsTable = pgTable('instructors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  instructor_id: integer('instructor_id').notNull().references(() => instructorsTable.id),
  capacity: integer('capacity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const reservationsTable = pgTable('reservations', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  member_id: integer('member_id').notNull().references(() => membersTable.id),
  reserved_at: timestamp('reserved_at').defaultNow().notNull(),
  cancelled_at: timestamp('cancelled_at'),
});

// TypeScript types for the table schemas
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Instructor = typeof instructorsTable.$inferSelect;
export type NewInstructor = typeof instructorsTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Reservation = typeof reservationsTable.$inferSelect;
export type NewReservation = typeof reservationsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  members: membersTable, 
  instructors: instructorsTable, 
  classes: classesTable, 
  reservations: reservationsTable 
};
