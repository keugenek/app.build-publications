import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Define the same enum values as in schema.ts for consistency
export const engineeringDisciplineEnum = pgEnum('engineering_discipline', [
  'Software',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
]);

export const jobsTable = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  discipline: engineeringDisciplineEnum('discipline').notNull(),
  description: text('description').notNull(),
  application_contact: text('application_contact').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for queries
export type Job = typeof jobsTable.$inferSelect;
export type NewJob = typeof jobsTable.$inferInsert;

// Export tables object for relation queries
export const tables = {
  jobs: jobsTable,
};
