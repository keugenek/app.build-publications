import { pgTable, serial, text, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Habits table
// ---------------------------------------------------------------------------
export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Habit checks (daily progress) table
// ---------------------------------------------------------------------------
export const habitChecksTable = pgTable('habit_checks', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id')
    .notNull()
    .references(() => habitsTable.id),
  check_date: date('check_date').notNull(),
  completed: boolean('completed').default(true).notNull(), // check‑in always marks completed
});

// Export table types for SELECT and INSERT operations
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;

export type HabitCheck = typeof habitChecksTable.$inferSelect;
export type NewHabitCheck = typeof habitChecksTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  habits: habitsTable,
  habitChecks: habitChecksTable,
};
