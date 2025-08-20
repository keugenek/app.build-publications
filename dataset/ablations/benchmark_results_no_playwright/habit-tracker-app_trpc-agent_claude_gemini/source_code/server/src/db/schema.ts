import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const habitCheckinsTable = pgTable('habit_checkins', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull(),
  date: date('date').notNull(), // Store as date (YYYY-MM-DD)
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const habitsRelations = relations(habitsTable, ({ many }) => ({
  checkins: many(habitCheckinsTable),
}));

export const habitCheckinsRelations = relations(habitCheckinsTable, ({ one }) => ({
  habit: one(habitsTable, {
    fields: [habitCheckinsTable.habit_id],
    references: [habitsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;
export type HabitCheckin = typeof habitCheckinsTable.$inferSelect;
export type NewHabitCheckin = typeof habitCheckinsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  habits: habitsTable, 
  habitCheckins: habitCheckinsTable 
};
