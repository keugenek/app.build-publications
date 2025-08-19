import { serial, text, pgTable, timestamp, integer, boolean, date, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Participants table
export const participantsTable = pgTable('participants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Chores table
export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Weeks table - tracks different weeks for assignment history
export const weeksTable = pgTable('weeks', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  week_number: integer('week_number').notNull(), // 1-53 based on ISO week
  start_date: date('start_date').notNull(), // Monday of the week
  end_date: date('end_date').notNull(), // Sunday of the week
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Assignments table - tracks chore assignments for specific weeks
export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  week_id: integer('week_id').notNull().references(() => weeksTable.id),
  participant_id: integer('participant_id').notNull().references(() => participantsTable.id),
  chore_id: integer('chore_id').notNull().references(() => choresTable.id),
  is_completed: boolean('is_completed').default(false).notNull(),
  completed_at: timestamp('completed_at'), // Nullable - only set when completed
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const participantsRelations = relations(participantsTable, ({ many }) => ({
  assignments: many(assignmentsTable),
}));

export const choresRelations = relations(choresTable, ({ many }) => ({
  assignments: many(assignmentsTable),
}));

export const weeksRelations = relations(weeksTable, ({ many }) => ({
  assignments: many(assignmentsTable),
}));

export const assignmentsRelations = relations(assignmentsTable, ({ one }) => ({
  week: one(weeksTable, {
    fields: [assignmentsTable.week_id],
    references: [weeksTable.id],
  }),
  participant: one(participantsTable, {
    fields: [assignmentsTable.participant_id],
    references: [participantsTable.id],
  }),
  chore: one(choresTable, {
    fields: [assignmentsTable.chore_id],
    references: [choresTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Participant = typeof participantsTable.$inferSelect;
export type NewParticipant = typeof participantsTable.$inferInsert;

export type Chore = typeof choresTable.$inferSelect;
export type NewChore = typeof choresTable.$inferInsert;

export type Week = typeof weeksTable.$inferSelect;
export type NewWeek = typeof weeksTable.$inferInsert;

export type Assignment = typeof assignmentsTable.$inferSelect;
export type NewAssignment = typeof assignmentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  participants: participantsTable,
  chores: choresTable,
  weeks: weeksTable,
  assignments: assignmentsTable,
};

export const relations_exports = {
  participantsRelations,
  choresRelations,
  weeksRelations,
  assignmentsRelations,
};
