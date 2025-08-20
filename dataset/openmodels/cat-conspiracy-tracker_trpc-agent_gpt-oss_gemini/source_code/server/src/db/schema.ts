import { pgTable, serial, text, timestamp, integer, numeric, date } from 'drizzle-orm/pg-core';

// Cats table
export const catsTable = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  owner_name: text('owner_name'), // nullable by default matches Zod nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Cat = typeof catsTable.$inferSelect; // For SELECT
export type NewCat = typeof catsTable.$inferInsert; // For INSERT

// Activities table (suspicious cat activities)
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull().references(() => catsTable.id),
  description: text('description').notNull(),
  suspicion_score: numeric('suspicion_score', { precision: 10, scale: 2 }).notNull(), // numeric returns string in DB, but Zod uses number
  activity_date: date('activity_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { cats: catsTable, activities: activitiesTable };
