import { serial, date, numeric, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const dailyLogsTable = pgTable('daily_logs', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Date of the log entry
  sleep_hours: numeric('sleep_hours', { precision: 8, scale: 2 }).notNull(), // Sleep duration in hours
  work_hours: numeric('work_hours', { precision: 8, scale: 2 }).notNull(), // Work hours
  social_time: numeric('social_time', { precision: 8, scale: 2 }).notNull(), // Social time in hours
  screen_time: numeric('screen_time', { precision: 8, scale: 2 }).notNull(), // Screen time in hours
  emotional_energy: numeric('emotional_energy', { precision: 8, scale: 2 }).notNull(), // Emotional energy on a scale of 1 to 10
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type DailyLog = typeof dailyLogsTable.$inferSelect; // For SELECT operations
export type NewDailyLog = typeof dailyLogsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { dailyLogs: dailyLogsTable };
