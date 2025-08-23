import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const habitTrackingTable = pgTable('habit_tracking', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull(),
  date: date('date').notNull(),
  completed: boolean('completed').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the tables
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;

export type HabitTracking = typeof habitTrackingTable.$inferSelect;
export type NewHabitTracking = typeof habitTrackingTable.$inferInsert;

// Export all tables for relation queries
export const tables = { habits: habitsTable, habitTracking: habitTrackingTable };
