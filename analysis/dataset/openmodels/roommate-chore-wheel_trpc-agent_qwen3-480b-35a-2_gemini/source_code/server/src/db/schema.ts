import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const weeklyChoreAssignmentsTable = pgTable('weekly_chore_assignments', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  chore_id: integer('chore_id').notNull().references(() => choresTable.id),
  week_start_date: date('week_start_date').notNull(),
  is_completed: boolean('is_completed').notNull().default(false),
  completed_at: timestamp('completed_at'),
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type WeeklyChoreAssignment = typeof weeklyChoreAssignmentsTable.$inferSelect;
export type NewWeeklyChoreAssignment = typeof weeklyChoreAssignmentsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  chores: choresTable, 
  weeklyChoreAssignments: weeklyChoreAssignmentsTable 
};
