import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Categories table definition
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Reviews table definition
export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  rating: integer('rating').notNull(), // 1-5 stars
  summary: text('summary').notNull(),
  body: text('body').notNull(),
  category_id: integer('category_id').notNull(), // FK to categories.id (relation handled elsewhere)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export table collection for drizzle relation queries
export const tables = {
  categories: categoriesTable,
  reviews: reviewsTable,
};

// Types inferred from tables (for future use)
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;
