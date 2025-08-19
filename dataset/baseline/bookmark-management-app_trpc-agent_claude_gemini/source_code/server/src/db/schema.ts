import { serial, text, pgTable, timestamp, integer, varchar, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Collections table
export const collectionsTable = pgTable('collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'), // Nullable by default
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userCollectionNameIdx: unique().on(table.user_id, table.name), // Unique collection name per user
  userIdIdx: index('collections_user_id_idx').on(table.user_id),
}));

// Tags table
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userTagNameIdx: unique().on(table.user_id, table.name), // Unique tag name per user
  userIdIdx: index('tags_user_id_idx').on(table.user_id),
}));

// Bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'), // Nullable by default
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  collection_id: integer('collection_id').references(() => collectionsTable.id, { onDelete: 'set null' }), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('bookmarks_user_id_idx').on(table.user_id),
  collectionIdIdx: index('bookmarks_collection_id_idx').on(table.collection_id),
  titleIdx: index('bookmarks_title_idx').on(table.title),
  urlIdx: index('bookmarks_url_idx').on(table.url),
}));

// Bookmark tags junction table (many-to-many)
export const bookmarkTagsTable = pgTable('bookmark_tags', {
  id: serial('id').primaryKey(),
  bookmark_id: integer('bookmark_id').notNull().references(() => bookmarksTable.id, { onDelete: 'cascade' }),
  tag_id: integer('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  bookmarkTagIdx: unique().on(table.bookmark_id, table.tag_id), // Prevent duplicate associations
  bookmarkIdIdx: index('bookmark_tags_bookmark_id_idx').on(table.bookmark_id),
  tagIdIdx: index('bookmark_tags_tag_id_idx').on(table.tag_id),
}));

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  collections: many(collectionsTable),
  tags: many(tagsTable),
  bookmarks: many(bookmarksTable),
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
