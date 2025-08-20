import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const foldersTable = pgTable('folders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  folder_id: integer('folder_id').references(() => foldersTable.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations for better query building
export const usersRelations = relations(usersTable, ({ many }) => ({
  folders: many(foldersTable),
  notes: many(notesTable),
}));

export const foldersRelations = relations(foldersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [foldersTable.user_id],
    references: [usersTable.id],
  }),
  notes: many(notesTable),
}));

export const notesRelations = relations(notesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notesTable.user_id],
    references: [usersTable.id],
  }),
  folder: one(foldersTable, {
    fields: [notesTable.folder_id],
    references: [foldersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Folder = typeof foldersTable.$inferSelect;
export type NewFolder = typeof foldersTable.$inferInsert;
export type Note = typeof notesTable.$inferSelect;
export type NewNote = typeof notesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  folders: foldersTable, 
  notes: notesTable 
};
