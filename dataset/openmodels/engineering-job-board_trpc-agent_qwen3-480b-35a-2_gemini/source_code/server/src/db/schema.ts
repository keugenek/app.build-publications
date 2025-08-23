import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define the engineering disciplines enum
export const engineeringDisciplineEnum = pgEnum('engineering_discipline', [
  'Software Engineering',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cybersecurity',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'Cloud Engineering',
  'Database Engineering',
  'Systems Engineering',
  'Network Engineering',
  'Embedded Systems',
  'QA Engineering',
  'Product Engineering',
  'UI/UX Engineering',
  'Other'
]);

// Define location enum
export const locationEnum = pgEnum('location', [
  'Remote',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Los Angeles, CA',
  'Chicago, IL',
  'Boston, MA',
  'Denver, CO',
  'Atlanta, GA',
  'Other'
]);

export const jobsTable = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  discipline: engineeringDisciplineEnum('discipline').notNull(),
  location: locationEnum('location').notNull(),
  company_name: text('company_name').notNull(),
  application_link: text('application_link').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Job = typeof jobsTable.$inferSelect; // For SELECT operations
export type NewJob = typeof jobsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { jobs: jobsTable };
