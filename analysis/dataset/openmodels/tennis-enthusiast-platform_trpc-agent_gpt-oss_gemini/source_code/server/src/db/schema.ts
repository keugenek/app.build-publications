import { pgTable, serial, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

// Enums
export const skillLevelEnum = pgEnum('skill_level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const);
export const matchStatusEnum = pgEnum('match_status', ['PENDING', 'ACCEPTED', 'COMPLETED'] as const);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  skill_level: skillLevelEnum('skill_level').notNull(),
  location: text('location').notNull(),
  profile_picture_url: text('profile_picture_url'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Matches table
export const matchesTable = pgTable('matches', {
  id: serial('id').primaryKey(),
  player_one_id: integer('player_one_id').notNull(), // foreign key to users.id (relations omitted for brevity)
  player_two_id: integer('player_two_id').notNull(),
  scheduled_at: timestamp('scheduled_at').notNull(),
  status: matchStatusEnum('status').default('PENDING').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  match_id: integer('match_id').notNull(),
  sender_id: integer('sender_id').notNull(),
  content: text('content').notNull(),
  sent_at: timestamp('sent_at').defaultNow().notNull(),
});

// Export inferred types for select/insert
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Match = typeof matchesTable.$inferSelect;
export type NewMatch = typeof matchesTable.$inferInsert;

export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

// Export tables collection for drizzle relation queries
export const tables = {
  users: usersTable,
  matches: matchesTable,
  messages: messagesTable,
};
