import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

// Services table for plumbing services
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Testimonials table for customer reviews
export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  review_text: text('review_text').notNull(),
  rating: integer('rating').notNull(), // 1-5 star rating
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Contact submissions table for lead capture
export const contactSubmissionsTable = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone_number: text('phone_number'), // Nullable by default
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
export type NewContactSubmission = typeof contactSubmissionsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  services: servicesTable, 
  testimonials: testimonialsTable,
  contactSubmissions: contactSubmissionsTable
};
