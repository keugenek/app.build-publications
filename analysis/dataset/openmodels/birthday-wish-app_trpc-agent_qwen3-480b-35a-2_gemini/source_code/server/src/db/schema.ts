import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const birthdayMessagesTable = pgTable('birthday_messages', {
  id: serial('id').primaryKey(),
  recipient_name: text('recipient_name').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const galleryImagesTable = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type BirthdayMessage = typeof birthdayMessagesTable.$inferSelect;
export type NewBirthdayMessage = typeof birthdayMessagesTable.$inferInsert;

export type GalleryImage = typeof galleryImagesTable.$inferSelect;
export type NewGalleryImage = typeof galleryImagesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  birthdayMessages: birthdayMessagesTable, 
  galleryImages: galleryImagesTable 
};
