import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Behavior Types table - predefined and custom behavior types
export const behaviorTypesTable = pgTable('behavior_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  conspiracy_score: integer('conspiracy_score').notNull(), // 1-10 scale
  is_custom: boolean('is_custom').notNull().default(true), // false for predefined types
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Cat Activities table - individual suspicious activities logged by users
export const catActivitiesTable = pgTable('cat_activities', {
  id: serial('id').primaryKey(),
  behavior_type_id: integer('behavior_type_id').notNull(),
  description: text('description').notNull(),
  cat_name: text('cat_name'), // Nullable - for users with multiple cats
  activity_date: timestamp('activity_date').notNull(), // When the activity occurred
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Daily Conspiracy Levels table - aggregated conspiracy scores per day
export const dailyConspiracyLevelsTable = pgTable('daily_conspiracy_levels', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Date for the conspiracy level
  total_conspiracy_score: integer('total_conspiracy_score').notNull(),
  activity_count: integer('activity_count').notNull(), // Number of activities that day
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations for proper query building
export const behaviorTypesRelations = relations(behaviorTypesTable, ({ many }) => ({
  activities: many(catActivitiesTable)
}));

export const catActivitiesRelations = relations(catActivitiesTable, ({ one }) => ({
  behaviorType: one(behaviorTypesTable, {
    fields: [catActivitiesTable.behavior_type_id],
    references: [behaviorTypesTable.id]
  })
}));

// TypeScript types for the table schemas
export type BehaviorType = typeof behaviorTypesTable.$inferSelect;
export type NewBehaviorType = typeof behaviorTypesTable.$inferInsert;
export type CatActivity = typeof catActivitiesTable.$inferSelect;
export type NewCatActivity = typeof catActivitiesTable.$inferInsert;
export type DailyConspiracyLevel = typeof dailyConspiracyLevelsTable.$inferSelect;
export type NewDailyConspiracyLevel = typeof dailyConspiracyLevelsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  behaviorTypes: behaviorTypesTable,
  catActivities: catActivitiesTable,
  dailyConspiracyLevels: dailyConspiracyLevelsTable
};
