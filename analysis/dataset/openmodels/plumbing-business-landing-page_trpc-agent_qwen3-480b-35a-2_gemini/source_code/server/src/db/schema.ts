import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_location: text('customer_location').notNull(),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull(), // 1-5 star rating
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const contactFormsTable = pgTable('contact_forms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

export type ContactForm = typeof contactFormsTable.$inferSelect;
export type NewContactForm = typeof contactFormsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  services: servicesTable, 
  testimonials: testimonialsTable, 
  contactForms: contactFormsTable 
};