import { pgTable, serial, text, timestamp, date, boolean, integer } from 'drizzle-orm/pg-core';

// Habits table definition
export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Habit completions table definition
export const habitCompletionsTable = pgTable('habit_completions', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull(), // foreign key to habits.id (relation handled elsewhere)
  date: date('date').notNull(),
  completed: boolean('completed').notNull().default(true),
});

// Export types for select/insert operations
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;

export type HabitCompletion = typeof habitCompletionsTable.$inferSelect;
export type NewHabitCompletion = typeof habitCompletionsTable.$inferInsert;

// Export all tables for drizzle relation queries
export const tables = {
  habits: habitsTable,
  habitCompletions: habitCompletionsTable,
};
