import { pgTable, serial, text, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { disciplineEnum } from '../schema';

// Define PostgreSQL enum for engineering disciplines
export const jobDisciplineEnum = pgEnum('job_discipline', [
  'Software',
  'Mechanical',
  'Electrical',
  'Civil',
  'Aerospace',
]);

export const jobsTable = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable by default matches Zod nullable()
  discipline: jobDisciplineEnum('discipline').notNull(),
  location: text('location').notNull(),
  salary: numeric('salary', { precision: 10, scale: 2 }), // nullable, optional salary
  posted_at: timestamp('posted_at').defaultNow().notNull(),
});

// Types inferred from the table schema
export type Job = typeof jobsTable.$inferSelect;
export type NewJob = typeof jobsTable.$inferInsert;

// Export tables for relation queries
export const tables = { jobs: jobsTable };
