import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  categoryId: integer('category_id').notNull().references(() => categoriesTable.id),
  published: boolean('published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  reviews: many(reviewsTable),
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [reviewsTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  // We can add user-related relations here if needed in the future
}));

// TypeScript types
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

// Export all tables for relation queries
export const tables = { categories: categoriesTable, reviews: reviewsTable, users: usersTable };
