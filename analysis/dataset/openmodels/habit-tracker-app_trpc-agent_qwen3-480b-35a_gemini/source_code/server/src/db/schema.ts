import { serial, text, pgTable, timestamp, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const habitEntriesTable = pgTable('habit_entries', {
  habit_id: integer('habit_id').notNull(),
  date: timestamp('date').notNull(),
  completed: boolean('completed').notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.habit_id, table.date] })
  };
});

// Add foreign key reference
// Note: Drizzle-ORM v0.40.0+ has a different syntax for references
// For now, we'll add this constraint in the database separately

// TypeScript types for the table schemas
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;

export type HabitEntry = typeof habitEntriesTable.$inferSelect;
export type NewHabitEntry = typeof habitEntriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { habits: habitsTable, habitEntries: habitEntriesTable };
