import { pgTable, serial, text, timestamp, integer, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
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
  name: varchar('name', { length: 50 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Collections table
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for bookmarks and tags (many-to-many)
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.tag_id] })
  };
});

// Junction table for bookmarks and collections (many-to-many)
export const bookmarkCollectionsTable = pgTable('bookmark_collections', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  collection_id: integer('collection_id').notNull().references(() => collectionsTable.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.collection_id] })
  };
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  bookmarks: many(bookmarksTable),
  tags: many(tagsTable),
  collections: many(collectionsTable),
}));

export const bookmarksRelations = relations(bookmarksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [bookmarksTable.user_id],
    references: [usersTable.id],
  }),
  tags: many(bookmarkTagsTable),
  collections: many(bookmarkCollectionsTable),
}));

export const tagsRelations = relations(tagsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tagsTable.user_id],
    references: [usersTable.id],
  }),
  bookmarks: many(bookmarkTagsTable),
}));

export const collectionsRelations = relations(collectionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [collectionsTable.user_id],
    references: [usersTable.id],
  }),
  bookmarks: many(bookmarkCollectionsTable),
}));

export const bookmarkTagsRelations = relations(bookmarkTagsTable, ({ one }) => ({
  bookmark: one(bookmarksTable, {
    fields: [bookmarkTagsTable.bookmark_id],
    references: [bookmarksTable.id],
  }),
  tag: one(tagsTable, {
    fields: [bookmarkTagsTable.tag_id],
    references: [tagsTable.id],
  }),
}));

export const bookmarkCollectionsRelations = relations(bookmarkCollectionsTable, ({ one }) => ({
  bookmark: one(bookmarksTable, {
    fields: [bookmarkCollectionsTable.bookmark_id],
    references: [bookmarksTable.id],
  }),
  collection: one(collectionsTable, {
    fields: [bookmarkCollectionsTable.collection_id],
    references: [collectionsTable.id],
  }),
}));

// TypeScript types
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
  bookmarkCollections: bookmarkCollectionsTable,
};
