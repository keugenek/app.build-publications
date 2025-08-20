import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define skill level enum for database
export const skillLevelEnum = pgEnum('skill_level', ['Beginner', 'Intermediate', 'Advanced']);

// Define connection request status enum
export const connectionStatusEnum = pgEnum('connection_status', ['pending', 'accepted', 'declined']);

// User profiles table
export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  bio: text('bio'), // Nullable by default
  skill_level: skillLevelEnum('skill_level').notNull(),
  location: text('location').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Connection requests table
export const connectionRequestsTable = pgTable('connection_requests', {
  id: serial('id').primaryKey(),
  requester_id: serial('requester_id').notNull().references(() => userProfilesTable.id),
  receiver_id: serial('receiver_id').notNull().references(() => userProfilesTable.id),
  status: connectionStatusEnum('status').notNull().default('pending'),
  message: text('message'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const userProfilesRelations = relations(userProfilesTable, ({ many }) => ({
  sentRequests: many(connectionRequestsTable, { relationName: 'requester' }),
  receivedRequests: many(connectionRequestsTable, { relationName: 'receiver' }),
}));

export const connectionRequestsRelations = relations(connectionRequestsTable, ({ one }) => ({
  requester: one(userProfilesTable, {
    fields: [connectionRequestsTable.requester_id],
    references: [userProfilesTable.id],
    relationName: 'requester',
  }),
  receiver: one(userProfilesTable, {
    fields: [connectionRequestsTable.receiver_id],
    references: [userProfilesTable.id],
    relationName: 'receiver',
  }),
}));

// TypeScript types for the table schemas
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type NewUserProfile = typeof userProfilesTable.$inferInsert;
export type ConnectionRequest = typeof connectionRequestsTable.$inferSelect;
export type NewConnectionRequest = typeof connectionRequestsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  userProfiles: userProfilesTable,
  connectionRequests: connectionRequestsTable 
};
