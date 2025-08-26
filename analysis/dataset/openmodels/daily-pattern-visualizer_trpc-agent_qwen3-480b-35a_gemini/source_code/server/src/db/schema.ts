import { serial, date, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const dailyMetricsTable = pgTable('daily_metrics', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  sleep_duration: numeric('sleep_duration', { precision: 8, scale: 2 }).notNull(),
  work_hours: numeric('work_hours', { precision: 8, scale: 2 }).notNull(),
  social_time: numeric('social_time', { precision: 8, scale: 2 }).notNull(),
  screen_time: numeric('screen_time', { precision: 8, scale: 2 }).notNull(),
  emotional_energy: integer('emotional_energy').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type DailyMetrics = typeof dailyMetricsTable.$inferSelect; // For SELECT operations
export type NewDailyMetrics = typeof dailyMetricsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { dailyMetrics: dailyMetricsTable };
