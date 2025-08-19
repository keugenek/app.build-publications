import { serial, real, integer, pgTable, timestamp, date, unique } from 'drizzle-orm/pg-core';

export const dailyLogsTable = pgTable('daily_logs', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Date of the log entry
  sleep_duration: real('sleep_duration').notNull(), // Hours of sleep
  work_hours: real('work_hours').notNull(), // Hours of work
  social_time: real('social_time').notNull(), // Hours of social time
  screen_time: real('screen_time').notNull(), // Hours of screen time
  emotional_energy: integer('emotional_energy').notNull(), // Scale 1-10
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure only one log per date
  uniqueDate: unique().on(table.date),
}));

// TypeScript types for the table schema
export type DailyLog = typeof dailyLogsTable.$inferSelect; // For SELECT operations
export type NewDailyLog = typeof dailyLogsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { dailyLogs: dailyLogsTable };
