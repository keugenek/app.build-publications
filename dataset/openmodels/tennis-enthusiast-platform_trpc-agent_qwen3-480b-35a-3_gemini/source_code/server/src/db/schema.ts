import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { skillLevelEnum } from '../schema';

// Define skill level enum for PostgreSQL
export const skillLevelDbEnum = pgTable('skill_level_enum', {
  value: text('value').primaryKey(),
});

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  skill_level: text('skill_level', { enum: ['Beginner', 'Intermediate', 'Advanced'] }).notNull(),
  location: text('location').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  sender_id: integer('sender_id').notNull().references(() => usersTable.id),
  receiver_id: integer('receiver_id').notNull().references(() => usersTable.id),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { users: usersTable, messages: messagesTable };
