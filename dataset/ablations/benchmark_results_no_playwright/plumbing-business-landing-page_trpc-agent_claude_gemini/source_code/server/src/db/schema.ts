import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

// Contact form submissions table for lead generation
export const contactFormsTable = pgTable('contact_forms', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone_number: text('phone_number').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Plumbing services table (static content)
export const plumbingServicesTable = pgTable('plumbing_services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon'), // Nullable field for service icons/images
  display_order: integer('display_order').notNull(),
});

// Customer testimonials table (static content)
export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  rating: integer('rating').notNull(), // 1-5 star rating
  testimonial_text: text('testimonial_text').notNull(),
  service_type: text('service_type'), // Nullable field for which service was provided
  created_at: timestamp('created_at').defaultNow().notNull(),
  display_order: integer('display_order').notNull(),
});

// TypeScript types for the table schemas
export type ContactForm = typeof contactFormsTable.$inferSelect;
export type NewContactForm = typeof contactFormsTable.$inferInsert;
export type PlumbingService = typeof plumbingServicesTable.$inferSelect;
export type NewPlumbingService = typeof plumbingServicesTable.$inferInsert;
export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

// Important: Export all tables for proper query building
export const tables = { 
  contactForms: contactFormsTable,
  plumbingServices: plumbingServicesTable,
  testimonials: testimonialsTable
};
