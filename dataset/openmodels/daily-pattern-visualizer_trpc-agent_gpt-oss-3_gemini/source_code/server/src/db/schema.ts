import { pgTable, serial, date, numeric, timestamp, integer } from 'drizzle-orm/pg-core';

// Table for daily wellbeing logs
export const logsTable = pgTable('logs', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  sleep_duration: numeric('sleep_duration', { precision: 5, scale: 2 }).notNull(), // hours, fractional
  work_hours: numeric('work_hours', { precision: 5, scale: 2 }).notNull(),
  social_time: numeric('social_time', { precision: 5, scale: 2 }).notNull(),
  screen_time: numeric('screen_time', { precision: 5, scale: 2 }).notNull(),
  emotional_energy: integer('emotional_energy').notNull(), // 1-10 scale
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Types for select and insert operations
export type Log = typeof logsTable.$inferSelect;
export type NewLog = typeof logsTable.$inferInsert;

// Export tables for relation queries
export const tables = { logs: logsTable };
