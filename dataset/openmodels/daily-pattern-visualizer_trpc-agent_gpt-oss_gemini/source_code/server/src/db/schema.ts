import { pgTable, serial, timestamp, real, integer } from 'drizzle-orm/pg-core';

// Table definition for daily logs
export const dailyLogsTable = pgTable('daily_logs', {
  id: serial('id').primaryKey(),
  logged_at: timestamp('logged_at').notNull().defaultNow(),
  // Hours fields can be fractional, use real (maps to number)
  sleep_hours: real('sleep_hours').notNull(),
  work_hours: real('work_hours').notNull(),
  social_hours: real('social_hours').notNull(),
  screen_hours: real('screen_hours').notNull(),
  // Emotional energy on a 1-10 scale, integer
  emotional_energy: integer('emotional_energy').notNull(),
});

// Types inferred from the table
export type DailyLog = typeof dailyLogsTable.$inferSelect; // For SELECT queries
export type NewDailyLog = typeof dailyLogsTable.$inferInsert; // For INSERT queries

// Export all tables for relation queries
export const tables = {
  dailyLogs: dailyLogsTable,
};
