import { serial, text, pgTable, timestamp, integer, boolean, date, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const habitsTable = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const habitTrackingTable = pgTable('habit_tracking', {
  id: serial('id').primaryKey(),
  habit_id: integer('habit_id').notNull().references(() => habitsTable.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate entries for same habit on same date
  uniqueHabitDate: unique().on(table.habit_id, table.date)
}));

// Define relations
export const habitsRelations = relations(habitsTable, ({ many }) => ({
  tracking: many(habitTrackingTable),
}));

export const habitTrackingRelations = relations(habitTrackingTable, ({ one }) => ({
  habit: one(habitsTable, {
    fields: [habitTrackingTable.habit_id],
    references: [habitsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Habit = typeof habitsTable.$inferSelect;
export type NewHabit = typeof habitsTable.$inferInsert;
export type HabitTracking = typeof habitTrackingTable.$inferSelect;
export type NewHabitTracking = typeof habitTrackingTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  habits: habitsTable, 
  habitTracking: habitTrackingTable 
};
