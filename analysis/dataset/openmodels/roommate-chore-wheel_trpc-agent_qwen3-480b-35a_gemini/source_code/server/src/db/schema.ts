import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

export const membersTable = pgTable('members', {
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

export const weeklyAssignmentsTable = pgTable('weekly_assignments', {
  id: serial('id').primaryKey(),
  member_id: integer('member_id').notNull().references(() => membersTable.id),
  chore_id: integer('chore_id').notNull().references(() => choresTable.id),
  week_start_date: date('week_start_date').notNull(),
  is_completed: boolean('is_completed').notNull().default(false),
  completed_at: timestamp('completed_at'),
});

// TypeScript types for the table schemas
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type WeeklyAssignment = typeof weeklyAssignmentsTable.$inferSelect;
export type NewWeeklyAssignment = typeof weeklyAssignmentsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  members: membersTable, 
  chores: choresTable, 
  weeklyAssignments: weeklyAssignmentsTable 
};
