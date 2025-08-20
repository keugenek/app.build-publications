import { pgTable, serial, text, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Chores table
export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Assignments table – links a chore to a user for a specific week
export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  chore_id: integer('chore_id')
    .references(() => choresTable.id)
    .notNull(),
  user_id: integer('user_id')
    .references(() => usersTable.id)
    .notNull(),
  week_start: date('week_start').notNull(), // represents Monday of the week
  completed: boolean('completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT operations
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type Assignment = typeof assignmentsTable.$inferSelect;
export type NewAssignment = typeof assignmentsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  chores: choresTable,
  assignments: assignmentsTable,
};
