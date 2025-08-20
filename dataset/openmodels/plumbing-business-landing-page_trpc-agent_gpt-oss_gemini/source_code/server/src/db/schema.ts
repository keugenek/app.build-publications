import { pgTable, serial, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

// Services table
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }), // nullable by default
});

export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

// Testimonials table
export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  content: text('content').notNull(),
  rating: integer('rating'), // nullable, optional rating 1-5
});

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

// Contact submissions table
export const contactSubmissionsTable = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'), // nullable
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
export type NewContactSubmission = typeof contactSubmissionsTable.$inferInsert;

// Export tables for relation queries
export const tables = {
  services: servicesTable,
  testimonials: testimonialsTable,
  contactSubmissions: contactSubmissionsTable,
};
