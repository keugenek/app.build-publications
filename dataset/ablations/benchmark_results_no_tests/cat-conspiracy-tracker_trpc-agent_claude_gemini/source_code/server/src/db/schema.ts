import { serial, text, pgTable, timestamp, integer, pgEnum, date, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for cat activity types
export const catActivityTypeEnum = pgEnum('cat_activity_type', [
  'prolonged_staring',
  'bringing_gifts',
  'knocking_items',
  'sudden_zoomies',
  'vocalizing_at_objects',
  'hiding_under_furniture',
  'sitting_in_boxes',
  'midnight_meetings',
  'suspicious_purring',
  'ignoring_humans'
]);

// Enum for suspicion levels
export const suspicionLevelEnum = pgEnum('suspicion_level', [
  'low',
  'medium',
  'high',
  'maximum'
]);

// Enum for conspiracy levels
export const conspiracyLevelEnum = pgEnum('conspiracy_level', [
  'innocent',
  'suspicious',
  'plotting',
  'dangerous',
  'world_domination'
]);

// Cat profiles table
export const catProfilesTable = pgTable('cat_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  breed: text('breed'), // Nullable by default
  color: text('color'), // Nullable by default
  age_years: integer('age_years'), // Nullable by default
  suspicion_level: suspicionLevelEnum('suspicion_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Cat activity logs table
export const catActivityLogsTable = pgTable('cat_activity_logs', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull().references(() => catProfilesTable.id, { onDelete: 'cascade' }),
  activity_type: catActivityTypeEnum('activity_type').notNull(),
  description: text('description'), // Nullable by default
  conspiracy_points: integer('conspiracy_points').notNull(),
  occurred_at: timestamp('occurred_at').notNull(),
  logged_at: timestamp('logged_at').defaultNow().notNull(),
});

// Daily conspiracy summaries table
export const dailyConspiracySummariesTable = pgTable('daily_conspiracy_summaries', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull().references(() => catProfilesTable.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  total_conspiracy_points: integer('total_conspiracy_points').notNull(),
  conspiracy_level: conspiracyLevelEnum('conspiracy_level').notNull(),
  activity_count: integer('activity_count').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const catProfilesRelations = relations(catProfilesTable, ({ many }) => ({
  activities: many(catActivityLogsTable),
  dailySummaries: many(dailyConspiracySummariesTable),
}));

export const catActivityLogsRelations = relations(catActivityLogsTable, ({ one }) => ({
  cat: one(catProfilesTable, {
    fields: [catActivityLogsTable.cat_id],
    references: [catProfilesTable.id],
  }),
}));

export const dailyConspiracySummariesRelations = relations(dailyConspiracySummariesTable, ({ one }) => ({
  cat: one(catProfilesTable, {
    fields: [dailyConspiracySummariesTable.cat_id],
    references: [catProfilesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type CatProfile = typeof catProfilesTable.$inferSelect;
export type NewCatProfile = typeof catProfilesTable.$inferInsert;

export type CatActivityLog = typeof catActivityLogsTable.$inferSelect;
export type NewCatActivityLog = typeof catActivityLogsTable.$inferInsert;

export type DailyConspiracySummary = typeof dailyConspiracySummariesTable.$inferSelect;
export type NewDailyConspiracySummary = typeof dailyConspiracySummariesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  catProfiles: catProfilesTable,
  catActivityLogs: catActivityLogsTable,
  dailyConspiracySummaries: dailyConspiracySummariesTable,
};
