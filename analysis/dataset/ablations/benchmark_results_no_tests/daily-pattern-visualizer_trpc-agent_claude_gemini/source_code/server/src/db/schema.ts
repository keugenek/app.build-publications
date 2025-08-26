import { serial, text, pgTable, timestamp, real, integer, boolean, date, unique } from 'drizzle-orm/pg-core';

// Daily metrics table
export const dailyMetricsTable = pgTable('daily_metrics', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  sleep_duration: real('sleep_duration').notNull(), // Hours as decimal
  work_hours: real('work_hours').notNull(), // Hours as decimal
  social_interaction_time: real('social_interaction_time').notNull(), // Hours as decimal
  screen_time: real('screen_time').notNull(), // Hours as decimal
  emotional_energy_level: integer('emotional_energy_level').notNull(), // Integer 1-10
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  // Ensure only one entry per date
  uniqueDate: unique().on(table.date)
}));

// Work sessions table for tracking work periods and breaks
export const workSessionsTable = pgTable('work_sessions', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time'), // Nullable - null means session is ongoing
  is_break: boolean('is_break').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type DailyMetrics = typeof dailyMetricsTable.$inferSelect; // For SELECT operations
export type NewDailyMetrics = typeof dailyMetricsTable.$inferInsert; // For INSERT operations

export type WorkSession = typeof workSessionsTable.$inferSelect; // For SELECT operations
export type NewWorkSession = typeof workSessionsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  dailyMetrics: dailyMetricsTable,
  workSessions: workSessionsTable 
};
