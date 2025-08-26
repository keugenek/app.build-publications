import { serial, text, pgTable, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Members table
export const membersTable = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Chores table
export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Assignments table
export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  chore_id: integer('chore_id').notNull(),
  member_id: integer('member_id').notNull(),
  week_start: date('week_start').notNull(), // Store as date (Monday of the week)
  is_completed: boolean('is_completed').notNull().default(false),
  completed_at: timestamp('completed_at'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const membersRelations = relations(membersTable, ({ many }) => ({
  assignments: many(assignmentsTable),
}));

export const choresRelations = relations(choresTable, ({ many }) => ({
  assignments: many(assignmentsTable),
}));

export const assignmentsRelations = relations(assignmentsTable, ({ one }) => ({
  member: one(membersTable, {
    fields: [assignmentsTable.member_id],
    references: [membersTable.id],
  }),
  chore: one(choresTable, {
    fields: [assignmentsTable.chore_id],
    references: [choresTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Member = typeof membersTable.$inferSelect;
export type NewMember = typeof membersTable.$inferInsert;

export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type Assignment = typeof assignmentsTable.$inferSelect;
export type NewAssignment = typeof assignmentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  members: membersTable, 
  chores: choresTable, 
  assignments: assignmentsTable 
};
