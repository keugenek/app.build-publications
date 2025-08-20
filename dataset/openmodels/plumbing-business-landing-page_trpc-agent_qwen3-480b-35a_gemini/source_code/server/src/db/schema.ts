import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

// Services table
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon'), // For storing icon names or paths
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Testimonials table
export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull(), // 1-5 star rating
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Contact form submissions table
export const contactSubmissionsTable = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
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

// Export all tables for relation queries
export const tables = { 
  services: servicesTable, 
  testimonials: testimonialsTable, 
  contactSubmissions: contactSubmissionsTable 
};
