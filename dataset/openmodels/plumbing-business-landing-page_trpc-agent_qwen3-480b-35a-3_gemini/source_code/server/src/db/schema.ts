import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon'), // URL to icon image
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_position: text('customer_position'),
  company_name: text('company_name'),
  content: text('content').notNull(),
  rating: integer('rating').notNull(), // 1-5 rating
  avatar: text('avatar'), // URL to customer avatar
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { services: servicesTable, testimonials: testimonialsTable };