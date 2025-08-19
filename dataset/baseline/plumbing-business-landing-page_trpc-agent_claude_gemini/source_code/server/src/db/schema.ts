import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // Icon class name or SVG path
  price_range: text('price_range'), // e.g., "$150-$300", nullable
  is_featured: boolean('is_featured').notNull().default(false),
  display_order: integer('display_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_location: text('customer_location'), // e.g., "Downtown Seattle", nullable
  rating: integer('rating').notNull(), // 1-5 stars
  review_text: text('review_text').notNull(),
  service_type: text('service_type'), // e.g., "Emergency Repair", nullable
  is_featured: boolean('is_featured').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const contactInquiriesTable = pgTable('contact_inquiries', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'), // Optional phone number
  service_needed: text('service_needed'), // Which service they're interested in
  message: text('message').notNull(),
  is_urgent: boolean('is_urgent').notNull().default(false),
  status: text('status').notNull().default('new'), // 'new', 'contacted', 'scheduled', 'completed', 'cancelled'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type Testimonial = typeof testimonialsTable.$inferSelect;
export type NewTestimonial = typeof testimonialsTable.$inferInsert;

export type ContactInquiry = typeof contactInquiriesTable.$inferSelect;
export type NewContactInquiry = typeof contactInquiriesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  services: servicesTable,
  testimonials: testimonialsTable,
  contactInquiries: contactInquiriesTable
};
