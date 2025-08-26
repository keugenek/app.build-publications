import { serial, text, pgTable, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Table for storing the master list of chores
export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Table for storing weekly chore assignments
export const weeklyAssignmentsTable = pgTable('weekly_assignments', {
  id: serial('id').primaryKey(),
  chore_id: integer('chore_id').notNull(),
  week_start: date('week_start').notNull(), // Start date of the week (e.g., Monday)
  assigned_person: text('assigned_person'), // Nullable - person assigned to this chore
  is_completed: boolean('is_completed').notNull().default(false),
  completed_at: timestamp('completed_at'), // Nullable - when the chore was completed
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations between tables
export const choresRelations = relations(choresTable, ({ many }) => ({
  assignments: many(weeklyAssignmentsTable),
}));

export const weeklyAssignmentsRelations = relations(weeklyAssignmentsTable, ({ one }) => ({
  chore: one(choresTable, {
    fields: [weeklyAssignmentsTable.chore_id],
    references: [choresTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Chore = typeof choresTable.$inferSelect; // For SELECT operations
export type NewChore = typeof choresTable.$inferInsert; // For INSERT operations

export type WeeklyAssignment = typeof weeklyAssignmentsTable.$inferSelect; // For SELECT operations
export type NewWeeklyAssignment = typeof weeklyAssignmentsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  chores: choresTable, 
  weeklyAssignments: weeklyAssignmentsTable 
};
