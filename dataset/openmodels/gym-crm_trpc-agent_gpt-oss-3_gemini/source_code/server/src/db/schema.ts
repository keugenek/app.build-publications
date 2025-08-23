import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

// ---------- Classes table ----------
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // nullable by default
  capacity: integer('capacity').notNull(),
  instructor: text('instructor').notNull(),
  scheduled_at: timestamp('scheduled_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Members table ----------
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Reservations table (junction) ----------
export const reservationsTable = pgTable('reservations', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  member_id: integer('member_id').notNull().references(() => membersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for selects and inserts
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;
export type Reservation = typeof reservationsTable.$inferSelect;
export type NewReservation = typeof reservationsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  classes: classesTable,
  members: membersTable,
  reservations: reservationsTable,
};
