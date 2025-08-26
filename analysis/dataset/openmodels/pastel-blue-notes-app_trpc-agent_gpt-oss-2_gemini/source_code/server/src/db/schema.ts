import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ---------- Users ----------
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Folders ----------
export const foldersTable = pgTable('folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Notes ----------
export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  folder_id: integer('folder_id').references(() => foldersTable.id), // nullable by default
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Export table collection for relation queries
export const tables = {
  users: usersTable,
  folders: foldersTable,
  notes: notesTable,
};
