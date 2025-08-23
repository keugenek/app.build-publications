import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Folders table
export const foldersTable = pgTable('folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  parent_id: integer('parent_id').references((): any => foldersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Notes table
export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  folder_id: integer('folder_id').references(() => foldersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Folder = typeof foldersTable.$inferSelect;
export type NewFolder = typeof foldersTable.$inferInsert;

export type Note = typeof notesTable.$inferSelect;
export type NewNote = typeof notesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { users: usersTable, folders: foldersTable, notes: notesTable };
