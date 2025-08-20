import { serial, text, pgTable, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Engineering disciplines enum for PostgreSQL
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
  'Materials'
]);

// Job listings table
export const jobListingsTable = pgTable('job_listings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company_name: text('company_name').notNull(),
  location: text('location').notNull(),
  engineering_discipline: engineeringDisciplineEnum('engineering_discipline').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'), // Nullable by default
  salary_range: text('salary_range'), // Nullable by default
  employment_type: text('employment_type').notNull().default('Full-time'),
  remote_friendly: boolean('remote_friendly').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type JobListing = typeof jobListingsTable.$inferSelect; // For SELECT operations
export type NewJobListing = typeof jobListingsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  jobListings: jobListingsTable 
};
