import { serial, text, numeric, integer, timestamp, pgTable } from 'drizzle-orm/pg-core';

// Services offered by the plumbing business
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(), // monetary value
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Customer testimonials
export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  message: text('message').notNull(),
  rating: integer('rating').notNull(), // 1-5 rating
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Leads from contact form
export const leadsTable = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export table types for SELECT and INSERT operations
export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

export type Lead = typeof leadsTable.$inferSelect;
export type NewLead = typeof leadsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  services: servicesTable,
  testimonials: testimonialsTable,
  leads: leadsTable,
};
