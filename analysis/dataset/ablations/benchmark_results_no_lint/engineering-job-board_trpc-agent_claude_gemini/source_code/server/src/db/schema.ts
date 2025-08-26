import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Engineering discipline enum for database
export const engineeringDisciplineEnum = pgEnum('engineering_discipline', [
  'Software',
  'Hardware',
  'Civil',
  'Mechanical',
  'Electrical',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial'
]);

// Job listings table
export const jobListingsTable = pgTable('job_listings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company_name: text('company_name').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  engineering_discipline: engineeringDisciplineEnum('engineering_discipline').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type JobListing = typeof jobListingsTable.$inferSelect; // For SELECT operations
export type NewJobListing = typeof jobListingsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { jobListings: jobListingsTable };
