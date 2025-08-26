import { serial, text, pgTable, timestamp, pgEnum as drizzlePgEnum } from 'drizzle-orm/pg-core';

// Define skill level enum
export const skillLevelEnum = drizzlePgEnum('skill_level', ['Beginner', 'Intermediate', 'Advanced']);

// Players table
export const playersTable = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  skill_level: skillLevelEnum('skill_level').notNull(),
  city: text('city').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Player = typeof playersTable.$inferSelect; // For SELECT operations
export type NewPlayer = typeof playersTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { players: playersTable };
