import { serial, text, timestamp, integer, pgTable } from 'drizzle-orm/pg-core';

// ----- Messages table -----
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ----- Photos table -----
export const photosTable = pgTable('photos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  caption: text('caption'), // nullable by default
  order: integer('order').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

export type Photo = typeof photosTable.$inferSelect;
export type NewPhoto = typeof photosTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  messages: messagesTable,
  photos: photosTable,
};
