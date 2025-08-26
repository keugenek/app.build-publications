import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for notification types
export const notificationTypeEnum = pgEnum('notification_type', ['expiring_soon', 'expired']);

// Pantry items table
export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(), // Use numeric for precise quantities
  unit: text('unit').notNull(), // e.g., "cups", "pieces", "grams", "ml"
  expiry_date: timestamp('expiry_date').notNull(),
  added_date: timestamp('added_date').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  ingredients: text('ingredients').array().notNull(), // PostgreSQL array of ingredient names
  instructions: text('instructions').notNull(),
  prep_time_minutes: integer('prep_time_minutes').notNull(),
  cook_time_minutes: integer('cook_time_minutes').notNull(),
  servings: integer('servings').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table for expiry alerts
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  pantry_item_id: integer('pantry_item_id').references(() => pantryItemsTable.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  notification_type: notificationTypeEnum('notification_type').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const pantryItemsRelations = relations(pantryItemsTable, ({ many }) => ({
  notifications: many(notificationsTable),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  pantryItem: one(pantryItemsTable, {
    fields: [notificationsTable.pantry_item_id],
    references: [pantryItemsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type PantryItem = typeof pantryItemsTable.$inferSelect;
export type NewPantryItem = typeof pantryItemsTable.$inferInsert;

export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  pantryItems: pantryItemsTable,
  recipes: recipesTable,
  notifications: notificationsTable,
};
