import { serial, text, pgTable, timestamp, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core';

// Enums for product categories and price ranges
export const productCategoryEnum = pgEnum('product_category', ['mice', 'keyboards', 'headsets']);
export const priceRangeEnum = pgEnum('price_range', ['under_25', '25_50', '50_100', '100_plus']);

// Review articles table
export const reviewArticlesTable = pgTable('review_articles', {
  id: serial('id').primaryKey(),
  product_name: text('product_name').notNull(),
  brand: text('brand').notNull(),
  category: productCategoryEnum('category').notNull(),
  star_rating: integer('star_rating').notNull(), // 1-5 star rating
  price_range: priceRangeEnum('price_range').notNull(),
  pros: json('pros').notNull(), // Array of strings stored as JSON
  cons: json('cons').notNull(), // Array of strings stored as JSON
  review_body: text('review_body').notNull(), // Main review content
  slug: text('slug').notNull().unique(), // URL-friendly identifier
  published: boolean('published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type ReviewArticle = typeof reviewArticlesTable.$inferSelect; // For SELECT operations
export type NewReviewArticle = typeof reviewArticlesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  reviewArticles: reviewArticlesTable 
};
