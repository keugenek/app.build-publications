import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

// Define allowed engineering disciplines for database enum
export const engineeringDisciplines = [
  'Software Engineering',
  'Data Engineering',
  'DevOps Engineering',
  'Machine Learning Engineering',
  'Security Engineering',
  'Frontend Engineering',
  'Backend Engineering',
  'Full Stack Engineering',
  'Embedded Systems Engineering',
  'Cloud Engineering',
  'Infrastructure Engineering',
  'Quality Assurance Engineering',
  'Site Reliability Engineering',
  'Systems Engineering',
  'Mobile Engineering',
  'Game Development',
  'Blockchain Engineering',
  'AI Engineering',
] as const;

export const jobListingsTable = pgTable('job_listings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  discipline: text('discipline', { enum: engineeringDisciplines }).notNull(),
  location: text('location').notNull(),
  company_name: text('company_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type JobListing = typeof jobListingsTable.$inferSelect; // For SELECT operations
export type NewJobListing = typeof jobListingsTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { jobListings: jobListingsTable };
