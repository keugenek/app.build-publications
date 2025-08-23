import { pgTable, serial, text, timestamp, boolean, date, integer } from 'drizzle-orm/pg-core';

// Participants table
export const participantsTable = pgTable('participants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Chores table
export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Assignments table
export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  week_start: date('week_start').notNull(), // represents the Monday of the week
  chore_id: integer('chore_id').references(() => choresTable.id).notNull(),
  participant_id: integer('participant_id').references(() => participantsTable.id).notNull(),
  completed: boolean('completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT
export type Participant = typeof participantsTable.$inferSelect;
export type NewParticipant = typeof participantsTable.$inferInsert;

export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type Assignment = typeof assignmentsTable.$inferSelect;
export type NewAssignment = typeof assignmentsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  participants: participantsTable,
  chores: choresTable,
  assignments: assignmentsTable,
};
