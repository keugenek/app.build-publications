import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

// User profiles table for tennis players
export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  skill_level: text('skill_level').notNull(), // Text description of skill level
  location: text('location').notNull(), // City/State format
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type UserProfile = typeof userProfilesTable.$inferSelect; // For SELECT operations
export type NewUserProfile = typeof userProfilesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { userProfiles: userProfilesTable };
