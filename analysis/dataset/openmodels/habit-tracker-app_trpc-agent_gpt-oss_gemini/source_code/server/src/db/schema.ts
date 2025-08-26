import { pgTable, serial, text, timestamp, date, integer } from 'drizzle-orm/pg-core';

// Table for habits
export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Table for habit completions (one per day per habit)
export const habitCompletionsTable = pgTable('habit_completions', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id')
    .notNull()
    .references(() => habitsTable.id),
  date: date('date').notNull(), // date without time component
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for selects and inserts
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;
export type HabitCompletion = typeof habitCompletionsTable.$inferSelect;
export type NewHabitCompletion = typeof habitCompletionsTable.$inferInsert;

// Export tables for relation queries
export const tables = { habits: habitsTable, habitCompletions: habitCompletionsTable };
