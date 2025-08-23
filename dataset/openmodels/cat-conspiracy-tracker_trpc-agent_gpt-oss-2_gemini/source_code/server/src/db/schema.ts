import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define enum matching Zod enum
export const activityTypeEnum = pgEnum('activity_type', [
  'staring',
  'gift',
  'night_prowl',
  'sneaky_meow',
  'clawing',
]);

export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  cat_name: text('cat_name').notNull(),
  activity_type: activityTypeEnum('activity_type').notNull(),
  description: text('description'), // nullable by default
  score: integer('score').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for select/insert
export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;

// Export tables collection
export const tables = { activities: activitiesTable };
