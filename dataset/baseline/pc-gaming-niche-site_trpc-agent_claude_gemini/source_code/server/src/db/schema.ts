import { serial, text, pgTable, timestamp, numeric, pgEnum, json } from 'drizzle-orm/pg-core';

// Define product category enum for PostgreSQL
export const productCategoryEnum = pgEnum('product_category', ['mice', 'keyboards', 'headsets']);

// Articles table for peripheral reviews
export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  product_name: text('product_name').notNull(),
  category: productCategoryEnum('category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values with precision
  overall_rating: numeric('overall_rating', { precision: 2, scale: 1 }).notNull(), // 1.0 to 5.0 with one decimal place
  short_description: text('short_description').notNull(),
  detailed_review: text('detailed_review').notNull(), // Rich text/markdown content
  pros: json('pros').$type<string[]>().notNull(), // JSON array of strings for pros
  cons: json('cons').$type<string[]>().notNull(), // JSON array of strings for cons
  main_image_url: text('main_image_url'), // Nullable by default for optional image
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Article = typeof articlesTable.$inferSelect; // For SELECT operations
export type NewArticle = typeof articlesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  articles: articlesTable 
};
