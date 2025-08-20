import { serial, text, pgTable, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const reviewArticlesTable = pgTable('review_articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id, { onDelete: 'restrict' }),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  star_rating: numeric('star_rating', { precision: 2, scale: 1 }).notNull(), // Allows ratings like 4.5
  pros: text('pros').notNull(),
  cons: text('cons').notNull(),
  main_image_url: text('main_image_url'), // Nullable by default
  review_content: text('review_content').notNull(),
  published_at: timestamp('published_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations between tables
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  reviewArticles: many(reviewArticlesTable),
}));

export const reviewArticlesRelations = relations(reviewArticlesTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [reviewArticlesTable.category_id],
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type ReviewArticle = typeof reviewArticlesTable.$inferSelect;
export type NewReviewArticle = typeof reviewArticlesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  categories: categoriesTable, 
  reviewArticles: reviewArticlesTable 
};

export const tableRelations = {
  categoriesRelations,
  reviewArticlesRelations
};
