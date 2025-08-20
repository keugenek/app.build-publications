import { serial, text, pgTable, timestamp, real, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Define the product category enum
export const productCategoryEnum = pgEnum('product_category', ['mice', 'keyboards', 'headsets', 'mousepads', 'controllers']);

export const productReviewsTable = pgTable('product_reviews', {
  id: serial('id').primaryKey(),
  product_name: text('product_name').notNull(),
  brand: text('brand').notNull(),
  category: productCategoryEnum('category').notNull(),
  rating: real('rating').notNull(), // Use real for decimal ratings (1-10 scale)
  pros: jsonb('pros').notNull().$type<string[]>(), // Store array of strings as JSONB
  cons: jsonb('cons').notNull().$type<string[]>(), // Store array of strings as JSONB
  review_text: text('review_text').notNull(),
  image_urls: jsonb('image_urls').notNull().$type<string[]>().default([]), // Store array of image URLs as JSONB
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'), // Nullable - only set when updated
});

// TypeScript types for the table schema
export type ProductReview = typeof productReviewsTable.$inferSelect; // For SELECT operations
export type NewProductReview = typeof productReviewsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  productReviews: productReviewsTable 
};
