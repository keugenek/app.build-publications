import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const activityEntriesTable = pgTable('activity_entries', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  date: timestamp('date').notNull(),
  sleep_hours: numeric('sleep_hours', { precision: 3, scale: 1 }).notNull(),
  work_hours: numeric('work_hours', { precision: 3, scale: 1 }).notNull(),
  social_time: numeric('social_time', { precision: 3, scale: 1 }).notNull(),
  screen_time: numeric('screen_time', { precision: 3, scale: 1 }).notNull(),
  emotional_energy: integer('emotional_energy').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const suggestionsTable = pgTable('suggestions', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  message: text('message').notNull(),
  suggestion_type: text('suggestion_type').notNull(), // 'break', 'rest', 'social', 'sleep'
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type ActivityEntry = typeof activityEntriesTable.$inferSelect;
export type NewActivityEntry = typeof activityEntriesTable.$inferInsert;

export type Suggestion = typeof suggestionsTable.$inferSelect;
export type NewSuggestion = typeof suggestionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  activityEntries: activityEntriesTable,
  suggestions: suggestionsTable
};
