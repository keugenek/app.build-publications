import { pgTable, serial, text, varchar, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookmarks table
export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description'), // nullable by default
  user_id: integer('user_id').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tags table
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  user_id: integer('user_id').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Collections table
export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  user_id: integer('user_id').references(() => users.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Many-to-Many linking tables
export const bookmarkTags = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id').references(() => bookmarks.id).notNull(),
  tag_id: integer('tag_id').references(() => tags.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookmark_id, t.tag_id] }),
}));

export const bookmarkCollections = pgTable('bookmark_collections', {
  bookmark_id: integer('bookmark_id').references(() => bookmarks.id).notNull(),
  collection_id: integer('collection_id').references(() => collections.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.bookmark_id, t.collection_id] }),
}));

// Export table types for convenience
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

// Export all tables for relation queries
export const tables = { users, bookmarks, tags, collections, bookmarkTags, bookmarkCollections };
