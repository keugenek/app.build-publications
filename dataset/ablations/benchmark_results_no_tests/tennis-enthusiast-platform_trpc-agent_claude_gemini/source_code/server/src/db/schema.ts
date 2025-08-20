import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for skill levels
export const skillLevelEnum = pgEnum('skill_level', ['Beginner', 'Intermediate', 'Advanced']);

// Connection status enum
export const connectionStatusEnum = pgEnum('connection_status', ['pending', 'accepted', 'declined']);

// User profiles table
export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  skill_level: skillLevelEnum('skill_level').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  bio: text('bio').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Connections table for expressing interest between players
export const connectionsTable = pgTable('connections', {
  id: serial('id').primaryKey(),
  requester_id: serial('requester_id').notNull().references(() => userProfilesTable.id),
  target_id: serial('target_id').notNull().references(() => userProfilesTable.id),
  status: connectionStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const userProfilesRelations = relations(userProfilesTable, ({ many }) => ({
  sentConnections: many(connectionsTable, { relationName: 'requester' }),
  receivedConnections: many(connectionsTable, { relationName: 'target' }),
}));

export const connectionsRelations = relations(connectionsTable, ({ one }) => ({
  requester: one(userProfilesTable, {
    fields: [connectionsTable.requester_id],
    references: [userProfilesTable.id],
    relationName: 'requester',
  }),
  target: one(userProfilesTable, {
    fields: [connectionsTable.target_id],
    references: [userProfilesTable.id],
    relationName: 'target',
  }),
}));

// TypeScript types for the table schemas
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type NewUserProfile = typeof userProfilesTable.$inferInsert;
export type Connection = typeof connectionsTable.$inferSelect;
export type NewConnection = typeof connectionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  userProfiles: userProfilesTable, 
  connections: connectionsTable 
};
