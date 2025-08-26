import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

// Users table – stores authentication credentials
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(), // hashed password
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Folders (categories) – each belongs to a user
export const foldersTable = pgTable('folders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Notes – plain‑text notes that may belong to a folder
export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  folder_id: integer('folder_id')
    .references(() => foldersTable.id), // nullable by default (no .notNull())
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Export table types for SELECT/INSERT operations
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Folder = typeof foldersTable.$inferSelect;
export type NewFolder = typeof foldersTable.$inferInsert;

export type Note = typeof notesTable.$inferSelect;
export type NewNote = typeof notesTable.$inferInsert;

// Export all tables for relation queries in drizzle setup
export const tables = {
  users: usersTable,
  folders: foldersTable,
  notes: notesTable,
};
