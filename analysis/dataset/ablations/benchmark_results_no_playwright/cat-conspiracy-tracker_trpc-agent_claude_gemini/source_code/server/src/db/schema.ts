import { serial, text, pgTable, timestamp, integer, date } from 'drizzle-orm/pg-core';

export const catsTable = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Optional description of the cat
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const activityTypesTable = pgTable('activity_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., "prolonged staring", "knocking items off shelves"
  description: text('description'), // Detailed description of the suspicious activity
  suspicion_points: integer('suspicion_points').notNull(), // Points awarded for this activity
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const suspiciousActivitiesTable = pgTable('suspicious_activities', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull(),
  activity_type_id: integer('activity_type_id').notNull(),
  notes: text('notes'), // Optional notes about this specific instance
  logged_at: timestamp('logged_at').defaultNow().notNull(),
  activity_date: date('activity_date').notNull(), // Date when the activity occurred (for daily conspiracy level calculation)
});

// TypeScript types for the table schemas
export type Cat = typeof catsTable.$inferSelect;
export type NewCat = typeof catsTable.$inferInsert;

export type ActivityType = typeof activityTypesTable.$inferSelect;
export type NewActivityType = typeof activityTypesTable.$inferInsert;

export type SuspiciousActivity = typeof suspiciousActivitiesTable.$inferSelect;
export type NewSuspiciousActivity = typeof suspiciousActivitiesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  cats: catsTable,
  activityTypes: activityTypesTable,
  suspiciousActivities: suspiciousActivitiesTable
};
