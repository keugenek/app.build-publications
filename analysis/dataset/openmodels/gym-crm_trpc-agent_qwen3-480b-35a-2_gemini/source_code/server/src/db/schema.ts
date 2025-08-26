import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  instructor: text('instructor').notNull(),
  date: timestamp('date').notNull(),
  time: text('time').notNull(), // Using text for time storage (e.g., "10:00 AM")
  capacity: integer('capacity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const reservationsTable = pgTable('reservations', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull(),
  classId: integer('class_id').notNull(),
  reservedAt: timestamp('reserved_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Reservation = typeof reservationsTable.$inferSelect;
export type NewReservation = typeof reservationsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  classes: classesTable, 
  members: membersTable, 
  reservations: reservationsTable 
};
