import { pgTable, serial, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { skillLevelEnum } from '../schema';

// -----------------------------------------------------------------------------
// Enum definition for skill level – must match the Zod enum
// -----------------------------------------------------------------------------
export const skillLevel = pgEnum('skill_level', skillLevelEnum);

// -----------------------------------------------------------------------------
// Users table – stores player profiles
// -----------------------------------------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  bio: text('bio'), // nullable by default (no .notNull())
  skill_level: skillLevel('skill_level').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// Messages table – direct messages between users
// -----------------------------------------------------------------------------
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  sender_id: integer('sender_id').references(() => users.id), // foreign key
  receiver_id: serial('receiver_id').references(() => users.id), // foreign key
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export TypeScript types for SELECT/INSERT operations
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Export all tables for relation queries
export const tables = { users, messages };
