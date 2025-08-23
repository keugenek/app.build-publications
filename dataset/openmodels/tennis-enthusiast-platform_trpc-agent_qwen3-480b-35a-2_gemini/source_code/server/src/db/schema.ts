import { serial, text, pgTable, timestamp, integer, pgEnum as drizzleEnum } from 'drizzle-orm/pg-core';

// Skill level enum
export const skillLevelEnum = drizzleEnum('skill_level', ['beginner', 'intermediate', 'advanced']);

// User profiles table
export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  skill_level: skillLevelEnum('skill_level').notNull(),
  location: text('location').notNull(),
  bio: text('bio'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  sender_id: integer('sender_id').notNull().references(() => userProfilesTable.id),
  recipient_id: integer('recipient_id').notNull().references(() => userProfilesTable.id),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type NewUserProfile = typeof userProfilesTable.$inferInsert;

export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  userProfiles: userProfilesTable, 
  messages: messagesTable 
};
