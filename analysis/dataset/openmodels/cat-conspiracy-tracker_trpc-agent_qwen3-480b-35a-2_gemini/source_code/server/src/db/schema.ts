import { serial, text, pgTable, timestamp, integer, numeric, foreignKey } from 'drizzle-orm/pg-core';

// Behavior types enum
export const behaviorTypesEnum = pgTable('behavior_types', {
  type: text('type').primaryKey()
});

// Cats table
export const catsTable = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  breed: text('breed'),
  age: integer('age'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Behaviors table
export const behaviorsTable = pgTable('behaviors', {
  id: serial('id').primaryKey(),
  cat_id: integer('cat_id').notNull(),
  behavior_type: text('behavior_type').notNull(),
  description: text('description'),
  intensity: integer('intensity').notNull(),
  duration_minutes: integer('duration_minutes'),
  recorded_at: timestamp('recorded_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  catRef: foreignKey({
    columns: [table.cat_id],
    foreignColumns: [catsTable.id]
  })
}));

// Export TypeScript types
export type Cat = typeof catsTable.$inferSelect;
export type NewCat = typeof catsTable.$inferInsert;

export type Behavior = typeof behaviorsTable.$inferSelect;
export type NewBehavior = typeof behaviorsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { cats: catsTable, behaviors: behaviorsTable };
