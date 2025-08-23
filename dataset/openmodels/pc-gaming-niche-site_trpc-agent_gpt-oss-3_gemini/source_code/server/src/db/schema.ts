import { pgTable, serial, text, timestamp, integer, numeric, varchar, pgEnum } from 'drizzle-orm/pg-core';

// Category table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Product table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category_id: integer('category_id').references(() => categoriesTable.id).notNull(),
  image_url: text('image_url'), // nullable by default
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  specifications: text('specifications'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Review table
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').references(() => productsTable.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull(), // 1-5
  pros: text('pros').array().notNull(), // store array of strings
  cons: text('cons').array().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export inferred types for select/insert operations
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;

// Export tables for relation queries
export const tables = { categories: categoriesTable, products: productsTable, reviews: reviewsTable };
