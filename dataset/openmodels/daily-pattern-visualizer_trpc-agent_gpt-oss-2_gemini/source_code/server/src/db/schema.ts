import { pgTable, serial, date, numeric, integer } from 'drizzle-orm/pg-core';

export const dailyMetricsTable = pgTable('daily_metrics', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  sleep_duration: numeric('sleep_duration', { precision: 5, scale: 2 }).notNull(),
  work_hours: numeric('work_hours', { precision: 5, scale: 2 }).notNull(),
  social_time: numeric('social_time', { precision: 5, scale: 2 }).notNull(),
  screen_time: numeric('screen_time', { precision: 5, scale: 2 }).notNull(),
  emotional_energy: integer('emotional_energy').notNull(),
});

// Types for SELECT and INSERT operations
export type DailyMetrics = typeof dailyMetricsTable.$inferSelect;
export type NewDailyMetrics = typeof dailyMetricsTable.$inferInsert;

// Export tables for relation queries
export const tables = { dailyMetrics: dailyMetricsTable };
