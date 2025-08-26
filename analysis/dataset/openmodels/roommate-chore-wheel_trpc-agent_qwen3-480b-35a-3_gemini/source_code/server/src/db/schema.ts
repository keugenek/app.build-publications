import { serial, text, pgTable, timestamp, integer, boolean, date, foreignKey } from 'drizzle-orm/pg-core';

export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const weeklyAssignmentsTable = pgTable('weekly_assignments', {
  id: serial('id').primaryKey(),
  week_start_date: date('week_start_date').notNull(),
  chore_id: integer('chore_id').notNull().references(() => choresTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  is_completed: boolean('is_completed').notNull().default(false),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type WeeklyAssignment = typeof weeklyAssignmentsTable.$inferSelect;
export type NewWeeklyAssignment = typeof weeklyAssignmentsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  chores: choresTable, 
  users: usersTable, 
  weeklyAssignments: weeklyAssignmentsTable 
};
