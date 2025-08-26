import { serial, text, pgTable, timestamp, integer, date, boolean, numeric } from 'drizzle-orm/pg-core';

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const habitCompletionsTable = pgTable('habit_completions', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull().references(() => habitsTable.id),
  date: date('date').notNull(),
  completed: boolean('completed').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;

export type HabitCompletion = typeof habitCompletionsTable.$inferSelect;
export type NewHabitCompletion = typeof habitCompletionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { habits: habitsTable, habitCompletions: habitCompletionsTable };
