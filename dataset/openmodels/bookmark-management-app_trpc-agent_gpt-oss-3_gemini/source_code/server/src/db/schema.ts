import { pgTable, serial, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

// Collections table (each collection belongs to a user)
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Collection = typeof collectionsTable.$inferSelect;
export type NewCollection = typeof collectionsTable.$inferInsert;

// Tags table (each tag belongs to a user)
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

// Bookmarks table (each bookmark belongs to a user, optionally a collection)
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => usersTable.id),
  collection_id: integer('collection_id')
    .references(() => collectionsTable.id), // nullable by default when not .notNull()
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'), // nullable column
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Bookmark = typeof bookmarksTable.$inferSelect;
export type NewBookmark = typeof bookmarksTable.$inferInsert;

// Many‑to‑many relation between bookmarks and tags
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id')
    .notNull()
    .references(() => bookmarksTable.id),
  tag_id: integer('tag_id')
    .notNull()
    .references(() => tagsTable.id),
});

export type BookmarkTag = typeof bookmarkTagsTable.$inferSelect;
export type NewBookmarkTag = typeof bookmarkTagsTable.$inferInsert;

// Export tables collection for drizzle relation queries
export const tables = {
  users: usersTable,
  collections: collectionsTable,
  tags: tagsTable,
  bookmarks: bookmarksTable,
  bookmark_tags: bookmarkTagsTable,
};
