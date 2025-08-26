import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Cats table
export const catsTable = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  breed: text('breed'), // Nullable by default
  age: integer('age'), // Nullable by default
  description: text('description'), // For owner notes about their suspicious feline
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Activities table - logs all suspicious cat behaviors
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull(),
  activity_type: text('activity_type').notNull(), // e.g., "prolonged staring", "gifting dead insects"
  description: text('description'), // Additional details about the suspicious behavior
  conspiracy_score: integer('conspiracy_score').notNull(), // 1-10 score for how suspicious this activity is
  recorded_at: timestamp('recorded_at').defaultNow().notNull(), // When the activity occurred
  created_at: timestamp('created_at').defaultNow().notNull() // When it was logged
});

// Define relations
export const catsRelations = relations(catsTable, ({ many }) => ({
  activities: many(activitiesTable)
}));

export const activitiesRelations = relations(activitiesTable, ({ one }) => ({
  cat: one(catsTable, {
    fields: [activitiesTable.cat_id],
    references: [catsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Cat = typeof catsTable.$inferSelect; // For SELECT operations
export type NewCat = typeof catsTable.$inferInsert; // For INSERT operations
export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  cats: catsTable, 
  activities: activitiesTable 
};
