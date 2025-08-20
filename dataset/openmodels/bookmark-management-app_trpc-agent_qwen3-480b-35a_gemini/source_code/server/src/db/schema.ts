import { pgTable, serial, text, timestamp, integer, boolean, primaryKey, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  is_public: boolean('is_public').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Collections table
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  description: text('description'),
  is_public: boolean('is_public').default(false).notNull(),
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

// Junction table for bookmarks and collections
export const bookmarkCollectionsTable = pgTable('bookmark_collections', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  collection_id: integer('collection_id').notNull().references(() => collectionsTable.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.collection_id] }),
  };
});

// Junction table for bookmarks and tags
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.tag_id] }),
  };
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  bookmarks: many(bookmarksTable),
  collections: many(collectionsTable),
  tags: many(tagsTable),
}));

export const bookmarksRelations = relations(bookmarksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [bookmarksTable.user_id],
    references: [usersTable.id],
  }),
  collections: many(bookmarkCollectionsTable),
  tags: many(bookmarkTagsTable),
}));

export const collectionsRelations = relations(collectionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [collectionsTable.user_id],
    references: [usersTable.id],
  }),
  bookmarks: many(bookmarkCollectionsTable),
}));

export const tagsRelations = relations(tagsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tagsTable.user_id],
    references: [usersTable.id],
  }),
  bookmarks: many(bookmarkTagsTable),
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

// TypeScript types
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Bookmark = typeof bookmarksTable.$inferSelect;
export type NewBookmark = typeof bookmarksTable.$inferInsert;

export type Collection = typeof collectionsTable.$inferSelect;
export type NewCollection = typeof collectionsTable.$inferInsert;

export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

export type BookmarkCollection = typeof bookmarkCollectionsTable.$inferSelect;
export type NewBookmarkCollection = typeof bookmarkCollectionsTable.$inferInsert;

export type BookmarkTag = typeof bookmarkTagsTable.$inferSelect;
export type NewBookmarkTag = typeof bookmarkTagsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  bookmarks: bookmarksTable,
  collections: collectionsTable,
  tags: tagsTable,
  bookmarkCollections: bookmarkCollectionsTable,
  bookmarkTags: bookmarkTagsTable,
};
