import { serial, text, pgTable, timestamp, integer, numeric, varchar } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Collections table
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  description: text('description'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  url: text('url').notNull(),
  title: text('title'), // nullable
  description: text('description'), // nullable
  collection_id: integer('collection_id').references(() => collectionsTable.id), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for bookmark <-> tag many-to-many relationship
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id),
});

// Export table collection for drizzle relation queries
export const tables = {
  users: usersTable,
  collections: collectionsTable,
  tags: tagsTable,
  bookmarks: bookmarksTable,
  bookmarkTags: bookmarkTagsTable,
};
