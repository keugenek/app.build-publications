import { serial, text, pgTable, timestamp, integer, primaryKey, foreignKey } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Collections table
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for bookmarks and tags (many-to-many)
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.tag_id] }),
  };
});

// Junction table for bookmarks and collections (many-to-many)
export const bookmarkCollectionsTable = pgTable('bookmark_collections', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  collection_id: integer('collection_id').notNull().references(() => collectionsTable.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.collection_id] }),
  };
});

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Bookmark = typeof bookmarksTable.$inferSelect;
export type NewBookmark = typeof bookmarksTable.$inferInsert;

export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

export type Collection = typeof collectionsTable.$inferSelect;
export type NewCollection = typeof collectionsTable.$inferInsert;

export type BookmarkTag = typeof bookmarkTagsTable.$inferSelect;
export type NewBookmarkTag = typeof bookmarkTagsTable.$inferInsert;

export type BookmarkCollection = typeof bookmarkCollectionsTable.$inferSelect;
export type NewBookmarkCollection = typeof bookmarkCollectionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  users: usersTable, 
  bookmarks: bookmarksTable, 
  tags: tagsTable, 
  collections: collectionsTable,
  bookmarkTags: bookmarkTagsTable,
  bookmarkCollections: bookmarkCollectionsTable
};
