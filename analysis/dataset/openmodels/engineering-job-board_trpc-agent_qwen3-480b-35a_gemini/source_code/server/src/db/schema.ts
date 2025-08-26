import { serial, text, pgTable, timestamp, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Define the disciplines enum for PostgreSQL
export const disciplineEnum = pgEnum('discipline', [
  'Software Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Data Science',
  'DevOps',
  'QA Engineering',
  'Security Engineering',
  'Systems Engineering',
  'Embedded Systems',
  'AI/ML Engineering',
  'Product Engineering',
  'Other'
]);

export const jobsTable = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  discipline: disciplineEnum('discipline').notNull(),
  salary_min: numeric('salary_min', { precision: 10, scale: 2 }), // Nullable by default
  salary_max: numeric('salary_max', { precision: 10, scale: 2 }), // Nullable by default
  is_remote: boolean('is_remote').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Job = typeof jobsTable.$inferSelect; // For SELECT operations
export type NewJob = typeof jobsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { jobs: jobsTable };