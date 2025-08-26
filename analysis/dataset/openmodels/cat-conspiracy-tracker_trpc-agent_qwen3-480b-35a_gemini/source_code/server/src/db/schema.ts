import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

// Define enum for activity types in the database
export const suspiciousActivityTypes = [
  'PROLONGED_STARE',
  'GIFT_BRINGING',
  'SUDDEN_PURRING',
  'AGGRESSIVE_KNEADING',
  'MIDDLE_OF_NIGHT_ZOOMIES',
  'ATTACKING_INVISIBLE_ENEMIES',
  'SITTING_IN_FRONT_OF_MONITOR',
  'KNOCKING_THINGS_OFF_COUNTERS',
  'HIDING_AND_POUNCE',
  'CONSTANT_OBSERVATION'
] as const;

export const suspiciousActivitiesTable = pgTable('suspicious_activities', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  activity_type: text('activity_type', { enum: suspiciousActivityTypes }).notNull(),
  conspiracy_points: integer('conspiracy_points').notNull(), // Points contributing to conspiracy level
  recorded_at: timestamp('recorded_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type SuspiciousActivity = typeof suspiciousActivitiesTable.$inferSelect; // For SELECT operations
export type NewSuspiciousActivity = typeof suspiciousActivitiesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { suspiciousActivities: suspiciousActivitiesTable };
