import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// PostgreSQL enum for engineering disciplines
export const engineeringDisciplineEnum = pgEnum('engineering_discipline', [
  'Software',
  'Mechanical',
  'Electrical',
  'Civil',
  'Chemical',
  'Aerospace',
]);

export const jobsTable = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company_name: text('company_name').notNull(),
  description: text('description'), // nullable by default
  // Store multiple disciplines as enum array
  disciplines: engineeringDisciplineEnum('disciplines').array().notNull(),
  location: text('location').notNull(),
  salary_min: integer('salary_min'), // nullable
  salary_max: integer('salary_max'), // nullable
  experience_years: integer('experience_years').notNull(),
  application_url: text('application_url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type Job = typeof jobsTable.$inferSelect;
export type NewJob = typeof jobsTable.$inferInsert;

// Export tables for drizzle relation queries
export const tables = {
  jobs: jobsTable,
};
