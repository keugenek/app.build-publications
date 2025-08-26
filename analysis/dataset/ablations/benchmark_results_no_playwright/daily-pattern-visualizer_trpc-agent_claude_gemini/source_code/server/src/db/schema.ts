import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';

// Activity logs table for tracking daily activities
export const activityLogsTable = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  date: date('date').notNull(), // Date of the activity log (YYYY-MM-DD format)
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(),
  work_hours: numeric('work_hours', { precision: 4, scale: 2 }).notNull(),
  social_hours: numeric('social_hours', { precision: 4, scale: 2 }).notNull(),
  screen_hours: numeric('screen_hours', { precision: 4, scale: 2 }).notNull(),
  emotional_energy: integer('emotional_energy').notNull(), // 1-10 scale
  notes: text('notes'), // Nullable - optional notes from user
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type NewActivityLog = typeof activityLogsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  activityLogs: activityLogsTable 
};
