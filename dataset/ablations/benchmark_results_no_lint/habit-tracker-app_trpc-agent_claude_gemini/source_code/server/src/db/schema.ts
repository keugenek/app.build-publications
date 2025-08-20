import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Habits table
export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Habit check-ins table
export const habitCheckInsTable = pgTable('habit_check_ins', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull().references(() => habitsTable.id, { onDelete: 'cascade' }),
  completed_at: timestamp('completed_at').notNull(), // The date when the habit was completed
  created_at: timestamp('created_at').defaultNow().notNull(), // When the check-in was recorded
});

// Define relations
export const habitsRelations = relations(habitsTable, ({ many }) => ({
  checkIns: many(habitCheckInsTable),
}));

export const habitCheckInsRelations = relations(habitCheckInsTable, ({ one }) => ({
  habit: one(habitsTable, {
    fields: [habitCheckInsTable.habit_id],
    references: [habitsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;
export type HabitCheckIn = typeof habitCheckInsTable.$inferSelect;
export type NewHabitCheckIn = typeof habitCheckInsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  habits: habitsTable, 
  habitCheckIns: habitCheckInsTable 
};
