import { serial, text, pgTable, timestamp, integer, date, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Habits table - stores the habit definitions
export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Habit completions table - stores when habits were completed
export const habitCompletionsTable = pgTable('habit_completions', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull().references(() => habitsTable.id, { onDelete: 'cascade' }),
  completed_at: date('completed_at').notNull(), // Store date only, not full timestamp
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  // Index for efficient queries by habit and date
  habitDateIdx: index('habit_date_idx').on(table.habit_id, table.completed_at),
  // Unique constraint to prevent duplicate completions for same habit on same date
  habitDateUnique: index('habit_date_unique').on(table.habit_id, table.completed_at)
}));

// Define relations between tables
export const habitsRelations = relations(habitsTable, ({ many }) => ({
  completions: many(habitCompletionsTable)
}));

export const habitCompletionsRelations = relations(habitCompletionsTable, ({ one }) => ({
  habit: one(habitsTable, {
    fields: [habitCompletionsTable.habit_id],
    references: [habitsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Habit = typeof habitsTable.$inferSelect; // For SELECT operations
export type NewHabit = typeof habitsTable.$inferInsert; // For INSERT operations

export type HabitCompletion = typeof habitCompletionsTable.$inferSelect;
export type NewHabitCompletion = typeof habitCompletionsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  habits: habitsTable, 
  habitCompletions: habitCompletionsTable 
};
