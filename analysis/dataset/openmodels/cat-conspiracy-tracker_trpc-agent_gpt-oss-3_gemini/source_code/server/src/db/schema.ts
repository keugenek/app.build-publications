import { pgTable, serial, integer, timestamp, text, pgEnum } from 'drizzle-orm/pg-core';

// Define enum matching activity types
export const activityTypeEnum = pgEnum('activity_type', [
  'PROLONGED_STARING',
  'DEAD_INSECT_GIFT',
  'LIVE_ANIMAL_GIFT',
  'MIDNIGHT_ZOOMIES',
  'IGNORING_COMMANDS',
  'INTENSE_GROOMING_GLANCE',
]);

export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  type: activityTypeEnum('type').notNull(), // enum, not null
  points: integer('points').notNull(), // points for activity
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Infer TypeScript types from the table definition
export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;

// Export tables for drizzle relation queries
export const tables = {
  activities: activitiesTable,
};
