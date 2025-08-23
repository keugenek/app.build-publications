import { serial, text, pgTable, timestamp, integer, date } from 'drizzle-orm/pg-core';

// Define the activities table
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  suspicion_score: integer('suspicion_score').notNull(),
  activity_type: text('activity_type', { enum: [
    'Prolonged Staring',
    'Midnight Zoomies', 
    'Leaving \'Gifts\' (dead insects, toys, etc.)',
    'Silent Judgment',
    'Plotting on the Keyboard'
  ]}).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  date: date('date').notNull(), // The date this activity happened
});

// TypeScript types for the table schema
export type Activity = typeof activitiesTable.$inferSelect; // For SELECT operations
export type NewActivity = typeof activitiesTable.$inferInsert; // For INSERT operations

// Export tables for relation queries
export const tables = { activities: activitiesTable };
