import { serial, text, pgTable, timestamp, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Collections table
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'), // Nullable by default
  user_id: integer('user_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }), // Nullable for hex colors like #FF0000
  user_id: integer('user_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'), // Nullable by default
  user_id: integer('user_id').notNull(),
  collection_id: integer('collection_id'), // Nullable - bookmarks don't require a collection
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Many-to-many relationship table for bookmarks and tags
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  bookmark_id: integer('bookmark_id').notNull(),
  tag_id: integer('tag_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bookmark_id, table.tag_id] }),
  };
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  bookmarks: many(bookmarksTable),
  collections: many(collectionsTable),
  tags: many(tagsTable),
}));

export const collectionsRelations = relations(collectionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [collectionsTable.user_id],
    references: [usersTable.id],
  }),
  bookmarks: many(bookmarksTable),
}));

export const tagsRelations = relations(tagsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tagsTable.user_id],
    references: [usersTable.id],
  }),
  bookmarkTags: many(bookmarkTagsTable),
}));

export const bookmarksRelations = relations(bookmarksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [bookmarksTable.user_id],
    references: [usersTable.id],
  }),
  collection: one(collectionsTable, {
    fields: [bookmarksTable.collection_id],
    references: [collectionsTable.id],
  }),
  bookmarkTags: many(bookmarkTagsTable),
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

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Collection = typeof collectionsTable.$inferSelect;
export type NewCollection = typeof collectionsTable.$inferInsert;

export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

export type Bookmark = typeof bookmarksTable.$inferSelect;
export type NewBookmark = typeof bookmarksTable.$inferInsert;

export type BookmarkTag = typeof bookmarkTagsTable.$inferSelect;
export type NewBookmarkTag = typeof bookmarkTagsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  collections: collectionsTable,
  tags: tagsTable,
  bookmarks: bookmarksTable,
  bookmarkTags: bookmarkTagsTable,
};
