import { pgEnum, pgTable, serial, text, integer, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import type { Category } from '../schema';

// Define enum for categories matching Zod enum
export const categoryEnum = pgEnum('category', ['Mice', 'Keyboards', 'Headsets', 'Gamepads'] as const);

export const reviewArticles = pgTable('review_articles', {
  id: serial('id').primaryKey(),
  product_name: text('product_name').notNull(),
  category: categoryEnum('category').notNull(),
  brand: text('brand').notNull(),
  overall_rating: integer('overall_rating').notNull(),
  pros: jsonb('pros').notNull(), // store array of strings as JSONB
  cons: jsonb('cons').notNull(),
  detailed_review: text('detailed_review').notNull(),
  featured_image: text('featured_image').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Export types for select and insert
export type ReviewArticle = typeof reviewArticles.$inferSelect;
export type NewReviewArticle = typeof reviewArticles.$inferInsert;

// Export tables for relation queries
export const tables = { reviewArticles };
