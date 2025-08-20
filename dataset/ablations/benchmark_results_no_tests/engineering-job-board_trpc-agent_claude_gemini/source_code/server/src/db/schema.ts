import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Engineering discipline enum for PostgreSQL
export const engineeringDisciplineEnum = pgEnum('engineering_discipline', [
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Aerospace',
  'Biomedical',
  'Environmental',
  'Industrial',
  'Other'
]);

// Job listings table
export const jobListingsTable = pgTable('job_listings', {
  id: serial('id').primaryKey(),
  job_title: text('job_title').notNull(),
  company_name: text('company_name').notNull(),
  engineering_discipline: engineeringDisciplineEnum('engineering_discipline').notNull(),
  location: text('location').notNull(),
  job_description: text('job_description').notNull(),
  application_link: text('application_link').notNull(), // URL or email address
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type JobListing = typeof jobListingsTable.$inferSelect; // For SELECT operations
export type NewJobListing = typeof jobListingsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { jobListings: jobListingsTable };
